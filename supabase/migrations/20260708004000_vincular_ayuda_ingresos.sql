-- Migración para vincular de forma opcional el catálogo de ayudas en las donaciones recibidas (Ingresos)

ALTER TABLE donaciones_recibidas ADD COLUMN id_ayuda UUID REFERENCES catalogo_ayudas(id) ON DELETE SET NULL;

COMMENT ON COLUMN donaciones_recibidas.id_ayuda IS 'Relación opcional con el catálogo de ayudas para categorizar el tipo de ingreso recibido';
