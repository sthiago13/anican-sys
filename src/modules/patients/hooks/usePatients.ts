import { useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";
import { type Paciente, type Representante, type Diagnostico } from "../types";

interface DbPaciente {
  id: string;
  id_representante: string | null;
  id_diagnostico: string | null;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: string | null;
  estado: Paciente["estado"];
  created_at?: string;
  representantes: { nombres: string } | { nombres: string }[] | null;
  diagnosticos: { nombre: string } | { nombre: string }[] | null;
}

export function usePatients() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pacData, error: pacError } = await supabase.from(
        "pacientes",
      ).select(`
          id,
          id_representante,
          id_diagnostico,
          nombres,
          apellidos,
          fecha_nacimiento,
          sexo,
          estado,
          created_at,
          representantes (
            nombres
          ),
          diagnosticos (
            nombre
          )
        `);

      if (pacError) throw pacError;

      const { data: repData, error: repError } = await supabase
        .from("representantes")
        .select("*");

      if (repError) throw repError;

      const { data: diagData, error: diagError } = await supabase
        .from("diagnosticos")
        .select("*")
        .order("nombre", { ascending: true });

      if (diagError) throw diagError;

      const mappedPacientes: Paciente[] = (
        (pacData as unknown as DbPaciente[]) || []
      ).map((pac) => {
        const rep = Array.isArray(pac.representantes)
          ? pac.representantes[0]
          : pac.representantes;

        const diag = Array.isArray(pac.diagnosticos)
          ? pac.diagnosticos[0]
          : pac.diagnosticos;

        return {
          id: pac.id,
          id_representante: pac.id_representante || undefined,
          id_diagnostico: pac.id_diagnostico || undefined,
          nombres: pac.nombres,
          apellidos: pac.apellidos,
          fecha_nacimiento: pac.fecha_nacimiento,
          sexo: pac.sexo || undefined,
          estado: pac.estado,
          created_at: pac.created_at,
          representante_nombre: rep ? rep.nombres : "—",
          diagnostico_nombre: diag ? diag.nombre : "—",
        };
      });

      setPacientes(mappedPacientes);
      setRepresentantes(repData || []);
      setDiagnosticos(diagData || []);
    } catch (err: unknown) {
      console.error("Error al cargar datos desde Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, nuevoEstado: Paciente["estado"]) => {
    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from("pacientes")
        .update({ estado: nuevoEstado })
        .eq("id", id);

      if (updateError) throw updateError;

      setPacientes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
      );
    } catch (err: unknown) {
      console.error("Error al actualizar estado del paciente:", err);
      alert(
        err instanceof Error
          ? `Error al actualizar estado: ${err.message}`
          : "No se pudo actualizar el estado del paciente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaciente = async (
    pacienteId: string,
    pacienteData: {
      nombres: string;
      apellidos: string;
      fecha_nacimiento: string;
      id_diagnostico?: string;
      sexo?: string;
      estado: Paciente["estado"];
    },
    representanteId: string,
    representanteData: {
      cedula: string;
      nombres: string;
      telefono_1?: string;
      telefono_2?: string;
      residencia?: string;
    }
  ) => {
    try {
      setLoading(true);
      // 1. Actualizar representante
      const { error: repError } = await supabase
        .from("representantes")
        .update({
          cedula: representanteData.cedula.trim(),
          nombres: representanteData.nombres.trim(),
          telefono_1: representanteData.telefono_1?.trim() || null,
          telefono_2: representanteData.telefono_2?.trim() || null,
          residencia: representanteData.residencia?.trim() || null,
        })
        .eq("id", representanteId);

      if (repError) throw repError;

      // 2. Actualizar paciente
      const { error: pacError } = await supabase
        .from("pacientes")
        .update({
          nombres: pacienteData.nombres.trim(),
          apellidos: pacienteData.apellidos.trim(),
          fecha_nacimiento: pacienteData.fecha_nacimiento,
          id_diagnostico: pacienteData.id_diagnostico || null,
          sexo: pacienteData.sexo || null,
          estado: pacienteData.estado,
        })
        .eq("id", pacienteId);

      if (pacError) throw pacError;

      // 3. Recargar datos localmente
      await fetchData();
    } catch (err: unknown) {
      console.error("Error al actualizar paciente/representante:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    pacientes,
    representantes,
    diagnosticos,
    loading,
    handleUpdateStatus,
    handleUpdatePaciente,
    setPacientes,
    setRepresentantes,
    setDiagnosticos,
  };
}

