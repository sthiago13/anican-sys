-- Migración para autocalcular el monto equivalente en USD y la tasa de cambio en donaciones recibidas
-- Especialmente útil para donaciones registradas automáticamente desde la Landing Page

CREATE OR REPLACE FUNCTION public.calcular_monto_equivalente_donacion_recibida()
RETURNS TRIGGER AS $$
DECLARE
  rate_record RECORD;
BEGIN
  -- Si la donación contiene un monto monetario y aún no tiene valor en USD calculado
  IF NEW.monto_original IS NOT NULL AND NEW.monto_original > 0 AND NEW.monto_equivalente_usd IS NULL THEN
    
    -- Si la moneda es USD o no se especificó, la equivalencia es igual al monto original
    IF NEW.moneda = 'USD' OR NEW.moneda IS NULL THEN
      NEW.moneda := 'USD';
      NEW.tasa_cambio := COALESCE(NEW.tasa_cambio, 1.0);
      NEW.monto_equivalente_usd := NEW.monto_original;
    ELSE
      -- Si la tasa_cambio no fue provista desde la aplicación, buscar la tasa activa en la tabla tasas_cambio
      IF NEW.tasa_cambio IS NULL OR NEW.tasa_cambio <= 0 THEN
        -- Buscar la tasa registrada para la fecha de la donación o la fecha previa más reciente
        SELECT tasa_ves, tasa_cop INTO rate_record
        FROM public.tasas_cambio
        WHERE fecha <= NEW.fecha
        ORDER BY fecha DESC
        LIMIT 1;

        -- Si no hay tasa previa registrada en esa fecha, buscar la más reciente registrada en el sistema
        IF rate_record IS NULL THEN
          SELECT tasa_ves, tasa_cop INTO rate_record
          FROM public.tasas_cambio
          ORDER BY fecha DESC
          LIMIT 1;
        END IF;

        IF NEW.moneda = 'VES' THEN
          NEW.tasa_cambio := COALESCE(rate_record.tasa_ves, 700.0);
        ELSIF NEW.moneda = 'COP' THEN
          NEW.tasa_cambio := COALESCE(rate_record.tasa_cop, 3336.5);
        END IF;
      END IF;

      -- Calcular automáticamente la equivalencia en USD
      IF NEW.tasa_cambio IS NOT NULL AND NEW.tasa_cambio > 0 THEN
        NEW.monto_equivalente_usd := ROUND((NEW.monto_original / NEW.tasa_cambio)::numeric, 2);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear o reemplazar el trigger BEFORE INSERT OR UPDATE en donaciones_recibidas
DROP TRIGGER IF EXISTS trigger_calcular_monto_equivalente_recibida ON public.donaciones_recibidas;

CREATE TRIGGER trigger_calcular_monto_equivalente_recibida
  BEFORE INSERT OR UPDATE ON public.donaciones_recibidas
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_monto_equivalente_donacion_recibida();
