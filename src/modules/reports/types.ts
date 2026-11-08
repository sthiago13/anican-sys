export interface ReportFinancialPoint {
  periodo: string; // Ej: "Ene 2026", "2026-01"
  ingresos: number; // en USD
  egresos: number; // en USD
}

export interface ReportCategoryPoint {
  name: string; // Categoría de ayuda
  value: number; // Monto unificado en USD
}

export interface ReportTopAidPoint {
  nombre: string;
  cantidad: number;
}

export interface ReportDemographicsPoint {
  label: string; // Diagnóstico, Sexo o Rango de edad
  cantidad: number;
}

export interface ReportsSummary {
  totalIngresosUsd: number;
  totalEgresosUsd: number;
  balanceNetoUsd: number;
  pacientesUnicosBeneficiados: number;
  ayudasTotalesEntregadas: number;
}

export interface ReportFilters {
  fechaInicio: Date | null;
  fechaFin: Date | null;
}

export type LandingReportTarget = "doc1" | "doc2";

export interface LandingReportItem {
  id: LandingReportTarget;
  label: string;
  defaultTitle: string;
  defaultDesc: string;
  title: string;
  desc: string;
  filename: string | null;
  fileUrl: string | null;
}

export interface PublishReportParams {
  docId: LandingReportTarget;
  title: string;
  desc: string;
  file?: File | null;
}
