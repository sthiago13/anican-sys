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
export const COP_FALLBACK = 3335.50;

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

      console.log("No se encontraron tasas locales para hoy. Consultando APIs externas...");
      let apiVes = VES_FALLBACK;
      let apiCop = COP_FALLBACK;

      try {
        const vesResponse = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
        if (vesResponse.ok) {
          const vesJson = await vesResponse.json();
          apiVes = Number(vesJson.promedio) || Number(vesJson.venta) || VES_FALLBACK;
          console.log("Tasa VES (BCV oficial) obtenida:", apiVes);
        } else {
          console.warn("Fallo al consultar tasa VES oficial, usando contingencia.");
        }
      } catch (vesErr) {
        console.error("Error al obtener tasa VES (BCV oficial):", vesErr);
      }

      try {
        const copResponse = await fetch("https://co.dolarapi.com/v1/trm");
        if (copResponse.ok) {
          const copJson = await copResponse.json();
          apiCop = Number(copJson.promedio) || Number(copJson.venta) || COP_FALLBACK;
          console.log("Tasa COP (TRM oficial) obtenida:", apiCop);
        } else {
          console.warn("Fallo al consultar tasa COP (TRM) oficial, usando contingencia.");
        }
      } catch (copErr) {
        console.error("Error al obtener tasa COP (TRM oficial):", copErr);
      }

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
      const { error } = await supabase
        .from("tasas_cambio")
        .upsert({
          fecha: hoyStr,
          ...updateData,
        }, { onConflict: "fecha" });

      if (error) throw error;

      setRates((prev) =>
        prev
          ? { ...prev, tasa_ves: tasaVes, tasa_cop: tasaCop }
          : { id: "", fecha: hoyStr, tasa_ves: tasaVes, tasa_cop: tasaCop }
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
