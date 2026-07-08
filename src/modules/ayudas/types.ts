export interface Ayuda {
  id: string;
  nombre_articulo: string;
  categoria: string; // 'Medicamento' | 'Insumo' | 'Servicio' | 'Económico' | 'Otros'
  created_at?: string;
}
