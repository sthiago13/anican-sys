-- Continuidad del proyecto y endurecimiento del flujo público de donaciones.

-- 1. Health check mínimo para el monitor externo.
CREATE OR REPLACE FUNCTION public.anican_keep_alive()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object('ok', true, 'service', 'anican-sys');
$$;

REVOKE ALL ON FUNCTION public.anican_keep_alive() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anican_keep_alive() TO anon, authenticated;

-- 2. Estado interno para limitar solicitudes públicas por ventana de tiempo.
CREATE TABLE IF NOT EXISTS public.donaciones_publicas_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  request_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT donaciones_publicas_rate_limits_ip_hash_check CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT donaciones_publicas_rate_limits_count_check CHECK (request_count >= 0)
);

ALTER TABLE public.donaciones_publicas_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.donaciones_publicas_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.donaciones_publicas_rate_limits TO service_role;

-- La función solo puede ser invocada por la Edge Function con service_role.
CREATE OR REPLACE FUNCTION public.registrar_donacion_publica(
  p_ip_hash TEXT,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entidad_donante VARCHAR(150);
  v_metodo_ingreso VARCHAR(50);
  v_monto_o_cantidad TEXT;
  v_moneda VARCHAR(10);
  v_monto_original NUMERIC;
  v_referencia VARCHAR(100);
  v_observaciones TEXT;
  v_destino_id UUID;
  v_destino_nombre VARCHAR(150);
  v_request_count INTEGER;
  v_window_started_at TIMESTAMPTZ;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Acceso no autorizado.' USING ERRCODE = '42501';
  END IF;

  IF p_ip_hash IS NULL OR p_ip_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Identificador de origen inválido.' USING ERRCODE = '22023';
  END IF;

  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'El payload debe ser un objeto JSON.' USING ERRCODE = '22023';
  END IF;

  v_entidad_donante := NULLIF(btrim(p_payload->>'entidad_donante'), '');
  v_metodo_ingreso := NULLIF(btrim(p_payload->>'metodo_ingreso'), '');
  v_monto_o_cantidad := NULLIF(btrim(p_payload->>'monto_o_cantidad'), '');
  v_moneda := upper(NULLIF(btrim(p_payload->>'moneda'), ''));
  v_referencia := NULLIF(btrim(p_payload->>'referencia'), '');
  v_observaciones := NULLIF(btrim(p_payload->>'observaciones'), '');

  IF v_entidad_donante IS NULL OR v_monto_o_cantidad IS NULL OR v_moneda IS NULL THEN
    RAISE EXCEPTION 'Donante, monto y moneda son obligatorios.' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_entidad_donante) > 150
     OR char_length(v_metodo_ingreso) > 50
     OR char_length(v_monto_o_cantidad) > 500
     OR char_length(v_moneda) > 10
     OR char_length(v_referencia) > 100
     OR char_length(v_observaciones) > 2000 THEN
    RAISE EXCEPTION 'Uno o más campos exceden el tamaño permitido.' USING ERRCODE = '22023';
  END IF;

  IF v_moneda !~ '^[A-Z]{3,10}$' THEN
    RAISE EXCEPTION 'Moneda inválida.' USING ERRCODE = '22023';
  END IF;

  IF NULLIF(btrim(p_payload->>'monto_original'), '') IS NOT NULL THEN
    IF btrim(p_payload->>'monto_original') !~ '^\d+(\.\d{1,2})?$' THEN
      RAISE EXCEPTION 'Monto original inválido.' USING ERRCODE = '22023';
    END IF;
    v_monto_original := (p_payload->>'monto_original')::NUMERIC;
    IF v_monto_original < 0 OR v_monto_original > 9999999999.99 THEN
      RAISE EXCEPTION 'Monto original fuera de rango.' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF NULLIF(btrim(p_payload->>'destino_donacion_id'), '') IS NOT NULL THEN
    BEGIN
      v_destino_id := (p_payload->>'destino_donacion_id')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Destino de donación inválido.' USING ERRCODE = '22023';
    END;

    SELECT nombre INTO v_destino_nombre
    FROM public.destinos_donacion_publicos
    WHERE id = v_destino_id AND activo = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El destino de donación no está disponible.' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Serializa el contador por origen para evitar saltos bajo concurrencia.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

  INSERT INTO public.donaciones_publicas_rate_limits (ip_hash, window_started_at, request_count)
  VALUES (p_ip_hash, timezone('utc'::text, now()), 1)
  ON CONFLICT (ip_hash) DO UPDATE
  SET window_started_at = CASE
        WHEN public.donaciones_publicas_rate_limits.window_started_at <= timezone('utc'::text, now()) - INTERVAL '1 hour'
          THEN timezone('utc'::text, now())
        ELSE public.donaciones_publicas_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN public.donaciones_publicas_rate_limits.window_started_at <= timezone('utc'::text, now()) - INTERVAL '1 hour'
          THEN 1
        ELSE public.donaciones_publicas_rate_limits.request_count + 1
      END
  RETURNING request_count, window_started_at INTO v_request_count, v_window_started_at;

  IF v_request_count > 5 THEN
    RAISE EXCEPTION 'Límite temporal de solicitudes alcanzado. Intenta más tarde.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.donaciones_pendientes (
    fecha, entidad_donante, metodo_ingreso, monto_o_cantidad, moneda,
    monto_original, referencia, observaciones, destino_donacion_id, destino_donacion
  ) VALUES (
    CURRENT_DATE, v_entidad_donante, v_metodo_ingreso, v_monto_o_cantidad, v_moneda,
    v_monto_original, v_referencia, v_observaciones, v_destino_id,
    COALESCE(NULLIF(btrim(p_payload->>'destino_donacion'), ''), v_destino_nombre)
  )
  RETURNING id INTO v_destino_id;

  RETURN v_destino_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_donacion_publica(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_donacion_publica(TEXT, JSONB) TO service_role;

-- 3. Cerrar escrituras públicas directas y aplicar una matriz conservadora de roles.
DROP POLICY IF EXISTS "Permitir insercion publica pendientes landing" ON public.donaciones_pendientes;
DROP POLICY IF EXISTS "Permitir insercion publica de donaciones pendientes desde la landing page" ON public.donaciones_pendientes;
DROP POLICY IF EXISTS "Permitir insercion anonima desde landing page" ON public.donaciones_recibidas;
REVOKE ALL ON TABLE public.donaciones_pendientes, public.donaciones_recibidas FROM anon;

-- Los voluntarios consultan el ERP; las escrituras clínicas, administrativas y financieras
-- quedan reservadas al Administrador.
DROP POLICY IF EXISTS "Permitir lectura de perfiles a autenticados" ON public.perfiles;
DROP POLICY IF EXISTS "Permitir insercion de perfiles a autenticados" ON public.perfiles;
DROP POLICY IF EXISTS "Permitir actualizacion de perfiles a autenticados" ON public.perfiles;
DROP POLICY IF EXISTS "Administradores actualizan perfiles" ON public.perfiles;
CREATE POLICY "Usuarios autenticados consultan perfiles"
  ON public.perfiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores insertan perfiles"
  ON public.perfiles FOR INSERT TO authenticated WITH CHECK (public.es_administrador());
CREATE POLICY "Administradores actualizan perfiles"
  ON public.perfiles FOR UPDATE TO authenticated
  USING (public.es_administrador()) WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir gestion total de representantes a autenticados" ON public.representantes;
DROP POLICY IF EXISTS "Permitir lectura de representantes a autenticados" ON public.representantes;
DROP POLICY IF EXISTS "Permitir escritura de representantes a autenticados" ON public.representantes;
CREATE POLICY "Usuarios autenticados consultan representantes"
  ON public.representantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores gestionan representantes"
  ON public.representantes FOR ALL TO authenticated
  USING (public.es_administrador()) WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir gestion total de pacientes a autenticados" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir lectura de pacientes a autenticados" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir escritura de pacientes a autenticados" ON public.pacientes;
CREATE POLICY "Usuarios autenticados consultan pacientes"
  ON public.pacientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores gestionan pacientes"
  ON public.pacientes FOR ALL TO authenticated
  USING (public.es_administrador()) WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir gestion total de diagnosticos a autenticados" ON public.diagnosticos;
DROP POLICY IF EXISTS "Permitir lectura de diagnosticos a autenticados" ON public.diagnosticos;
DROP POLICY IF EXISTS "Permitir escritura de diagnosticos a autenticados" ON public.diagnosticos;
CREATE POLICY "Usuarios autenticados consultan diagnosticos"
  ON public.diagnosticos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores gestionan diagnosticos"
  ON public.diagnosticos FOR ALL TO authenticated
  USING (public.es_administrador()) WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir gestion total de catalogo_ayudas a autenticados" ON public.catalogo_ayudas;
DROP POLICY IF EXISTS "Permitir lectura de catalogo_ayudas a autenticados" ON public.catalogo_ayudas;
DROP POLICY IF EXISTS "Permitir insercion/actualizacion/eliminacion de catalogo_ayudas a autenticados" ON public.catalogo_ayudas;
DROP POLICY IF EXISTS "Administradores gestionan catalogo de ayudas" ON public.catalogo_ayudas;
CREATE POLICY "Usuarios autenticados consultan catalogo de ayudas"
  ON public.catalogo_ayudas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores gestionan catalogo de ayudas"
  ON public.catalogo_ayudas FOR ALL TO authenticated
  USING (public.es_administrador()) WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir gestion total de donaciones_entregadas a autenticados" ON public.donaciones_entregadas;
CREATE POLICY "Usuarios autenticados consultan donaciones entregadas"
  ON public.donaciones_entregadas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores gestionan donaciones entregadas"
  ON public.donaciones_entregadas FOR ALL TO authenticated
  USING (public.es_administrador()) WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir gestion total de donaciones_recibidas a autenticados" ON public.donaciones_recibidas;
DROP POLICY IF EXISTS "Permitir lectura de donaciones_recibidas a autenticados" ON public.donaciones_recibidas;
DROP POLICY IF EXISTS "Permitir escritura de donaciones_recibidas a autenticados" ON public.donaciones_recibidas;
CREATE POLICY "Usuarios autenticados consultan donaciones recibidas"
  ON public.donaciones_recibidas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores gestionan donaciones recibidas"
  ON public.donaciones_recibidas FOR ALL TO authenticated
  USING (public.es_administrador()) WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir lectura de tasas a autenticados" ON public.tasas_cambio;
DROP POLICY IF EXISTS "Permitir escritura de tasas a autenticados" ON public.tasas_cambio;
DROP POLICY IF EXISTS "Permitir insercion/actualizacion de tasas a autenticados" ON public.tasas_cambio;
CREATE POLICY "Usuarios autenticados consultan tasas"
  ON public.tasas_cambio FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores gestionan tasas"
  ON public.tasas_cambio FOR ALL TO authenticated
  USING (public.es_administrador()) WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Administradores consultan donaciones pendientes" ON public.donaciones_pendientes;
CREATE POLICY "Administradores consultan donaciones pendientes"
  ON public.donaciones_pendientes FOR SELECT TO authenticated
  USING (public.es_administrador());

DROP POLICY IF EXISTS "Administradores consultan historial de donaciones" ON public.donaciones_pendientes_historial;
DROP POLICY IF EXISTS "Lectura autenticada del historial de donaciones" ON public.donaciones_pendientes_historial;
CREATE POLICY "Administradores consultan historial de donaciones"
  ON public.donaciones_pendientes_historial FOR SELECT TO authenticated
  USING (public.es_administrador());

REVOKE ALL ON TABLE public.perfiles, public.representantes, public.pacientes,
  public.catalogo_ayudas, public.donaciones_entregadas, public.donaciones_recibidas,
  public.diagnosticos, public.tasas_cambio, public.donaciones_pendientes,
  public.donaciones_pendientes_historial FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.perfiles, public.representantes,
  public.pacientes, public.catalogo_ayudas, public.donaciones_entregadas,
  public.donaciones_recibidas, public.diagnosticos, public.tasas_cambio,
  public.donaciones_pendientes, public.donaciones_pendientes_historial TO authenticated;
