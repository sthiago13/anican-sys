import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../config/supabase";
import { type Representante } from "../types";

interface UseRepresentativesParams {
  page: number;
  pageSize: number;
  searchQuery: string;
}

interface DbRepresentante {
  id: string;
  cedula: string;
  nombres: string;
  telefono_1: string | null;
  telefono_2: string | null;
  residencia: string | null;
  created_at: string;
  pacientes: { id: string; nombres: string; apellidos: string } | { id: string; nombres: string; apellidos: string }[] | null;
}

export function useRepresentatives({
  page,
  pageSize,
  searchQuery,
}: UseRepresentativesParams) {
  const queryClient = useQueryClient();

  // 1. Obtener lista paginada y filtrada de representantes
  const { data, isLoading: loadingReps } = useQuery({
    queryKey: ["representantes", { page, pageSize, searchQuery }],
    queryFn: async () => {
      let query = supabase
        .from("representantes")
        .select(
          `
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
          `,
          { count: "exact" }
        );

      if (searchQuery.trim()) {
        const search = searchQuery.trim();
        query = query.or(`cedula.ilike.%${search}%,nombres.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = page * pageSize - 1;

      const { data: rawReps, count, error } = await query
        .order("nombres", { ascending: true })
        .range(from, to);

      if (error) throw error;

      const mappedData: Representante[] = (
        (rawReps as unknown as DbRepresentante[]) || []
      ).map((rep) => ({
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
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["representantes"] }),
  };
}
