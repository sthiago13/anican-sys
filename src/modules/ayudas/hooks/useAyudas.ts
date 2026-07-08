import { useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";
import { type Ayuda } from "../types";

export function useAyudas() {
  const [ayudas, setAyudas] = useState<Ayuda[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAyudas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("catalogo_ayudas")
        .select("*")
        .order("nombre_articulo", { ascending: true });

      if (error) throw error;
      setAyudas(data || []);
    } catch (err) {
      console.error("Error al cargar el catálogo de ayudas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAyudas();
  }, []);

  const handleSaveAyuda = async (
    id: string | null,
    nombreArticulo: string,
    categoria: string
  ) => {
    setLoading(true);
    try {
      if (id) {
        // Actualizar
        const { error } = await supabase
          .from("catalogo_ayudas")
          .update({
            nombre_articulo: nombreArticulo.trim(),
            categoria: categoria,
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from("catalogo_ayudas")
          .insert([
            {
              nombre_articulo: nombreArticulo.trim(),
              categoria: categoria,
            },
          ]);

        if (error) throw error;
      }
      await fetchAyudas();
    } catch (err) {
      console.error("Error al guardar el artículo de ayuda:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAyuda = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("catalogo_ayudas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchAyudas();
    } catch (err) {
      console.error("Error al eliminar el artículo de ayuda:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    ayudas,
    loading,
    fetchAyudas,
    handleSaveAyuda,
    handleDeleteAyuda,
  };
}
