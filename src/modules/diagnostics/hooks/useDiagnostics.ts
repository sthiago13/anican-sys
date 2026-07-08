import { useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";
import { type Diagnostico } from "../../patients/types";

export function useDiagnostics() {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("diagnosticos")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setDiagnosticos(data || []);
    } catch (err) {
      console.error("Error al cargar diagnósticos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDiagnostics();
  }, []);

  const handleSaveDiagnostico = async (
    id: string | null,
    nombre: string,
    descripcion: string
  ) => {
    setLoading(true);
    try {
      if (id) {
        // Actualizar
        const { error } = await supabase
          .from("diagnosticos")
          .update({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from("diagnosticos")
          .insert([
            {
              nombre: nombre.trim(),
              descripcion: descripcion.trim() || null,
            },
          ]);

        if (error) throw error;
      }
      await fetchDiagnostics();
    } catch (err) {
      console.error("Error al guardar diagnóstico:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiagnostico = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("diagnosticos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchDiagnostics();
    } catch (err) {
      console.error("Error al eliminar diagnóstico:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    diagnosticos,
    loading,
    fetchDiagnostics,
    handleSaveDiagnostico,
    handleDeleteDiagnostico,
  };
}
