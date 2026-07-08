-- Migración para añadir soporte multimoneda estructurado a las donaciones

-- 1. Modificaciones para Donaciones Entregadas (Egresos)
ALTER TABLE donaciones_entregadas ADD COLUMN moneda VARCHAR(10) NOT NULL DEFAULT 'USD';
ALTER TABLE donaciones_entregadas ADD COLUMN monto_original DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE donaciones_entregadas ADD COLUMN tasa_cambio DECIMAL(12, 2) NOT NULL DEFAULT 1;

-- Comentario aclarativo de columnas
COMMENT ON COLUMN donaciones_entregadas.moneda IS 'Moneda original de la transaccion (USD, VES, COP)';
COMMENT ON COLUMN donaciones_entregadas.monto_original IS 'Monto en la moneda original seleccionada';
COMMENT ON COLUMN donaciones_entregadas.tasa_cambio IS 'Tasa de cambio aplicada respecto al USD en la fecha de registro';
COMMENT ON COLUMN donaciones_entregadas.monto_equivalente IS 'Valor unificado en USD calculado para contabilidad global';


-- 2. Modificaciones para Donaciones Recibidas (Ingresos)
ALTER TABLE donaciones_recibidas ADD COLUMN moneda VARCHAR(10) NOT NULL DEFAULT 'USD';
ALTER TABLE donaciones_recibidas ADD COLUMN monto_original DECIMAL(12, 2);
ALTER TABLE donaciones_recibidas ADD COLUMN tasa_cambio DECIMAL(12, 2);
ALTER TABLE donaciones_recibidas ADD COLUMN monto_equivalente_usd DECIMAL(12, 2);

-- Comentario aclarativo de columnas
COMMENT ON COLUMN donaciones_recibidas.moneda IS 'Moneda del ingreso (USD, VES, COP)';
COMMENT ON COLUMN donaciones_recibidas.monto_original IS 'Monto numerico original si el ingreso es puramente monetario';
COMMENT ON COLUMN donaciones_recibidas.tasa_cambio IS 'Tasa de cambio respecto al USD en la fecha de registro';
COMMENT ON COLUMN donaciones_recibidas.monto_equivalente_usd IS 'Valor unificado en USD si es monetario o estimado para contabilidad global';
