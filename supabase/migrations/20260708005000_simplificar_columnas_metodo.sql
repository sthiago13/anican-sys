-- Migración para simplificar esquema eliminando columnas redundantes de métodos y haciendo obligatorio el catálogo de ayudas en ingresos

-- 1. Eliminar columnas obsoletas de métodos de pago/entrega
ALTER TABLE donaciones_recibidas DROP COLUMN IF EXISTS metodo_ingreso;
ALTER TABLE donaciones_entregadas DROP COLUMN IF EXISTS metodo_entrega;

-- 2. Hacer obligatorio el catálogo de ayudas en los ingresos para mantener coherencia e integridad relacional absoluta
-- NOTA: Si hay registros existentes, les asignaremos temporalmente la primera ayuda del catálogo para evitar fallas de restricción NOT NULL
DO $$
DECLARE
  first_ayuda_id UUID;
BEGIN
  SELECT id INTO first_ayuda_id FROM catalogo_ayudas LIMIT 1;
  IF first_ayuda_id IS NOT NULL THEN
    UPDATE donaciones_recibidas SET id_ayuda = first_ayuda_id WHERE id_ayuda IS NULL;
  END IF;
END $$;

ALTER TABLE donaciones_recibidas ALTER COLUMN id_ayuda SET NOT NULL;
