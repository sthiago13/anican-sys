import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../config/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
import { type DonacionRecibida, type DonacionEntregada, type RecibidasFilters, type EntregadasFilters } from "../types";

interface UseDonationsParams {
  pageRecibidas: number;
  pageEntregadas: number;
  pageSize: number;
  searchRecibidas: string;
  searchEntregadas: string;
  filtersRecibidas?: RecibidasFilters;
  filtersEntregadas?: EntregadasFilters;
}

const DONACIONES_RECIBIDAS_SELECT_FIELDS = `
  *,
  catalogo_ayudas (
    nombre_articulo,
    categoria
  )
`;

const DONACIONES_ENTREGADAS_SELECT_FIELDS = `
  *,
  pacientes (
    nombres
  ),
  catalogo_ayudas (
    nombre_articulo,
    categoria
  )
`;

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function fetchFilteredDonacionesRecibidas({
  searchRecibidas,
  filtersRecibidas,
  pageRecibidas,
  pageSize,
  countExact = false,
}: {
  searchRecibidas?: string;
  filtersRecibidas?: RecibidasFilters;
  pageRecibidas?: number;
  pageSize?: number;
  countExact?: boolean;
}) {
  let query = supabase
    .from("donaciones_recibidas")
    .select(DONACIONES_RECIBIDAS_SELECT_FIELDS, countExact ? { count: "exact" } : undefined);

  if (searchRecibidas?.trim()) {
    const search = searchRecibidas.trim();
    query = query.ilike("entidad_donante", `%${search}%`);
  }

  if (filtersRecibidas) {
    if (filtersRecibidas.ayuda && filtersRecibidas.ayuda !== "Todos") {
      query = query.eq("id_ayuda", filtersRecibidas.ayuda);
    }

    if (
      filtersRecibidas.fechaRango &&
      filtersRecibidas.fechaRango[0] &&
      filtersRecibidas.fechaRango[1]
    ) {
      const start = formatLocalDate(filtersRecibidas.fechaRango[0]);
      const end = formatLocalDate(filtersRecibidas.fechaRango[1]);
      query = query.gte("fecha", start).lte("fecha", end);
    }
  }

  query = query.order("fecha", { ascending: false });

  if (pageRecibidas !== undefined && pageSize !== undefined) {
    const from = (pageRecibidas - 1) * pageSize;
    const to = pageRecibidas * pageSize - 1;
    query = query.range(from, to);
  }

  return await query;
}

async function fetchFilteredDonacionesEntregadas({
  searchEntregadas,
  filtersEntregadas,
  pageEntregadas,
  pageSize,
  countExact = false,
}: {
  searchEntregadas?: string;
  filtersEntregadas?: EntregadasFilters;
  pageEntregadas?: number;
  pageSize?: number;
  countExact?: boolean;
}) {
  let query = supabase
    .from("donaciones_entregadas")
    .select(DONACIONES_ENTREGADAS_SELECT_FIELDS, countExact ? { count: "exact" } : undefined);

  if (searchEntregadas?.trim()) {
    const search = searchEntregadas.trim();

    const { data: pacs } = await supabase
      .from("pacientes")
      .select("id")
      .ilike("nombres", `%${search}%`);

    const { data: ayudasData } = await supabase
      .from("catalogo_ayudas")
      .select("id")
      .ilike("nombre_articulo", `%${search}%`);

    const pacIds = pacs?.map((p) => p.id) || [];
    const ayudaIds = ayudasData?.map((a) => a.id) || [];

    let orConditions = `beneficiario_externo.ilike.%${search}%,observaciones.ilike.%${search}%`;
    if (pacIds.length > 0) {
      orConditions += `,id_paciente.in.(${pacIds.join(",")})`;
    }
    if (ayudaIds.length > 0) {
      orConditions += `,id_ayuda.in.(${ayudaIds.join(",")})`;
    }
    query = query.or(orConditions);
  }

  if (filtersEntregadas) {
    if (filtersEntregadas.ayuda && filtersEntregadas.ayuda !== "Todos") {
      query = query.eq("id_ayuda", filtersEntregadas.ayuda);
    }

    if (filtersEntregadas.tipoBeneficiario === "Paciente") {
      query = query.not("id_paciente", "is", null);
    } else if (filtersEntregadas.tipoBeneficiario === "Externo") {
      query = query.is("id_paciente", null);
    }

    if (filtersEntregadas.conSoporte === "Con Soporte") {
      query = query.eq("con_soporte", true);
    } else if (filtersEntregadas.conSoporte === "Sin Soporte") {
      query = query.eq("con_soporte", false);
    }

    if (
      filtersEntregadas.fechaRango &&
      filtersEntregadas.fechaRango[0] &&
      filtersEntregadas.fechaRango[1]
    ) {
      const start = formatLocalDate(filtersEntregadas.fechaRango[0]);
      const end = formatLocalDate(filtersEntregadas.fechaRango[1]);
      query = query.gte("fecha", start).lte("fecha", end);
    }
  }

  query = query.order("fecha", { ascending: false });

  if (pageEntregadas !== undefined && pageSize !== undefined) {
    const from = (pageEntregadas - 1) * pageSize;
    const to = pageEntregadas * pageSize - 1;
    query = query.range(from, to);
  }

  return await query;
}

