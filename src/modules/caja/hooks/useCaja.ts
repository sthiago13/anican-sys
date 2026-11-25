import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { supabase } from "../../../config/supabase";
import { COP_FALLBACK, VES_FALLBACK } from "../../donations/hooks/useRates";
import {
  type MonedaCaja,
  type PuntoConsolidado,
  type PuntoTasaUsd,
  type RangoFechaCaja,
  type SaldoCaja,
  type TasaHistorica,
} from "../types";

export const MONEDAS_CAJA: MonedaCaja[] = ["USD", "VES", "COP"];

interface MovimientoCaja {
  fecha: string;
  moneda: MonedaCaja;
  delta: number;
}

function getCutoffDateStr(range: RangoFechaCaja): string {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return dayjs().subtract(days, "day").format("YYYY-MM-DD");
}

function normalizeCurrency(raw: unknown): MonedaCaja | null {
  const code = String(raw ?? "USD").trim().toUpperCase();
  if (code === "USD" || code === "VES" || code === "COP") {
    return code;
  }
  return null;
}

function formatFechaLabel(fecha: string, range: RangoFechaCaja): string {
  return range === "90d"
    ? dayjs(fecha).format("DD/MM/YY")
    : dayjs(fecha).format("DD MMM");
}

export function useCaja() {
  const [saldos, setSaldos] = useState<SaldoCaja[]>(
    MONEDAS_CAJA.map((moneda) => ({
      moneda,
      saldo_actual: 0,
      updated_at: null,
    }))
  );
  const [tasasHistoricas, setTasasHistoricas] = useState<TasaHistorica[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    const [saldosRes, tasasRes, recibidasRes, entregadasRes] =
      await Promise.all([
        supabase
          .from("caja_monedas")
          .select("moneda, saldo_actual, updated_at"),
        supabase
          .from("tasas_cambio")
          .select("id, fecha, tasa_ves, tasa_cop, updated_at")
          .order("fecha", { ascending: true }),
        supabase
          .from("donaciones_recibidas")
          .select("fecha, moneda, monto_original")
          .not("monto_original", "is", null),
        supabase
          .from("donaciones_entregadas")
          .select("fecha, moneda, monto_original")
          .not("monto_original", "is", null),
      ]);

    if (saldosRes.error) throw saldosRes.error;
    if (tasasRes.error) throw tasasRes.error;
    if (recibidasRes.error) throw recibidasRes.error;
    if (entregadasRes.error) throw entregadasRes.error;

    const saldosMap = new Map<
      MonedaCaja,
      { saldo_actual: number; updated_at: string | null }
    >();

    (saldosRes.data ?? []).forEach((row) => {
      const code = normalizeCurrency(row.moneda);
      if (code) {
        saldosMap.set(code, {
          saldo_actual: Number(row.saldo_actual) || 0,
          updated_at: row.updated_at ?? null,
        });
      }
    });

    const mappedSaldos = MONEDAS_CAJA.map((moneda) => {
      const entry = saldosMap.get(moneda);
      return {
        moneda,
        saldo_actual: entry?.saldo_actual ?? 0,
        updated_at: entry?.updated_at ?? null,
      };
    });

    const mappedRates: TasaHistorica[] = (tasasRes.data ?? []).map((row) => ({
      id: row.id,
      fecha: row.fecha,
      tasa_ves: Number(row.tasa_ves) || 0,
      tasa_cop: Number(row.tasa_cop) || 0,
      updated_at: row.updated_at ?? null,
    }));

    const mappedMovimientos: MovimientoCaja[] = [];

    (recibidasRes.data ?? []).forEach((row) => {
      const moneda = normalizeCurrency(row.moneda);
      const monto = Number(row.monto_original) || 0;
      if (row.fecha && moneda && monto !== 0) {
        mappedMovimientos.push({
          fecha: String(row.fecha).slice(0, 10),
          moneda,
          delta: monto,
        });
      }
    });

    (entregadasRes.data ?? []).forEach((row) => {
      const moneda = normalizeCurrency(row.moneda);
      const monto = Number(row.monto_original) || 0;
      if (row.fecha && moneda && monto !== 0) {
        mappedMovimientos.push({
          fecha: String(row.fecha).slice(0, 10),
          moneda,
          delta: -monto,
        });
      }
    });

    return {
      saldos: mappedSaldos,
      tasasHistoricas: mappedRates,
      movimientos: mappedMovimientos,
    };
  }, []);

  const fetchCajaData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await loadSnapshot();
      setSaldos(snapshot.saldos);
      setTasasHistoricas(snapshot.tasasHistoricas);
      setMovimientos(snapshot.movimientos);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo cargar la información de caja y tasas.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadSnapshot]);

  useEffect(() => {
    let cancelled = false;

    loadSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        setSaldos(snapshot.saldos);
        setTasasHistoricas(snapshot.tasasHistoricas);
        setMovimientos(snapshot.movimientos);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo cargar la información de caja y tasas.";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadSnapshot]);

  const latestRate = useMemo<TasaHistorica | null>(() => {
    if (tasasHistoricas.length === 0) return null;
    return tasasHistoricas[tasasHistoricas.length - 1];
  }, [tasasHistoricas]);

  const activeRates = useMemo(
    () => ({
      tasa_ves:
        latestRate && latestRate.tasa_ves > 0
          ? latestRate.tasa_ves
          : VES_FALLBACK,
      tasa_cop:
        latestRate && latestRate.tasa_cop > 0
          ? latestRate.tasa_cop
          : COP_FALLBACK,
      isFallback: !latestRate,
    }),
    [latestRate]
  );

  const saldosEquivalentesUsd = useMemo<Record<MonedaCaja, number>>(() => {
    const usd = saldos.find((s) => s.moneda === "USD")?.saldo_actual ?? 0;
    const ves = saldos.find((s) => s.moneda === "VES")?.saldo_actual ?? 0;
    const cop = saldos.find((s) => s.moneda === "COP")?.saldo_actual ?? 0;

    return {
      USD: usd,
      VES: ves / activeRates.tasa_ves,
      COP: cop / activeRates.tasa_cop,
    };
  }, [saldos, activeRates]);

  const totalConsolidadoUsd = useMemo(
    () =>
      saldosEquivalentesUsd.USD +
      saldosEquivalentesUsd.VES +
      saldosEquivalentesUsd.COP,
    [saldosEquivalentesUsd]
  );

  const getUsdRatesSeries = useCallback(
    (range: RangoFechaCaja): PuntoTasaUsd[] => {
      const cutoff = getCutoffDateStr(range);
      return tasasHistoricas
        .filter((t) => t.fecha >= cutoff)
        .map((rate) => ({
          fecha: rate.fecha,
          fechaLabel: formatFechaLabel(rate.fecha, range),
          VES: rate.tasa_ves > 0 ? rate.tasa_ves : VES_FALLBACK,
          COP: rate.tasa_cop > 0 ? rate.tasa_cop : COP_FALLBACK,
        }));
    },
    [tasasHistoricas]
  );

  const getConsolidadoSeries = useCallback(
    (range: RangoFechaCaja): PuntoConsolidado[] => {
      if (tasasHistoricas.length === 0 && movimientos.length === 0) {
        return [];
      }

      const ratesByDate = new Map<string, TasaHistorica>();
      tasasHistoricas.forEach((r) => ratesByDate.set(r.fecha, r));

      const deltasByDate = new Map<string, Record<MonedaCaja, number>>();
      movimientos.forEach((m) => {
        const current = deltasByDate.get(m.fecha) ?? { USD: 0, VES: 0, COP: 0 };
        current[m.moneda] += m.delta;
        deltasByDate.set(m.fecha, current);
      });

      const allDates = Array.from(
        new Set([...ratesByDate.keys(), ...deltasByDate.keys()])
      ).sort();

      const runningBalances: Record<MonedaCaja, number> = {
        USD: 0,
        VES: 0,
        COP: 0,
      };

      const firstRate = tasasHistoricas[0];
      let currentVes =
        firstRate && firstRate.tasa_ves > 0 ? firstRate.tasa_ves : VES_FALLBACK;
      let currentCop =
        firstRate && firstRate.tasa_cop > 0 ? firstRate.tasa_cop : COP_FALLBACK;

      const cutoff = getCutoffDateStr(range);
      const series: PuntoConsolidado[] = [];

      allDates.forEach((fecha) => {
        const dayDeltas = deltasByDate.get(fecha);
        if (dayDeltas) {
          runningBalances.USD += dayDeltas.USD;
          runningBalances.VES += dayDeltas.VES;
          runningBalances.COP += dayDeltas.COP;
        }

        const dayRate = ratesByDate.get(fecha);
        if (dayRate) {
          if (dayRate.tasa_ves > 0) currentVes = dayRate.tasa_ves;
          if (dayRate.tasa_cop > 0) currentCop = dayRate.tasa_cop;
        }

        if (fecha >= cutoff) {
          const consolidadoUsd =
            runningBalances.USD +
            runningBalances.VES / currentVes +
            runningBalances.COP / currentCop;

          series.push({
            fecha,
            fechaLabel: formatFechaLabel(fecha, range),
            consolidadoUsd: Number(consolidadoUsd.toFixed(2)),
          });
        }
      });

      return series;
    },
    [tasasHistoricas, movimientos]
  );

  return {
    saldos,
    tasasHistoricas,
    latestRate,
    activeRates,
    totalConsolidadoUsd,
    loading,
    error,
    refetch: fetchCajaData,
    getUsdRatesSeries,
    getConsolidadoSeries,
  };
}
