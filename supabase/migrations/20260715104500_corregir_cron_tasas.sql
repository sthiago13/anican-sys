-- Migración para corregir la hora de ejecución del cron de tasas de cambio y robustecer la función de actualización

-- 1. Actualizar la función para usar fallbacks dinámicos (última tasa registrada) en caso de fallos de red o valores nulos
CREATE OR REPLACE FUNCTION public.actualizar_tasas_diarias()
RETURNS void AS $$
DECLARE
  ves_response record;
  cop_response record;
  ves_rate numeric;
  cop_rate numeric;
  ves_json jsonb;
  cop_json jsonb;
  last_ves numeric;
  last_cop numeric;
BEGIN
  -- Obtener la última tasa registrada para usarla como fallback dinámico
  SELECT tasa_ves, tasa_cop INTO last_ves, last_cop
  FROM public.tasas_cambio
  ORDER BY fecha DESC
  LIMIT 1;

  -- Si no existen registros previos en la tabla, definimos los valores por defecto históricos
  IF last_ves IS NULL THEN last_ves := 725.7470; END IF;
  IF last_cop IS NULL THEN last_cop := 3252.1100; END IF;

  -- Inicializar tasas con el fallback dinámico
  ves_rate := last_ves;
  cop_rate := last_cop;

  -- 2.1. Consultar tasa VES (BCV oficial)
  BEGIN
    SELECT status, content INTO ves_response FROM extensions.http_get('https://ve.dolarapi.com/v1/dolares/oficial');
    IF ves_response.status = 200 THEN
      ves_json := ves_response.content::jsonb;
      ves_rate := COALESCE(
        (ves_json->>'promedio')::numeric,
        (ves_json->>'venta')::numeric,
        last_ves
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- En caso de error, mantenemos el fallback dinámico
    NULL;
  END;

  -- 2.2. Consultar tasa COP (TRM oficial)
  BEGIN
    SELECT status, content INTO cop_response FROM extensions.http_get('https://co.dolarapi.com/v1/trm');
    IF cop_response.status = 200 THEN
      cop_json := cop_response.content::jsonb;
      cop_rate := COALESCE(
        (cop_json->>'valor')::numeric,
        (cop_json->>'promedio')::numeric,
        last_cop
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- En caso de error, mantenemos el fallback dinámico
    NULL;
  END;

  -- 2.3. Insertar o actualizar en la tabla tasas_cambio para CURRENT_DATE (en UTC)
  INSERT INTO public.tasas_cambio (fecha, tasa_ves, tasa_cop, actualizado_por)
  VALUES (CURRENT_DATE, ves_rate, cop_rate, NULL)
  ON CONFLICT (fecha)
  DO UPDATE SET
    tasa_ves = EXCLUDED.tasa_ves,
    tasa_cop = EXCLUDED.tasa_cop,
    updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- 2. Modificar la programación del cron job para que se ejecute a las 08:00 AM UTC (4:00 AM Venezuela / 3:00 AM Colombia)
-- Esto garantiza que las APIs externas ya se hayan actualizado para el día actual.

-- Eliminar tarea previa para evitar duplicidad
SELECT cron.unschedule('actualizar-tasas-diarias-job') FROM cron.job WHERE jobname = 'actualizar-tasas-diarias-job';

-- Programar de nuevo a las 08:00 AM UTC
SELECT cron.schedule(
  'actualizar-tasas-diarias-job',
  '0 8 * * *',
  'SELECT public.actualizar_tasas_diarias()'
);

-- Ejecutar inmediatamente para poblar/corregir el día actual
SELECT public.actualizar_tasas_diarias();
