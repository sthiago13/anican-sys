// Interface alineada a la tabla `pacientes` de Supabase
export interface Paciente {
  id: string;
  id_representante: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  diagnostico: string;
  sexo: string;
  estado: "Activo" | "Fallecido" | "Inactivo";
  created_at?: string;
  // Joined data from representante (optional, for display)
  representante_nombre: string;
}

// Interface alineada a la tabla `representantes` de Supabase
export interface Representante {
  id: string;
  cedula: string;
  nombres: string;
  telefono_1?: string;
  telefono_2?: string;
  residencia?: string;
  created_at?: string;
}
