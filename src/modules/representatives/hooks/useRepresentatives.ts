import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../config/supabase";
import { type Representante } from "../types";

export function useRepresentatives() {
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRepresentatives = useCallback(async () => {
    setLoading(true);
    try {
      // Cargamos representantes incluyendo sus pacientes asociados (1-a-muchos)
      const { data, error } = await supabase
        .from("representantes")
        .select(`
          id,
          cedula,
          nombres,
          telefono_1,
          telefono_2,
          residencia,
          created_at,
          pacientes (
            id,
            nombres,
            apellidos
          )
        `)
        .order("nombres", { ascending: true });

      if (error) throw error;

      // El tipado de Supabase para las relaciones secundarias puede venir como array o singular
      // Mapeamos los datos para asegurar que pacientes sea siempre un array limpio
      const mappedData: Representante[] = (data || []).map((rep: any) => ({
        id: rep.id,
        cedula: rep.cedula,
        nombres: rep.nombres,
        telefono_1: rep.telefono_1 || undefined,
        telefono_2: rep.telefono_2 || undefined,
        residencia: rep.residencia || undefined,
        created_at: rep.created_at,
        pacientes: Array.isArray(rep.pacientes)
          ? rep.pacientes
          : rep.pacientes
          ? [rep.pacientes]
          : [],
      }));

      setRepresentantes(mappedData);
    } catch (err: unknown) {
      console.error("Error al cargar representantes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRepresentatives();
  }, [fetchRepresentatives]);

  const handleCreateRepresentative = async (
    repData: Omit<Representante, "id" | "created_at" | "pacientes">
  ) => {
    try {
      setLoading(true);
      const { error } = await supabase.from("representantes").insert([
        {
          cedula: repData.cedula.trim(),
          nombres: repData.nombres.trim(),
          telefono_1: repData.telefono_1?.trim() || null,
          telefono_2: repData.telefono_2?.trim() || null,
          residencia: repData.residencia?.trim() || null,
        },
      ]);

      if (error) throw error;
      await fetchRepresentatives();
    } catch (err: unknown) {
      console.error("Error al registrar representante:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRepresentative = async (
    id: string,
    repData: Omit<Representante, "id" | "created_at" | "pacientes">
  ) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("representantes")
        .update({
          cedula: repData.cedula.trim(),
          nombres: repData.nombres.trim(),
          telefono_1: repData.telefono_1?.trim() || null,
          telefono_2: repData.telefono_2?.trim() || null,
          residencia: repData.residencia?.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;
      await fetchRepresentatives();
    } catch (err: unknown) {
      console.error("Error al actualizar representante:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepresentative = async (id: string) => {
    try {
      setLoading(true);

      // Verificación de seguridad adicional en el cliente
      const { data: rep, error: checkError } = await supabase
        .from("representantes")
        .select("id, pacientes(id)")
        .eq("id", id)
        .single();

      if (checkError) throw checkError;

      const pacientesCount = Array.isArray(rep?.pacientes) 
        ? rep.pacientes.length 
        : rep?.pacientes 
        ? 1 
        : 0;

      if (pacientesCount > 0) {
        throw new Error(
          "No se puede eliminar un representante que tiene pacientes a su cargo."
        );
      }

      const { error } = await supabase.from("representantes").delete().eq("id", id);
      if (error) throw error;

      await fetchRepresentatives();
    } catch (err: unknown) {
      console.error("Error al eliminar representante:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    representantes,
    loading,
    fetchRepresentatives,
    handleCreateRepresentative,
    handleUpdateRepresentative,
    handleDeleteRepresentative,
  };
}
