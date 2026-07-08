-- Migración para crear la tabla de tasas de cambio VES y COP diarias respecto al USD

CREATE TABLE tasas_cambio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  tasa_ves DECIMAL(12, 4) NOT NULL,
  tasa_cop DECIMAL(12, 4) NOT NULL,
  actualizado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE tasas_cambio ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso
CREATE POLICY "Permitir lectura de tasas a todos los autenticados"
  ON tasas_cambio FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir insercion/actualizacion de tasas a todos los autenticados"
  ON tasas_cambio FOR ALL
  TO authenticated
  USING (true);
