// Interface alineada a la tabla `diagnosticos` de Supabase
export interface Diagnostico {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at?: string;
}

// Interface alineada a la tabla `pacientes` de Supabase
export interface Paciente {
  id: string;
  id_representante?: string;
  id_diagnostico?: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo?: string;
  estado: "Activo" | "Fallecido" | "Inactivo";
  created_at?: string;
  // Joined data (optional, for display)
  representante_nombre: string;
  diagnostico_nombre?: string;
  representante?: Representante;
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
