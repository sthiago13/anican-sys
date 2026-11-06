-- Migración: Ajuste de permisos RLS para voluntarios en pacientes/representantes y reprogramación de extracción de tasas
-- 1. Permite que usuarios con rol Voluntario puedan crear (INSERT) y editar (UPDATE) representantes y pacientes.
--    El borrado destructivo (DELETE) permanece restringido exclusivamente al Administrador.
-- 2. Reprograma el cron job de tasas para correr a las 5:00 AM (09:00 UTC) y 9:00 AM (13:00 UTC) hora de Venezuela,
--    capturando tanto el BCV como el refresco matutino de la TRM de Colombia.

-- 1. PERMISOS RLS: REPRESENTANTES
DROP POLICY IF EXISTS "Administradores gestionan representantes" ON public.representantes;
DROP POLICY IF EXISTS "Usuarios autenticados insertan representantes" ON public.representantes;
DROP POLICY IF EXISTS "Usuarios autenticados actualizan representantes" ON public.representantes;
DROP POLICY IF EXISTS "Administradores eliminan representantes" ON public.representantes;

-- Todos los usuarios autenticados (Voluntarios y Administradores) pueden crear tutores/representantes
CREATE POLICY "Usuarios autenticados insertan representantes"
  ON public.representantes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Todos los usuarios autenticados pueden actualizar números telefónicos, direcciones o datos del representante
CREATE POLICY "Usuarios autenticados actualizan representantes"
  ON public.representantes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- La eliminación física del registro queda reservada únicamente al Administrador
CREATE POLICY "Administradores eliminan representantes"
  ON public.representantes FOR DELETE
  TO authenticated
  USING (public.es_administrador());


-- 2. PERMISOS RLS: PACIENTES
DROP POLICY IF EXISTS "Administradores gestionan pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados insertan pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados actualizan pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Administradores eliminan pacientes" ON public.pacientes;

-- Todos los usuarios autenticados pueden registrar nuevos pacientes pediátricos
CREATE POLICY "Usuarios autenticados insertan pacientes"
  ON public.pacientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Todos los usuarios autenticados pueden actualizar el expediente del paciente
CREATE POLICY "Usuarios autenticados actualizan pacientes"
  ON public.pacientes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- La eliminación del paciente queda reservada únicamente al Administrador
CREATE POLICY "Administradores eliminan pacientes"
  ON public.pacientes FOR DELETE
  TO authenticated
  USING (public.es_administrador());

-- 3. REPROGRAMACIÓN DEL CRON DE TASAS DE CAMBIO (DOS HORARIOS DIARIOS)
-- ====================================================================
-- Horarios en UTC:
--   - 09:00 UTC (05:00 AM VET / 04:00 AM COT): Base de contingencia y tasa VES oficial (BCV).
--   - 13:00 UTC (09:00 AM VET / 08:00 AM COT): Refresco de la TRM oficial de Colombia (DolarAPI).

SELECT cron.unschedule('actualizar-tasas-diarias-job')
FROM cron.job
WHERE jobname = 'actualizar-tasas-diarias-job';

SELECT cron.schedule(
  'actualizar-tasas-diarias-job',
  '0 9,13 * * *',
  'SELECT public.actualizar_tasas_diarias()'
);

-- Ejecutar inmediatamente para actualizar la fila de hoy con el valor oficial vigente
SELECT public.actualizar_tasas_diarias();

