-- Migración para configurar logs nativos de PostgreSQL (RAISE LOG) en Supabase para la extracción de tasas de cambio

DROP TABLE IF EXISTS public.logs_extraccion_tasas CASCADE;

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

  IF last_ves IS NULL THEN last_ves := 725.7470; END IF;
  IF last_cop IS NULL THEN last_cop := 3252.1100; END IF;

  ves_rate := last_ves;
  cop_rate := last_cop;

  -- 1. Consultar tasa VES (BCV oficial)
  BEGIN
    SELECT status, content INTO ves_response FROM extensions.http_get('https://ve.dolarapi.com/v1/dolares/oficial');
    RAISE LOG '[EXTRACCION_TASAS] 🇻🇪 HTTP Status VES: %, Respuesta JSON completa: %', ves_response.status, ves_response.content;

    IF ves_response.status = 200 THEN
      ves_json := ves_response.content::jsonb;
      ves_rate := COALESCE(
        (ves_json->>'promedio')::numeric,
        (ves_json->>'venta')::numeric,
        last_ves
      );
      RAISE LOG '[EXTRACCION_TASAS] 🇻🇪 Tasa VES extraída con éxito: %', ves_rate;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[EXTRACCION_TASAS] ❌ Error al consultar tasa VES: %', SQLERRM;
  END;

  -- 2. Consultar tasa COP (TRM oficial)
  BEGIN
    SELECT status, content INTO cop_response FROM extensions.http_get('https://co.dolarapi.com/v1/trm');
    RAISE LOG '[EXTRACCION_TASAS] 🇨🇴 HTTP Status COP (TRM): %, Respuesta JSON completa: %', cop_response.status, cop_response.content;

    IF cop_response.status = 200 THEN
      cop_json := cop_response.content::jsonb;
      cop_rate := COALESCE(
        (cop_json->>'valor')::numeric,
        (cop_json->>'promedio')::numeric,
        (cop_json->>'venta')::numeric,
        last_cop
      );
      RAISE LOG '[EXTRACCION_TASAS] 🇨🇴 Tasa COP extraída con éxito: %', cop_rate;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[EXTRACCION_TASAS] ❌ Error al consultar tasa COP (TRM): %', SQLERRM;
  END;

  -- 3. Insertar o actualizar en la tabla tasas_cambio para CURRENT_DATE
  INSERT INTO public.tasas_cambio (fecha, tasa_ves, tasa_cop, actualizado_por)
  VALUES (CURRENT_DATE, ves_rate, cop_rate, NULL)
  ON CONFLICT (fecha)
  DO UPDATE SET
    tasa_ves = EXCLUDED.tasa_ves,
    tasa_cop = EXCLUDED.tasa_cop,
    updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;
