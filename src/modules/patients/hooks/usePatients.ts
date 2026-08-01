import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../config/supabase";
import { type Paciente, type Diagnostico, type Representante, type PatientFilters } from "../types";

interface UsePatientsParams {
  page: number;
  pageSize: number;
  searchQuery: string;
  filters?: PatientFilters;
}

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
  representantes: { id: string; cedula: string; nombres: string; telefono_1: string | null; telefono_2: string | null; residencia: string | null } | { id: string; cedula: string; nombres: string; telefono_1: string | null; telefono_2: string | null; residencia: string | null }[] | null;
  diagnosticos: { nombre: string } | { nombre: string }[] | null;
}

const PATIENTS_SELECT_FIELDS = `
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
    id,
    cedula,
    nombres,
    telefono_1,
    telefono_2,
    residencia
  ),
  diagnosticos (
    nombre
  )
`;

function mapDbPatientToPatient(pac: DbPaciente): Paciente {
  const rep = Array.isArray(pac.representantes)
    ? pac.representantes[0]
    : pac.representantes;

  const diag = Array.isArray(pac.diagnosticos)
    ? pac.diagnosticos[0]
    : pac.diagnosticos;

  const mappedRep: Representante | undefined = rep
    ? {
        id: rep.id,
        cedula: rep.cedula,
        nombres: rep.nombres,
        telefono_1: rep.telefono_1 || undefined,
        telefono_2: rep.telefono_2 || undefined,
        residencia: rep.residencia || undefined,
      }
    : undefined;

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
    representante: mappedRep,
  };
}

async function fetchFilteredPatients({
  filters,
  searchQuery,
  page,
  pageSize,
  countExact = false,
}: {
  filters?: PatientFilters;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  countExact?: boolean;
}) {
  let query = supabase
    .from("pacientes")
    .select(PATIENTS_SELECT_FIELDS, countExact ? { count: "exact" } : undefined);

  if (filters) {
    if (filters.estado && filters.estado !== "Todos") {
      query = query.eq("estado", filters.estado);
    }

    if (filters.sexo && filters.sexo !== "Todos") {
      query = query.eq("sexo", filters.sexo);
    }

    if (filters.diagnostico && filters.diagnostico !== "Todos") {
      query = query.eq("id_diagnostico", filters.diagnostico);
    }

    if (
      filters.nacimiento.year !== "Todos" ||
      filters.nacimiento.month !== "Todos" ||
      filters.nacimiento.day !== "Todos"
    ) {
      const y = filters.nacimiento.year === "Todos" ? "%" : filters.nacimiento.year;
      const m = filters.nacimiento.month === "Todos" ? "%" : filters.nacimiento.month;
      const d = filters.nacimiento.day === "Todos" ? "%" : filters.nacimiento.day;
      const pattern = `${y}-${m}-${d}`;
      if (pattern !== "%-%-%") {
        query = query.like("fecha_nacimiento", pattern);
      }
    }
  }

  if (searchQuery?.trim()) {
    const search = searchQuery.trim();

    const { data: reps } = await supabase
      .from("representantes")
      .select("id")
      .ilike("nombres", `%${search}%`);

    const { data: diags } = await supabase
      .from("diagnosticos")
      .select("id")
      .ilike("nombre", `%${search}%`);

    const repIds = reps?.map((r) => r.id) || [];
    const diagIds = diags?.map((d) => d.id) || [];

    let orConditions = `nombres.ilike.%${search}%,apellidos.ilike.%${search}%`;
    if (repIds.length > 0) {
      orConditions += `,id_representante.in.(${repIds.join(",")})`;
    }
    if (diagIds.length > 0) {
      orConditions += `,id_diagnostico.in.(${diagIds.join(",")})`;
    }
    query = query.or(orConditions);
  }

  query = query.order("created_at", { ascending: false });

  if (page !== undefined && pageSize !== undefined) {
    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;
    query = query.range(from, to);
  }

  return await query;
}

export function usePatients({
  page,
  pageSize,
  searchQuery,
  filters,
}: UsePatientsParams) {
  const queryClient = useQueryClient();

  // 1. Obtener catálogo de diagnósticos
  const { data: diagnosticos = [] } = useQuery<Diagnostico[]>({
    queryKey: ["diagnosticos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnosticos")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // 2. Obtener lista paginada y filtrada de pacientes
  const { data, isLoading: loadingPacientes } = useQuery({
    queryKey: [
      "pacientes",
      {
        page,
        pageSize,
        searchQuery,
        filters,
      },
    ],
    queryFn: async () => {
      const { data: rawPacientes, count, error } = await fetchFilteredPatients({
        filters,
        searchQuery,
        page,
        pageSize,
        countExact: true,
      });

      if (error) throw error;

      const mappedPacientes: Paciente[] = (
        (rawPacientes as unknown as DbPaciente[]) || []
      ).map(mapDbPatientToPatient);

      return {
        pacientes: mappedPacientes,
        count: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  // 3. Mutación para actualizar estado del paciente
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string; nuevoEstado: Paciente["estado"] }) => {
      const { error } = await supabase
        .from("pacientes")
        .update({ estado: nuevoEstado })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
  });

  // 4. Mutación para actualizar paciente y representante
  const updatePacienteMutation = useMutation({
    mutationFn: async ({
      pacienteId,
      pacienteData,
      representanteId,
      representanteData,
    }: {
      pacienteId: string;
      pacienteData: {
        nombres: string;
        apellidos: string;
        fecha_nacimiento: string;
        id_diagnostico?: string;
        sexo?: string;
        estado: Paciente["estado"];
      };
      representanteId: string;
      representanteData: {
        cedula: string;
        nombres: string;
        telefono_1?: string;
        telefono_2?: string;
        residencia?: string;
      };
    }) => {
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
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      void queryClient.invalidateQueries({ queryKey: ["representantes"] });
    },
  });

  const handleUpdateStatus = async (id: string, nuevoEstado: Paciente["estado"]) => {
    await updateStatusMutation.mutateAsync({ id, nuevoEstado });
  };

  const handleUpdatePaciente = async (
    pacienteId: string,
    pacienteData: Parameters<typeof updatePacienteMutation.mutateAsync>[0]["pacienteData"],
    representanteId: string,
    representanteData: Parameters<typeof updatePacienteMutation.mutateAsync>[0]["representanteData"]
  ) => {
    await updatePacienteMutation.mutateAsync({
      pacienteId,
      pacienteData,
      representanteId,
      representanteData,
    });
  };

  // Función para obtener TODOS los pacientes filtrados sin paginación (para exportar)
  const fetchExportData = async (): Promise<Paciente[]> => {
    const { data: rawPacientes, error } = await fetchFilteredPatients({
      filters,
      searchQuery,
    });

    if (error) throw error;

    return ((rawPacientes as unknown as DbPaciente[]) || []).map(mapDbPatientToPatient);
  };

  const pacientes = data?.pacientes || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    pacientes,
    diagnosticos,
    loading: loadingPacientes || updateStatusMutation.isPending || updatePacienteMutation.isPending,
    totalCount,
    totalPages,
    handleUpdateStatus,
    handleUpdatePaciente,
    fetchExportData,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["pacientes"] }),
  };
}
