import { useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
import { type DonacionRecibida, type DonacionEntregada } from "../types";

export function useDonations() {
  const { user } = useAuth();
  const [recibidas, setRecibidas] = useState<DonacionRecibida[]>([]);
  const [entregadas, setEntregadas] = useState<DonacionEntregada[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      // 1. Cargar Donaciones Recibidas (Ingresos)
      const { data: recData, error: recError } = await supabase
        .from("donaciones_recibidas")
        .select("*")
        .order("fecha", { ascending: false });

      if (recError) throw recError;
      setRecibidas(recData || []);

      // 2. Cargar Donaciones Entregadas (Egresos) con joins a pacientes y catalogo_ayudas
      const { data: entData, error: entError } = await supabase
        .from("donaciones_entregadas")
        .select(`
          *,
          pacientes (
            nombres
          ),
          catalogo_ayudas (
            nombre_articulo,
            categoria
          )
        `)
        .order("fecha", { ascending: false });

      if (entError) throw entError;
      setEntregadas((entData || []) as unknown as DonacionEntregada[]);
    } catch (err) {
      console.error("Error al cargar flujos de donaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDonations();
  }, []);

  const handleSaveRecibida = async (
    fecha: string,
    entidadDonante: string,
    metodoIngreso: string,
    montoOCantidad: string,
    observaciones: string,
    moneda: string,
    montoOriginal: number | null,
    tasaCambio: number | null,
    montoEquivalenteUsd: number | null
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("donaciones_recibidas").insert([
        {
          fecha,
          entidad_donante: entidadDonante.trim(),
          metodo_ingreso: metodoIngreso,
          monto_o_cantidad: montoOCantidad.trim(),
          observaciones: observaciones.trim() || null,
          registrado_por: user?.id || null, // Auditoría del usuario logueado (#24)
          moneda,
          monto_original: montoOriginal,
          tasa_cambio: tasaCambio,
          monto_equivalente_usd: montoEquivalenteUsd,
        },
      ]);

      if (error) throw error;
      await fetchDonations();
    } catch (err) {
      console.error("Error al guardar donación recibida:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntregada = async (
    fecha: string,
    idPaciente: string | null,
    beneficiarioExterno: string | null,
    idAyuda: string,
    metodoEntrega: string,
    cantidad: number,
    montoEquivalente: number,
    conSoporte: boolean,
    observaciones: string,
    moneda: string,
    montoOriginal: number,
    tasaCambio: number
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("donaciones_entregadas").insert([
        {
          fecha,
          id_paciente: idPaciente || null,
          beneficiario_externo: beneficiarioExterno?.trim() || null,
          id_ayuda: idAyuda,
          metodo_entrega: metodoEntrega,
          cantidad,
          monto_equivalente: montoEquivalente,
          con_soporte: conSoporte,
          observaciones: observaciones.trim() || null,
          registrado_por: user?.id || null, // Auditoría del usuario logueado (#24)
          moneda,
          monto_original: montoOriginal,
          tasa_cambio: tasaCambio,
        },
      ]);

      if (error) throw error;
      await fetchDonations();
    } catch (err) {
      console.error("Error al guardar donación entregada:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    recibidas,
    entregadas,
    loading,
    fetchDonations,
    handleSaveRecibida,
    handleSaveEntregada,
  };
}
