import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../config/supabase";
import { type Representante, type RepresentativeFilters } from "../types";

interface UseRepresentativesParams {
  page: number;
  pageSize: number;
  searchQuery: string;
  filters?: RepresentativeFilters;
}

interface DbPacienteJoined {
  id: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo?: string;
  estado: "Activo" | "Fallecido" | "Inactivo";
  diagnosticos?: { nombre: string } | { nombre: string }[] | null;
}

interface DbRepresentante {
  id: string;
  cedula: string;
  nombres: string;
  telefono_1: string | null;
  telefono_2: string | null;
  residencia: string | null;
  created_at: string;
  pacientes: DbPacienteJoined | DbPacienteJoined[] | null;
}

const REPRESENTATIVES_SELECT_FIELDS = `
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
    apellidos,
    fecha_nacimiento,
    sexo,
    estado,
    diagnosticos (
      nombre
    )
  )
`;

function mapDbRepresentanteToRepresentante(rep: DbRepresentante): Representante {
  const pacientesRaw = Array.isArray(rep.pacientes)
    ? rep.pacientes
    : rep.pacientes
    ? [rep.pacientes]
    : [];

  return {
    id: rep.id,
    cedula: rep.cedula,
    nombres: rep.nombres,
    telefono_1: rep.telefono_1 || undefined,
    telefono_2: rep.telefono_2 || undefined,
    residencia: rep.residencia || undefined,
    created_at: rep.created_at,
    pacientes: pacientesRaw.map((p) => {
      const diagJoined = Array.isArray(p.diagnosticos)
        ? p.diagnosticos[0]
        : p.diagnosticos;

      return {
        id: p.id,
        nombres: p.nombres,
        apellidos: p.apellidos,
        fecha_nacimiento: p.fecha_nacimiento,
        sexo: p.sexo,
        estado: p.estado,
        diagnostico_nombre: diagJoined?.nombre || "No especificado",
        representante_nombre: rep.nombres,
      };
    }),
  };
}

async function fetchFilteredRepresentatives({
  filters,
  searchQuery,
  page,
  pageSize,
  countExact = false,
}: {
  filters?: RepresentativeFilters;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  countExact?: boolean;
}) {
  let query = supabase
    .from("representantes")
    .select(REPRESENTATIVES_SELECT_FIELDS, countExact ? { count: "exact" } : undefined);

  if (searchQuery?.trim()) {
    const search = searchQuery.trim();
    query = query.or(`cedula.ilike.%${search}%,nombres.ilike.%${search}%`);
  }

  if (filters?.asociacion && filters.asociacion !== "Todos") {
    const { data: pacientesConRep } = await supabase
      .from("pacientes")
      .select("id_representante")
      .not("id_representante", "is", null);

    const idsConRep = Array.from(new Set(pacientesConRep?.map((p) => p.id_representante) || []));

    if (filters.asociacion === "Con Pacientes") {
      if (idsConRep.length > 0) {
        query = query.in("id", idsConRep);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    } else if (filters.asociacion === "Sin Pacientes") {
      if (idsConRep.length > 0) {
        query = query.not("id", "in", `(${idsConRep.join(",")})`);
      }
    }
  }

  query = query.order("nombres", { ascending: true });

  if (page !== undefined && pageSize !== undefined) {
    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;
    query = query.range(from, to);
  }

  return await query;
}

export function useRepresentatives({
  page,
  pageSize,
  searchQuery,
  filters,
}: UseRepresentativesParams) {
  const queryClient = useQueryClient();

  // 1. Obtener lista paginada y filtrada de representantes
  const { data, isLoading: loadingReps } = useQuery({
    queryKey: ["representantes", { page, pageSize, searchQuery, filters }],
    queryFn: async () => {
      const { data: rawReps, count, error } = await fetchFilteredRepresentatives({
        filters,
        searchQuery,
        page,
        pageSize,
        countExact: true,
      });

      if (error) throw error;

      const mappedData: Representante[] = (
        (rawReps as unknown as DbRepresentante[]) || []
      ).map(mapDbRepresentanteToRepresentante);

      return {
        representantes: mappedData,
        count: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  // 2. Mutación para crear representante
  const createMutation = useMutation({
    mutationFn: async (
      repData: Omit<Representante, "id" | "created_at" | "pacientes">
    ) => {
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
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["representantes"] });
    },
  });

  // 3. Mutación para actualizar representante
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      repData,
    }: {
      id: string;
      repData: Omit<Representante, "id" | "created_at" | "pacientes">;
    }) => {
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
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["representantes"] });
      void queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
  });

  // 4. Mutación para eliminar representante
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Verificación de seguridad en el cliente
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

      const { error } = await supabase
        .from("representantes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["representantes"] });
    },
  });

  const handleCreateRepresentative = async (
    repData: Omit<Representante, "id" | "created_at" | "pacientes">
  ) => {
    await createMutation.mutateAsync(repData);
  };

  const handleUpdateRepresentative = async (
    id: string,
    repData: Omit<Representante, "id" | "created_at" | "pacientes">
  ) => {
    await updateMutation.mutateAsync({ id, repData });
  };

  const handleDeleteRepresentative = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  // Función para obtener TODOS los representantes filtrados sin paginación (para exportación)
  const fetchExportData = async (): Promise<Representante[]> => {
    const { data: rawReps, error } = await fetchFilteredRepresentatives({
      filters,
      searchQuery,
    });

    if (error) throw error;

    return ((rawReps as unknown as DbRepresentante[]) || []).map(mapDbRepresentanteToRepresentante);
  };

  const representantes = data?.representantes || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    representantes,
    loading:
      loadingReps ||
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    totalCount,
    totalPages,
    handleCreateRepresentative,
    handleUpdateRepresentative,
    handleDeleteRepresentative,
    fetchExportData,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["representantes"] }),
  };
}
