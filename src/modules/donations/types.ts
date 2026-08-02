export interface DonacionRecibida {
  id: string;
  fecha: string;
  entidad_donante: string;
  monto_o_cantidad: string;
  observaciones?: string;
  registrado_por?: string;
  created_at?: string;
  moneda: string;
  monto_original?: number;
  tasa_cambio?: number;
  monto_equivalente_usd?: number;
  id_ayuda: string;

  // Relacionales del Frontend
  catalogo_ayudas?: {
    nombre_articulo: string;
    categoria: string;
  };
}

export interface DonacionEntregada {
  id: string;
  fecha: string;
  id_paciente?: string;
  beneficiario_externo?: string;
  id_ayuda: string;
  cantidad: number;
  monto_equivalente: number; // Guardará el equivalente en USD
  con_soporte: boolean;
  observaciones?: string;
  registrado_por?: string;
  created_at?: string;
  moneda: string;
  monto_original: number;
  tasa_cambio: number;

  // Relacionales del Frontend
  pacientes?: {
    nombres: string;
  };
  catalogo_ayudas?: {
    nombre_articulo: string;
    categoria: string;
  };
}

export interface RecibidasFilters {
  ayuda: string;
  fechaRango: [Date | null, Date | null];
}

export interface EntregadasFilters {
  tipoBeneficiario: 'Todos' | 'Paciente' | 'Externo';
  fechaRango: [Date | null, Date | null];
  ayuda: string;
  conSoporte: 'Todos' | 'Con Soporte' | 'Sin Soporte';
}

export interface DonacionPendiente {
  id: string;
  fecha: string;
  entidad_donante: string;
  metodo_ingreso?: string;
  monto_o_cantidad: string;
  observaciones?: string;
  referencia?: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  procesado_por?: string;
  fecha_procesado?: string;
  created_at?: string;
  moneda: string;
  monto_original?: number;
  tasa_cambio?: number;
  monto_equivalente_usd?: number;
  id_ayuda?: string;

  // Relacionales del Frontend
  catalogo_ayudas?: {
    nombre_articulo: string;
    categoria: string;
  };
}

export interface PendientesFilters {
  estado: 'Todos' | 'Pendiente' | 'Aprobado' | 'Rechazado';
  fechaRango: [Date | null, Date | null];
}


