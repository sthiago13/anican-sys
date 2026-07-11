import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../config/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
import { type DonacionRecibida, type DonacionEntregada } from "../types";

interface UseDonationsParams {
  pageRecibidas: number;
  pageEntregadas: number;
  pageSize: number;
  searchRecibidas: string;
  searchEntregadas: string;
}

export function useDonations({
  pageRecibidas,
  pageEntregadas,
  pageSize,
  searchRecibidas,
  searchEntregadas,
}: UseDonationsParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Query para KPIs agregados globales
  const { data: stats = { totalEntregadoMonetario: 0, totalRecibidoMonetario: 0, totalRecibidasCount: 0, totalEntregadasCount: 0 }, isLoading: loadingStats } = useQuery({
    queryKey: ["donations_stats"],
    queryFn: async () => {
      const { data: recData, error: recError } = await supabase
        .from("donaciones_recibidas")
        .select("monto_equivalente_usd");

      if (recError) throw recError;

      const { data: entData, error: entError } = await supabase
        .from("donaciones_entregadas")
        .select("monto_equivalente");

      if (entError) throw entError;

      const totalRecibidoMonetario = (recData || []).reduce(
        (acc, curr) => acc + (Number(curr.monto_equivalente_usd) || 0),
        0
      );
      const totalRecibidasCount = recData?.length || 0;

      const totalEntregadoMonetario = (entData || []).reduce(
        (acc, curr) => acc + (Number(curr.monto_equivalente) || 0),
        0
      );
      const totalEntregadasCount = entData?.length || 0;

      return {
        totalEntregadoMonetario,
        totalRecibidoMonetario,
        totalRecibidasCount,
        totalEntregadasCount,
      };
    },
  });

  // 2. Query para Donaciones Recibidas (Paginadas y Filtradas)
  const { data: recibidasData, isLoading: loadingRecibidas } = useQuery({
    queryKey: ["donaciones_recibidas", { pageRecibidas, pageSize, searchRecibidas }],
    queryFn: async () => {
      let query = supabase
        .from("donaciones_recibidas")
        .select(
          `
            *,
            catalogo_ayudas (
              nombre_articulo,
              categoria
            )
          `,
          { count: "exact" }
        );

      if (searchRecibidas.trim()) {
        const search = searchRecibidas.trim();
        query = query.ilike("entidad_donante", `%${search}%`);
      }

      const from = (pageRecibidas - 1) * pageSize;
      const to = pageRecibidas * pageSize - 1;

      const { data, count, error } = await query
        .order("fecha", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        recibidas: (data || []) as DonacionRecibida[],
        count: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  // 3. Query para Donaciones Entregadas (Paginadas y Filtradas)
  const { data: entregadasData, isLoading: loadingEntregadas } = useQuery({
    queryKey: ["donaciones_entregadas", { pageEntregadas, pageSize, searchEntregadas }],
    queryFn: async () => {
      let query = supabase
        .from("donaciones_entregadas")
        .select(
          `
            *,
            pacientes (
              nombres
            ),
            catalogo_ayudas (
              nombre_articulo,
              categoria
            )
          `,
          { count: "exact" }
        );

      if (searchEntregadas.trim()) {
        const search = searchEntregadas.trim();

        // Buscar pacientes cuyo nombre coincida
        const { data: pacs } = await supabase
          .from("pacientes")
          .select("id")
          .ilike("nombres", `%${search}%`);

        // Buscar artículos coincidentes
        const { data: ayudas } = await supabase
          .from("catalogo_ayudas")
          .select("id")
          .ilike("nombre_articulo", `%${search}%`);

        const pacIds = pacs?.map((p) => p.id) || [];
        const ayudaIds = ayudas?.map((a) => a.id) || [];

        let orConditions = `beneficiario_externo.ilike.%${search}%,observaciones.ilike.%${search}%`;
        if (pacIds.length > 0) {
          orConditions += `,id_paciente.in.(${pacIds.join(",")})`;
        }
        if (ayudaIds.length > 0) {
          orConditions += `,id_ayuda.in.(${ayudaIds.join(",")})`;
        }
        query = query.or(orConditions);
      }

      const from = (pageEntregadas - 1) * pageSize;
      const to = pageEntregadas * pageSize - 1;

      const { data, count, error } = await query
        .order("fecha", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        entregadas: (data || []) as unknown as DonacionEntregada[],
        count: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  // 4. Mutación para guardar donación recibida
  const saveRecibidaMutation = useMutation({
    mutationFn: async (vars: {
      fecha: string;
      entidadDonante: string;
      montoOCantidad: string;
      observaciones: string;
      moneda: string;
      montoOriginal: number | null;
      tasaCambio: number | null;
      montoEquivalenteUsd: number | null;
      idAyuda: string;
    }) => {
      const { error } = await supabase.from("donaciones_recibidas").insert([
        {
          fecha: vars.fecha,
          entidad_donante: vars.entidadDonante.trim(),
          monto_o_cantidad: vars.montoOCantidad.trim(),
          observaciones: vars.observaciones.trim() || null,
          registrado_por: user?.id || null,
          moneda: vars.moneda,
          monto_original: vars.montoOriginal,
          tasa_cambio: vars.tasaCambio,
          monto_equivalente_usd: vars.montoEquivalenteUsd,
          id_ayuda: vars.idAyuda,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["donaciones_recibidas"] });
      void queryClient.invalidateQueries({ queryKey: ["donations_stats"] });
    },
  });

  // 5. Mutación para guardar donación entregada
  const saveEntregadaMutation = useMutation({
    mutationFn: async (vars: {
      fecha: string;
      idPaciente: string | null;
      beneficiarioExterno: string | null;
      idAyuda: string;
      cantidad: number;
      montoEquivalente: number;
      conSoporte: boolean;
      observaciones: string;
      moneda: string;
      montoOriginal: number;
      tasaCambio: number;
    }) => {
      const { error } = await supabase.from("donaciones_entregadas").insert([
        {
          fecha: vars.fecha,
          id_paciente: vars.idPaciente || null,
          beneficiario_externo: vars.beneficiarioExterno?.trim() || null,
          id_ayuda: vars.idAyuda,
          cantidad: vars.cantidad,
          monto_equivalente: vars.montoEquivalente,
          con_soporte: vars.conSoporte,
          observaciones: vars.observaciones.trim() || null,
          registrado_por: user?.id || null,
          moneda: vars.moneda,
          monto_original: vars.montoOriginal,
          tasa_cambio: vars.tasaCambio,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["donaciones_entregadas"] });
      void queryClient.invalidateQueries({ queryKey: ["donations_stats"] });
    },
  });

  const handleSaveRecibida = async (
    fecha: string,
    entidadDonante: string,
    montoOCantidad: string,
    observaciones: string,
    moneda: string,
    montoOriginal: number | null,
    tasaCambio: number | null,
    montoEquivalenteUsd: number | null,
    idAyuda: string
  ) => {
    await saveRecibidaMutation.mutateAsync({
      fecha,
      entidadDonante,
      montoOCantidad,
      observaciones,
      moneda,
      montoOriginal,
      tasaCambio,
      montoEquivalenteUsd,
      idAyuda,
    });
  };

  const handleSaveEntregada = async (
    fecha: string,
    idPaciente: string | null,
    beneficiarioExterno: string | null,
    idAyuda: string,
    cantidad: number,
    montoEquivalente: number,
    conSoporte: boolean,
    observaciones: string,
    moneda: string,
    montoOriginal: number,
    tasaCambio: number
  ) => {
    await saveEntregadaMutation.mutateAsync({
      fecha,
      idPaciente,
      beneficiarioExterno,
      idAyuda,
      cantidad,
      montoEquivalente,
      conSoporte,
      observaciones,
      moneda,
      montoOriginal,
      tasaCambio,
    });
  };

  const recibidas = recibidasData?.recibidas || [];
  const totalCountRecibidas = recibidasData?.count || 0;
  const totalPagesRecibidas = Math.ceil(totalCountRecibidas / pageSize);

  const entregadas = entregadasData?.entregadas || [];
  const totalCountEntregadas = entregadasData?.count || 0;
  const totalPagesEntregadas = Math.ceil(totalCountEntregadas / pageSize);

  const loading =
    loadingStats ||
    loadingRecibidas ||
    loadingEntregadas ||
    saveRecibidaMutation.isPending ||
    saveEntregadaMutation.isPending;

  return {
    recibidas,
    entregadas,
    loading,
    totalCountRecibidas,
    totalPagesRecibidas,
    totalCountEntregadas,
    totalPagesEntregadas,
    stats,
    handleSaveRecibida,
    handleSaveEntregada,
  };
}
