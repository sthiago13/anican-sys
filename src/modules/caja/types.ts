export type MonedaCaja = "USD" | "VES" | "COP";

export type RangoFechaCaja = "7d" | "30d" | "90d";

export interface SaldoCaja {
  moneda: MonedaCaja;
  saldo_actual: number;
  updated_at: string | null;
}

export interface TasaHistorica {
  id: string;
  fecha: string;
  tasa_ves: number;
  tasa_cop: number;
  updated_at?: string | null;
}

export interface PuntoTasaUsd {
  fecha: string;
  fechaLabel: string;
  VES: number;
  COP: number;
}

export interface PuntoConsolidado {
  fecha: string;
  fechaLabel: string;
  consolidadoUsd: number;
}
