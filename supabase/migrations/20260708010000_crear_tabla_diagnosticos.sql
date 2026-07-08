-- 1. Crear tabla de diagnósticos
CREATE TABLE diagnosticos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Insertar algunos diagnósticos de ejemplo/comunes en oncología pediátrica
INSERT INTO diagnosticos (nombre, descripcion) VALUES
  ('Leucemia Linfoblástica Aguda (LLA)', 'Cáncer de la sangre más común en niños.'),
  ('Leucemia Mieloide Aguda (LMA)', 'Cáncer de la sangre y la médula ósea.'),
  ('Linfoma de Hodgkin', 'Cáncer del sistema linfático.'),
  ('Linfoma no Hodgkin', 'Cáncer del sistema linfático.'),
  ('Neuroblastoma', 'Cáncer de las células nerviosas inmaduras.'),
  ('Tumor de Wilms (Nefroblastoma)', 'Cáncer de riñón común en niños.'),
  ('Retinoblastoma', 'Cáncer de ojo infantil.'),
  ('Osteosarcoma', 'Cáncer de hueso primario.'),
  ('Sarcoma de Ewing', 'Cáncer de hueso y tejidos blandos.'),
  ('Meduloblastoma', 'Tumor cerebral maligno infantil.')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Agregar columna de relación en la tabla pacientes
ALTER TABLE pacientes ADD COLUMN id_diagnostico UUID REFERENCES diagnosticos(id) ON DELETE SET NULL;

-- 4. Migrar datos existentes (si los hay)
-- Insertar diagnósticos únicos existentes en la tabla pacientes que no estén en la lista predeterminada
INSERT INTO diagnosticos (nombre)
SELECT DISTINCT diagnostico 
FROM pacientes 
WHERE diagnostico IS NOT NULL AND diagnostico <> ''
ON CONFLICT (nombre) DO NOTHING;

-- Actualizar id_diagnostico en pacientes mapeando por el nombre
UPDATE pacientes p
SET id_diagnostico = d.id
FROM diagnosticos d
WHERE p.diagnostico = d.nombre;

-- 5. Eliminar la columna antigua diagnostico
ALTER TABLE pacientes DROP COLUMN diagnostico;