export function useDonations({
  pageRecibidas,
  pageEntregadas,
  pageSize,
  searchRecibidas,
  searchEntregadas,
  filtersRecibidas,
  filtersEntregadas,
}: UseDonationsParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Query para Catálogo de Ayudas
  const { data: ayudas = [] } = useQuery({
    queryKey: ["catalogo_ayudas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalogo_ayudas")
        .select("id, nombre_articulo, categoria")
        .order("nombre_articulo", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Query para KPIs agregados globales
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

  // 3. Query para Donaciones Recibidas (Paginadas y Filtradas)
  const { data: recibidasData, isLoading: loadingRecibidas } = useQuery({
    queryKey: ["donaciones_recibidas", { pageRecibidas, pageSize, searchRecibidas, filtersRecibidas }],
    queryFn: async () => {
      const { data, count, error } = await fetchFilteredDonacionesRecibidas({
        searchRecibidas,
        filtersRecibidas,
        pageRecibidas,
        pageSize,
        countExact: true,
      });

      if (error) throw error;

      return {
        recibidas: (data || []) as DonacionRecibida[],
        count: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  // 4. Query para Donaciones Entregadas (Paginadas y Filtradas)
  const { data: entregadasData, isLoading: loadingEntregadas } = useQuery({
    queryKey: ["donaciones_entregadas", { pageEntregadas, pageSize, searchEntregadas, filtersEntregadas }],
    queryFn: async () => {
      const { data, count, error } = await fetchFilteredDonacionesEntregadas({
        searchEntregadas,
        filtersEntregadas,
        pageEntregadas,
        pageSize,
        countExact: true,
      });

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

  // Obtener donaciones recibidas filtradas sin paginación
  const fetchExportRecibidas = async (): Promise<DonacionRecibida[]> => {
    const { data, error } = await fetchFilteredDonacionesRecibidas({
      searchRecibidas,
      filtersRecibidas,
    });

    if (error) throw error;
    return (data || []) as DonacionRecibida[];
  };

  // Obtener donaciones entregadas filtradas sin paginación
  const fetchExportEntregadas = async (): Promise<DonacionEntregada[]> => {
    const { data, error } = await fetchFilteredDonacionesEntregadas({
      searchEntregadas,
      filtersEntregadas,
    });

    if (error) throw error;
    return (data || []) as unknown as DonacionEntregada[];
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
    ayudas,
    loading,
    totalCountRecibidas,
    totalPagesRecibidas,
    totalCountEntregadas,
    totalPagesEntregadas,
    stats,
    handleSaveRecibida,
    handleSaveEntregada,
    fetchExportRecibidas,
    fetchExportEntregadas,
  };
}
