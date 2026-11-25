-- Migración: Columna edad en pacientes, sincronización automática y jobs diarios de cumpleaños y mayoría de edad

-- 1. Agregar columna `edad` a la tabla `public.pacientes`
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS edad SMALLINT;

-- 2. Backfill inicial para todos los registros existentes (zona horaria America/Caracas)
UPDATE public.pacientes
SET edad = (EXTRACT(YEAR FROM age((now() AT TIME ZONE 'America/Caracas')::date, fecha_nacimiento)))::SMALLINT
WHERE fecha_nacimiento IS NOT NULL;

-- 3. Función trigger para sincronizar `edad` al insertar o actualizar `fecha_nacimiento`
CREATE OR REPLACE FUNCTION public.sincronizar_edad_paciente()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.fecha_nacimiento IS NOT NULL THEN
    NEW.edad := (EXTRACT(YEAR FROM age((now() AT TIME ZONE 'America/Caracas')::date, NEW.fecha_nacimiento)))::SMALLINT;
  ELSE
    NEW.edad := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sincronizar_edad_paciente ON public.pacientes;

CREATE TRIGGER trigger_sincronizar_edad_paciente
  BEFORE INSERT OR UPDATE OF fecha_nacimiento ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.sincronizar_edad_paciente();

-- 4. Función diaria para actualizar la edad de los pacientes que cumplen años hoy (VET)
CREATE OR REPLACE FUNCTION public.actualizar_edades_cumpleanios_diario()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hoy_vet DATE := (now() AT TIME ZONE 'America/Caracas')::date;
BEGIN
  UPDATE public.pacientes
  SET edad = (EXTRACT(YEAR FROM age(v_hoy_vet, fecha_nacimiento)))::SMALLINT
  WHERE fecha_nacimiento IS NOT NULL
    AND EXTRACT(MONTH FROM fecha_nacimiento) = EXTRACT(MONTH FROM v_hoy_vet)
    AND EXTRACT(DAY FROM fecha_nacimiento) = EXTRACT(DAY FROM v_hoy_vet);
END;
$$;

-- 5. Función diaria para inactivar pacientes activos mayores o iguales a 18 años
CREATE OR REPLACE FUNCTION public.inactivar_pacientes_mayores_edad()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pacientes
  SET estado = 'Inactivo'
  WHERE estado = 'Activo'
    AND edad >= 18;
END;
$$;

-- Restringir ejecución directa de funciones de mantenimiento desde roles públicos
REVOKE ALL ON FUNCTION public.actualizar_edades_cumpleanios_diario() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inactivar_pacientes_mayores_edad() FROM PUBLIC, anon, authenticated;

-- 6. Programación idempotente de jobs diarios con pg_cron (00:00 VET = 04:00 UTC, 00:05 VET = 04:05 UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule('actualizar-edades-cumpleanios-job')
FROM cron.job
WHERE jobname = 'actualizar-edades-cumpleanios-job';

SELECT cron.schedule(
  'actualizar-edades-cumpleanios-job',
  '0 4 * * *',
  'SELECT public.actualizar_edades_cumpleanios_diario()'
);

SELECT cron.unschedule('inactivar-pacientes-mayores-edad-job')
FROM cron.job
WHERE jobname = 'inactivar-pacientes-mayores-edad-job';

SELECT cron.schedule(
  'inactivar-pacientes-mayores-edad-job',
  '5 4 * * *',
  'SELECT public.inactivar_pacientes_mayores_edad()'
);
