import { useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
import { formatLocalDate } from "../../../utils/date";

export interface TasaCambio {
  id: string;
  fecha: string;
  tasa_ves: number;
  tasa_cop: number;
  actualizado_por?: string;
  updated_at?: string;
}

export const VES_FALLBACK = 700;
export const COP_FALLBACK = 3336.5;

export function useRates() {
  const { user } = useAuth();
  const [rates, setRates] = useState<TasaCambio | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTodayRates = async (): Promise<TasaCambio | null> => {
    setLoading(true);
    const hoyStr = formatLocalDate(new Date());
    try {
      const { data, error } = await supabase
        .from("tasas_cambio")
        .select("*")
        .eq("fecha", hoyStr)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const mappedRates = {
          id: data.id,
          fecha: data.fecha,
          tasa_ves: Number(data.tasa_ves),
          tasa_cop: Number(data.tasa_cop),
          actualizado_por: data.actualizado_por || undefined,
          updated_at: data.updated_at,
        };
        setRates(mappedRates);
        return mappedRates;
      }

      console.log(
        "No se encontraron tasas locales para hoy. Buscando la tasa más reciente registrada...",
      );

      // Buscar la tasa más reciente registrada para usarla como fallback dinámico
      const { data: latestData, error: latestError } = await supabase
        .from("tasas_cambio")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        console.warn(
          "Error al buscar tasas anteriores, usando fallbacks estáticos:",
          latestError,
        );
      }

      const fallbackVes = latestData
        ? Number(latestData.tasa_ves)
        : VES_FALLBACK;
      const fallbackCop = latestData
        ? Number(latestData.tasa_cop)
        : COP_FALLBACK;

      console.log("Consultando APIs externas con fallbacks dinámicos:", {
        fallbackVes,
        fallbackCop,
      });

      let apiVes = fallbackVes;
      let apiCop = fallbackCop;
      let vesIsToday = false;
      let copIsToday = false;

      // 1. Consultar tasa VES (BCV Oficial)
      try {
        const vesResponse = await fetch(
          "https://ve.dolarapi.com/v1/dolares/oficial",
        );
        if (vesResponse.ok) {
          const vesJson = await vesResponse.json();
          const apiFechaVes = vesJson.fechaActualizacion
            ? vesJson.fechaActualizacion.substring(0, 10)
            : "";

          if (apiFechaVes === hoyStr) {
            apiVes =
              Number(vesJson.promedio) || Number(vesJson.venta) || fallbackVes;
            vesIsToday = true;
            console.log("Tasa VES oficial obtenida para hoy:", apiVes);
          } else {
            apiVes =
              Number(vesJson.promedio) || Number(vesJson.venta) || fallbackVes;
            console.log(
              `Tasa VES externa aún no actualizada para hoy (${apiFechaVes}). Usando en memoria:`,
              apiVes,
            );
          }
        } else {
          console.warn(
            "Fallo al consultar tasa VES oficial, usando contingencia.",
          );
        }
      } catch (vesErr) {
        console.error("Error al obtener tasa VES (BCV oficial):", vesErr);
      }

      // 2. Consultar tasa COP (TRM Oficial)
      try {
        const copResponse = await fetch("https://co.dolarapi.com/v1/trm");
        if (copResponse.ok) {
          const copJson = await copResponse.json();
          const apiFechaCop = copJson.fechaActualizacion
            ? copJson.fechaActualizacion.substring(0, 10)
            : "";

          if (apiFechaCop === hoyStr) {
            apiCop =
              Number(copJson.valor) ||
              Number(copJson.promedio) ||
              Number(copJson.venta) ||
              fallbackCop;
            copIsToday = true;
            console.log("Tasa COP oficial obtenida para hoy:", apiCop);
          } else {
            apiCop =
              Number(copJson.valor) ||
              Number(copJson.promedio) ||
              Number(copJson.venta) ||
              fallbackCop;
            console.log(
              `Tasa COP externa aún no actualizada para hoy (${apiFechaCop}). Usando en memoria:`,
              apiCop,
            );
          }
        } else {
          console.warn(
            "Fallo al consultar tasa COP (TRM) oficial, usando contingencia.",
          );
        }
      } catch (copErr) {
        console.error("Error al obtener tasa COP (TRM oficial):", copErr);
      }

      // 3. Determinar si debemos guardar el registro en la base de datos para el día de hoy
      const now = new Date();
      const currentHour = now.getHours();

      // Guardamos en la base de datos si:
      // a) Ambas tasas externas ya están actualizadas para la fecha de hoy
      // b) O si al menos una de las tasas no está actualizada, pero ya es tarde en el día (>= 6:00 AM hora local)
      //    (esto indica fin de semana o feriado, por lo que la tasa no cambiará y no queremos seguir haciendo llamadas)
      const debeGuardar = (vesIsToday && copIsToday) || currentHour >= 6;

      if (!debeGuardar) {
        console.log(
          "Las tasas de la API externa aún no corresponden a hoy y es muy temprano (antes de las 6:00 AM). No se insertará en base de datos para permitir reintentos posteriores.",
        );
        const memoryRates: TasaCambio = {
          id: "temp-rates",
          fecha: hoyStr,
          tasa_ves: apiVes,
          tasa_cop: apiCop,
        };
        setRates(memoryRates);
        return memoryRates;
      }

      console.log("Guardando tasas en base de datos para hoy...", {
        apiVes,
        apiCop,
      });
      const cleanData = {
        fecha: hoyStr,
        tasa_ves: apiVes,
        tasa_cop: apiCop,
        actualizado_por: user?.id || null,
      };

      const { data: insertData, error: insertError } = await supabase
        .from("tasas_cambio")
        .insert([cleanData])
        .select()
        .single();

      if (insertError) throw insertError;

      if (insertData) {
        const insertedRates = {
          id: insertData.id,
          fecha: insertData.fecha,
          tasa_ves: Number(insertData.tasa_ves),
          tasa_cop: Number(insertData.tasa_cop),
          actualizado_por: insertData.actualizado_por || undefined,
          updated_at: insertData.updated_at,
        };
        setRates(insertedRates);
        return insertedRates;
      }

      return null;
    } catch (err) {
      console.error("Error general en fetchTodayRates:", err);
      const fallbackRates: TasaCambio = {
        id: "",
        fecha: hoyStr,
        tasa_ves: VES_FALLBACK,
        tasa_cop: COP_FALLBACK,
      };
      setRates(fallbackRates);
      return fallbackRates;
    } finally {
      setLoading(false);
    }
  };

  const updateTodayRates = async (tasaVes: number, tasaCop: number) => {
    setLoading(true);
    const hoyStr = formatLocalDate(new Date());
    try {
      if (tasaVes <= 0 || tasaCop <= 0) {
        throw new Error("Las tasas de cambio deben ser mayores que 0.");
      }

      const updateData = {
        tasa_ves: tasaVes,
        tasa_cop: tasaCop,
        actualizado_por: user?.id || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("tasas_cambio").upsert(
        {
          fecha: hoyStr,
          ...updateData,
        },
        { onConflict: "fecha" },
      );

      if (error) throw error;

      setRates((prev) =>
        prev
          ? { ...prev, tasa_ves: tasaVes, tasa_cop: tasaCop }
          : { id: "", fecha: hoyStr, tasa_ves: tasaVes, tasa_cop: tasaCop },
      );
    } catch (err) {
      console.error("Error al actualizar las tasas del día:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTodayRates();
  }, []);

  return {
    rates,
    loading,
    fetchTodayRates,
    updateTodayRates,
  };
}
