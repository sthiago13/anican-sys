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
