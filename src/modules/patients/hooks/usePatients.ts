import { useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";
import { type Paciente, type Representante } from "../components/PatientTable";

interface DbPaciente {
  id: string;
  id_representante: string | null;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  diagnostico: string | null;
  sexo: string | null;
  estado: Paciente["estado"];
  created_at?: string;
  representantes: { nombres: string } | { nombres: string }[] | null;
}

export function usePatients() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pacData, error: pacError } = await supabase.from(
        "pacientes",
      ).select(`
          id,
          id_representante,
          nombres,
          apellidos,
          fecha_nacimiento,
          diagnostico,
          sexo,
          estado,
          created_at,
          representantes (
            nombres
          )
        `);

      if (pacError) throw pacError;

      const { data: repData, error: repError } = await supabase
        .from("representantes")
        .select("*");

      if (repError) throw repError;

      const mappedPacientes: Paciente[] = (
        (pacData as unknown as DbPaciente[]) || []
      ).map((pac) => {
        const rep = Array.isArray(pac.representantes)
          ? pac.representantes[0]
          : pac.representantes;

        return {
          id: pac.id,
          id_representante: pac.id_representante || undefined,
          nombres: pac.nombres,
          apellidos: pac.apellidos,
          fecha_nacimiento: pac.fecha_nacimiento,
          diagnostico: pac.diagnostico || undefined,
          sexo: pac.sexo || undefined,
          estado: pac.estado,
          created_at: pac.created_at,
          representante_nombre: rep ? rep.nombres : "—",
        };
      });

      setPacientes(mappedPacientes);
      setRepresentantes(repData || []);
    } catch (err: unknown) {
      console.error("Error al cargar datos desde Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleDeletePaciente = async (id: string) => {
    if (
      confirm("¿Estás seguro de que deseas eliminar este paciente del sistema?")
    ) {
      try {
        setLoading(true);
        const { error: deleteError } = await supabase
          .from("pacientes")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        setPacientes((prev) => prev.filter((p) => p.id !== id));
      } catch (err: unknown) {
        console.error("Error al eliminar paciente:", err);
        alert(
          err instanceof Error
            ? `Error al eliminar: ${err.message}`
            : "No se pudo eliminar el paciente.",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    pacientes,
    representantes,
    loading,
    handleDeletePaciente,
    setPacientes,
    setRepresentantes,
  };
}
