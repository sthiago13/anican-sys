import type { Paciente } from "../patients/types";

// Interface para representar a un tutor legal (Representante) en el sistema
export interface Representante {
  id: string;
  cedula: string;
  nombres: string;
  telefono_1?: string;
  telefono_2?: string;
  residencia?: string;
  created_at?: string;
  // Relación con pacientes vinculados (obtenida mediante JOIN en Supabase)
  pacientes?: Paciente[];
}

export interface RepresentativeFilters {
  asociacion: 'Todos' | 'Con Pacientes' | 'Sin Pacientes';
}

