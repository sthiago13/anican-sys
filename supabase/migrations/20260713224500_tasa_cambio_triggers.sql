-- Migración para crear la extracción automática de tasas y triggers de sincronización

-- 1. Habilitar la extensión http si no existe
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Crear función para consultar APIs externas y actualizar tasas de cambio
CREATE OR REPLACE FUNCTION public.actualizar_tasas_diarias()
RETURNS void AS $$
DECLARE
  ves_response record;
  cop_response record;
  ves_rate numeric;
  cop_rate numeric;
  ves_json jsonb;
  cop_json jsonb;
BEGIN
  -- 2.1. Consultar tasa VES (BCV oficial)
  BEGIN
    SELECT status, content INTO ves_response FROM extensions.http_get('https://ve.dolarapi.com/v1/dolares/oficial');
    IF ves_response.status = 200 THEN
      ves_json := ves_response.content::jsonb;
      ves_rate := COALESCE(
        (ves_json->>'promedio')::numeric,
        721.3456
      );
    ELSE
      ves_rate := 721.3456;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    ves_rate := 721.3456;
  END;

  -- 2.2. Consultar tasa COP (TRM oficial)
  BEGIN
    SELECT status, content INTO cop_response FROM extensions.http_get('https://co.dolarapi.com/v1/trm');
    IF cop_response.status = 200 THEN
      cop_json := cop_response.content::jsonb;
      -- Usar la propiedad 'valor' que retorna la DolarAPI de Colombia para TRM
      cop_rate := COALESCE(
        (cop_json->>'valor')::numeric,
        3248.87
      );
    ELSE
      cop_rate := 3248.87;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    cop_rate := 3248.87;
  END;

  -- 2.3. Insertar o actualizar en la tabla tasas_cambio
  INSERT INTO public.tasas_cambio (fecha, tasa_ves, tasa_cop, actualizado_por)
  VALUES (CURRENT_DATE, ves_rate, cop_rate, NULL)
  ON CONFLICT (fecha)
  DO UPDATE SET
    tasa_ves = EXCLUDED.tasa_ves,
    tasa_cop = EXCLUDED.tasa_cop,
    updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- 3. Habilitar pg_cron y programar la tarea diaria si la extensión está disponible
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Eliminar tarea previa si existe para evitar duplicados
SELECT cron.unschedule('actualizar-tasas-diarias-job') FROM cron.job WHERE jobname = 'actualizar-tasas-diarias-job';

-- Programar tarea diaria a las 01:00 AM UTC (aprox 9:00 PM local del día anterior en Colombia/Venezuela)
SELECT cron.schedule(
  'actualizar-tasas-diarias-job',
  '0 1 * * *',
  'SELECT public.actualizar_tasas_diarias()'
);



-- 4. Ejecutar inmediatamente para poblar/corregir el día actual
SELECT public.actualizar_tasas_diarias();
