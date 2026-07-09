import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../../config/supabase";
import { type DonacionRecibida, type DonacionEntregada } from "../../donations/types";
import { type Paciente } from "../../patients/types";
import {
  type ReportFinancialPoint,
  type ReportCategoryPoint,
  type ReportTopAidPoint,
  type ReportDemographicsPoint,
  type ReportsSummary,
} from "../types";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export function useReportsData() {
  const [recibidas, setRecibidas] = useState<DonacionRecibida[]>([]);
  const [entregadas, setEntregadas] = useState<DonacionEntregada[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar filtros: por defecto, desde el 1 de enero del año actual hasta hoy
  const [fechaInicio, setFechaInicio] = useState<Date | null>(
    dayjs().startOf("year").toDate()
  );
  const [fechaFin, setFechaFin] = useState<Date | null>(dayjs().toDate());

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar todas las donaciones recibidas (Ingresos)
      const { data: recData, error: recError } = await supabase
        .from("donaciones_recibidas")
        .select(`
          *,
          catalogo_ayudas (
            nombre_articulo,
            categoria
          )
        `);

      if (recError) throw recError;

      // 2. Cargar todas las donaciones entregadas (Egresos)
      const { data: entData, error: entError } = await supabase
        .from("donaciones_entregadas")
        .select(`
          *,
          pacientes (
            nombres,
            apellidos
          ),
          catalogo_ayudas (
            nombre_articulo,
            categoria
          )
        `);

      if (entError) throw entError;

      // 3. Cargar todos los pacientes para el análisis demográfico
      const { data: pacData, error: pacError } = await supabase
        .from("pacientes")
        .select(`
          id,
          nombres,
          apellidos,
          fecha_nacimiento,
          sexo,
          estado,
          created_at,
          diagnosticos (
            nombre
          )
        `);

      if (pacError) throw pacError;

      setRecibidas(recData || []);
      setEntregadas((entData || []) as unknown as DonacionEntregada[]);

      const mappedPacientes: Paciente[] = (pacData || []).map((pac: any) => {
        const diag = Array.isArray(pac.diagnosticos)
          ? pac.diagnosticos[0]
          : pac.diagnosticos;

        return {
          id: pac.id,
          nombres: pac.nombres,
          apellidos: pac.apellidos,
          fecha_nacimiento: pac.fecha_nacimiento,
          sexo: pac.sexo || undefined,
          estado: pac.estado,
          created_at: pac.created_at,
          representante_nombre: "—", // No es necesario para reportes
          diagnostico_nombre: diag ? diag.nombre : "Sin diagnóstico",
        };
      });

      setPacientes(mappedPacientes);
    } catch (err) {
      console.error("Error al cargar datos para reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // -------------------------------------------------------------
  // DATOS FILTRADOS EN MEMORIA (REACTIVOS)
  // -------------------------------------------------------------
  
  const filtradasRecibidas = useMemo(() => {
    return recibidas.filter((item) => {
      if (!item.fecha) return false;
      const fechaItem = dayjs(item.fecha);
      if (fechaInicio && fechaItem.isBefore(dayjs(fechaInicio).startOf("day"))) return false;
      if (fechaFin && fechaItem.isAfter(dayjs(fechaFin).endOf("day"))) return false;
      return true;
    });
  }, [recibidas, fechaInicio, fechaFin]);

  const filtradasEntregadas = useMemo(() => {
    return entregadas.filter((item) => {
      if (!item.fecha) return false;
      const fechaItem = dayjs(item.fecha);
      if (fechaInicio && fechaItem.isBefore(dayjs(fechaInicio).startOf("day"))) return false;
      if (fechaFin && fechaItem.isAfter(dayjs(fechaFin).endOf("day"))) return false;
      return true;
    });
  }, [entregadas, fechaInicio, fechaFin]);

  // -------------------------------------------------------------
  // PROCESAMIENTO: Resumen Ejecutivo KPIs
  // -------------------------------------------------------------
  
  const summary: ReportsSummary = useMemo(() => {
    const totalIngresosUsd = filtradasRecibidas.reduce(
      (sum, item) => sum + (Number(item.monto_equivalente_usd) || 0),
      0
    );

    const totalEgresosUsd = filtradasEntregadas.reduce(
      (sum, item) => sum + (Number(item.monto_equivalente) || 0),
      0
    );

    // Contar pacientes únicos beneficiados en el periodo
    const pacientesIds = new Set(
      filtradasEntregadas
        .map((item) => item.id_paciente)
        .filter((id): id is string => !!id)
    );

    const ayudasTotalesEntregadas = filtradasEntregadas.reduce(
      (sum, item) => sum + (Number(item.cantidad) || 0),
      0
    );

    return {
      totalIngresosUsd,
      totalEgresosUsd,
      balanceNetoUsd: totalIngresosUsd - totalEgresosUsd,
      pacientesUnicosBeneficiados: pacientesIds.size,
      ayudasTotalesEntregadas,
    };
  }, [filtradasRecibidas, filtradasEntregadas]);

  // -------------------------------------------------------------
  // PROCESAMIENTO: Evolución Financiera Histórica (Mensual)
  // -------------------------------------------------------------
  
  const financialsChartData: ReportFinancialPoint[] = useMemo(() => {
    const dataMap: Record<string, { ingresos: number; egresos: number }> = {};

    // Procesar ingresos
    filtradasRecibidas.forEach((item) => {
      if (!item.fecha) return;
      const mesStr = dayjs(item.fecha).format("YYYY-MM");
      if (!dataMap[mesStr]) {
        dataMap[mesStr] = { ingresos: 0, egresos: 0 };
      }
      dataMap[mesStr].ingresos += Number(item.monto_equivalente_usd) || 0;
    });

    // Procesar egresos
    filtradasEntregadas.forEach((item) => {
      if (!item.fecha) return;
      const mesStr = dayjs(item.fecha).format("YYYY-MM");
      if (!dataMap[mesStr]) {
        dataMap[mesStr] = { ingresos: 0, egresos: 0 };
      }
      dataMap[mesStr].egresos += Number(item.monto_equivalente) || 0;
    });

    // Convertir a array, ordenar cronológicamente y formatear la fecha
    return Object.keys(dataMap)
      .sort()
      .map((key) => {
        const nombreMes = dayjs(`${key}-01`).format("MMM YY");
        return {
          periodo: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
          ingresos: Number(dataMap[key].ingresos.toFixed(2)),
          egresos: Number(dataMap[key].egresos.toFixed(2)),
        };
      });
  }, [filtradasRecibidas, filtradasEntregadas]);

  // -------------------------------------------------------------
  // PROCESAMIENTO: Egresos por Categoría de Ayudas
  // -------------------------------------------------------------
  
  const categoriesChartData: ReportCategoryPoint[] = useMemo(() => {
    const dataMap: Record<string, number> = {};

    filtradasEntregadas.forEach((item) => {
      const categoria = item.catalogo_ayudas?.categoria || "Sin categoría";
      if (!dataMap[categoria]) {
        dataMap[categoria] = 0;
      }
      dataMap[categoria] += Number(item.monto_equivalente) || 0;
    });

    return Object.keys(dataMap).map((key) => ({
      name: key,
      value: Number(dataMap[key].toFixed(2)),
    })).sort((a, b) => b.value - a.value);
  }, [filtradasEntregadas]);

  // -------------------------------------------------------------
  // PROCESAMIENTO: Top 5 Ayudas más Entregadas (Volumen)
  // -------------------------------------------------------------
  
  const topAidsChartData: ReportTopAidPoint[] = useMemo(() => {
    const dataMap: Record<string, number> = {};

    filtradasEntregadas.forEach((item) => {
      const nombreArticulo = item.catalogo_ayudas?.nombre_articulo || "Desconocido";
      if (!dataMap[nombreArticulo]) {
        dataMap[nombreArticulo] = 0;
      }
      dataMap[nombreArticulo] += Number(item.cantidad) || 0;
    });

    return Object.keys(dataMap)
      .map((key) => ({
        nombre: key,
        cantidad: dataMap[key],
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [filtradasEntregadas]);

  // -------------------------------------------------------------
  // PROCESAMIENTO: Demografía de Pacientes (General / Activos)
  // -------------------------------------------------------------
  
  const diagnosticsDemographics: ReportDemographicsPoint[] = useMemo(() => {
    const dataMap: Record<string, number> = {};

    // Agrupar solo pacientes Activos
    const activos = pacientes.filter((p) => p.estado === "Activo");

    activos.forEach((p) => {
      const diag = p.diagnostico_nombre || "Sin diagnóstico";
      if (!dataMap[diag]) {
        dataMap[diag] = 0;
      }
      dataMap[diag]++;
    });

    return Object.keys(dataMap)
      .map((key) => ({
        label: key,
        cantidad: dataMap[key],
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [pacientes]);

  const sexDemographics: ReportDemographicsPoint[] = useMemo(() => {
    const dataMap: Record<string, number> = {};
    const activos = pacientes.filter((p) => p.estado === "Activo");

    activos.forEach((p) => {
      const sexo = p.sexo || "No especificado";
      if (!dataMap[sexo]) {
        dataMap[sexo] = 0;
      }
      dataMap[sexo]++;
    });

    return Object.keys(dataMap).map((key) => ({
      label: key,
      cantidad: dataMap[key],
    }));
  }, [pacientes]);

  const ageDemographics: ReportDemographicsPoint[] = useMemo(() => {
    const rangos = {
      "0-2 años": 0,
      "3-5 años": 0,
      "6-12 años": 0,
      "13-17 años": 0,
      "18+ años": 0,
    };

    const activos = pacientes.filter((p) => p.estado === "Activo");
    const hoy = dayjs();

    activos.forEach((p) => {
      if (!p.fecha_nacimiento) return;
      const edad = hoy.diff(dayjs(p.fecha_nacimiento), "year");

      if (edad <= 2) rangos["0-2 años"]++;
      else if (edad <= 5) rangos["3-5 años"]++;
      else if (edad <= 12) rangos["6-12 años"]++;
      else if (edad <= 17) rangos["13-17 años"]++;
      else rangos["18+ años"]++;
    });

    return Object.keys(rangos).map((key) => ({
      label: key,
      cantidad: rangos[key as keyof typeof rangos],
    }));
  }, [pacientes]);

  return {
    loading,
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    summary,
    financialsChartData,
    categoriesChartData,
    topAidsChartData,
    diagnosticsDemographics,
    sexDemographics,
    ageDemographics,
    pacientesTotales: pacientes.filter(p => p.estado === "Activo").length,
    refetch: fetchData,
  };
}
