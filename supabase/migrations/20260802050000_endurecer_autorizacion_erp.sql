-- Endurecer autorización por rol y cerrar accesos públicos no intencionados.

CREATE OR REPLACE FUNCTION public.es_administrador()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'Administrador'
  );
$$;

REVOKE ALL ON FUNCTION public.es_administrador() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.es_administrador() TO authenticated;

-- Un usuario autenticado puede consultar su directorio interno, pero solo un
-- Administrador puede crear perfiles o modificar roles.
DROP POLICY IF EXISTS "Permitir insercion de perfiles a autenticados" ON public.perfiles;
DROP POLICY IF EXISTS "Permitir actualizacion de perfiles a autenticados" ON public.perfiles;
CREATE POLICY "Administradores gestionan perfiles"
  ON public.perfiles FOR INSERT
  TO authenticated
  WITH CHECK (public.es_administrador());
CREATE POLICY "Administradores actualizan perfiles"
  ON public.perfiles FOR UPDATE
  TO authenticated
  USING (public.es_administrador())
  WITH CHECK (public.es_administrador());

-- Catálogo y tasas son configuración administrativa.
DROP POLICY IF EXISTS "Permitir insercion/actualizacion/eliminacion de catalogo_ayudas a autenticados" ON public.catalogo_ayudas;
CREATE POLICY "Administradores gestionan catalogo de ayudas"
  ON public.catalogo_ayudas FOR ALL
  TO authenticated
  USING (public.es_administrador())
  WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir escritura de tasas a autenticados" ON public.tasas_cambio;
CREATE POLICY "Administradores gestionan tasas de cambio"
  ON public.tasas_cambio FOR ALL
  TO authenticated
  USING (public.es_administrador())
  WITH CHECK (public.es_administrador());

-- El CMS y sus archivos solo deben ser modificables por Administradores.
DROP POLICY IF EXISTS "Permitir gestion autenticada de landing_content" ON public.landing_content;
CREATE POLICY "Administradores gestionan landing_content"
  ON public.landing_content FOR ALL
  TO authenticated
  USING (public.es_administrador())
  WITH CHECK (public.es_administrador());

DROP POLICY IF EXISTS "Permitir insercion autenticada en landing-media" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizacion autenticada en landing-media" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminacion autenticada en landing-media" ON storage.objects;
CREATE POLICY "Administradores insertan en landing-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'landing-media' AND public.es_administrador());
CREATE POLICY "Administradores actualizan landing-media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'landing-media' AND public.es_administrador())
  WITH CHECK (bucket_id = 'landing-media' AND public.es_administrador());
CREATE POLICY "Administradores eliminan landing-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'landing-media' AND public.es_administrador());

-- La landing solo debe insertar en pendientes, nunca en ingresos oficiales.
DROP POLICY IF EXISTS "Permitir insercion publica de donaciones desde la landing page" ON public.donaciones_recibidas;
DROP POLICY IF EXISTS "Permitir insercion anonima desde landing page" ON public.donaciones_recibidas;

-- Las pendientes y su historial contienen datos financieros y personales.
DROP POLICY IF EXISTS "Permitir gestion total de donaciones_pendientes a autenticados" ON public.donaciones_pendientes;
CREATE POLICY "Administradores consultan donaciones pendientes"
  ON public.donaciones_pendientes FOR SELECT
  TO authenticated
  USING (public.es_administrador());

DROP POLICY IF EXISTS "Lectura autenticada del historial de donaciones" ON public.donaciones_pendientes_historial;
CREATE POLICY "Administradores consultan historial de donaciones"
  ON public.donaciones_pendientes_historial FOR SELECT
  TO authenticated
  USING (public.es_administrador());

DROP POLICY IF EXISTS "Lectura publica de destinos de donacion activos" ON public.destinos_donacion_publicos;
CREATE POLICY "Lectura publica de destinos de donacion activos"
  ON public.destinos_donacion_publicos FOR SELECT
  TO anon, authenticated
  USING (activo = true OR public.es_administrador());

DROP POLICY IF EXISTS "Gestion autenticada de destinos de donacion" ON public.destinos_donacion_publicos;
CREATE POLICY "Administradores gestionan destinos de donacion"
  ON public.destinos_donacion_publicos FOR ALL
  TO authenticated
  USING (public.es_administrador())
  WITH CHECK (public.es_administrador());

CREATE OR REPLACE FUNCTION public.actualizar_donacion_pendiente(
  p_id_pendiente UUID,
  p_registrado_por UUID,
  p_fecha DATE,
  p_entidad_donante VARCHAR,
  p_metodo_ingreso VARCHAR,
  p_monto_o_cantidad TEXT,
  p_moneda VARCHAR,
  p_monto_original NUMERIC,
  p_referencia VARCHAR,
  p_destino_donacion_id UUID,
  p_destino_donacion VARCHAR,
  p_observaciones TEXT,
  p_motivo TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pendiente RECORD;
  v_usuario UUID := auth.uid();
  v_nuevos JSONB;
BEGIN
  IF NOT public.es_administrador() OR v_usuario IS NULL OR v_usuario <> p_registrado_por THEN
    RAISE EXCEPTION 'El usuario no tiene permisos para editar donaciones pendientes.';
  END IF;

  SELECT * INTO v_pendiente
  FROM public.donaciones_pendientes
  WHERE id = p_id_pendiente AND estado = 'Pendiente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La donación pendiente no existe o ya fue procesada.';
  END IF;

  IF p_entidad_donante IS NULL OR btrim(p_entidad_donante) = ''
     OR p_monto_o_cantidad IS NULL OR btrim(p_monto_o_cantidad) = ''
     OR p_moneda IS NULL OR btrim(p_moneda) = '' THEN
    RAISE EXCEPTION 'Donante, monto y moneda son obligatorios.';
  END IF;

  v_nuevos := jsonb_build_object(
    'fecha', p_fecha,
    'entidad_donante', btrim(p_entidad_donante),
    'metodo_ingreso', NULLIF(btrim(p_metodo_ingreso), ''),
    'monto_o_cantidad', btrim(p_monto_o_cantidad),
    'moneda', upper(btrim(p_moneda)),
    'monto_original', p_monto_original,
    'referencia', NULLIF(btrim(p_referencia), ''),
    'destino_donacion_id', p_destino_donacion_id,
    'destino_donacion', NULLIF(btrim(p_destino_donacion), ''),
    'observaciones', NULLIF(btrim(p_observaciones), '')
  );

  UPDATE public.donaciones_pendientes
  SET fecha = COALESCE(p_fecha, fecha),
      entidad_donante = btrim(p_entidad_donante),
      metodo_ingreso = NULLIF(btrim(p_metodo_ingreso), ''),
      monto_o_cantidad = btrim(p_monto_o_cantidad),
      moneda = upper(btrim(p_moneda)),
      monto_original = p_monto_original,
      monto_equivalente_usd = NULL,
      tasa_cambio = NULL,
      referencia = NULLIF(btrim(p_referencia), ''),
      destino_donacion_id = p_destino_donacion_id,
      destino_donacion = NULLIF(btrim(p_destino_donacion), ''),
      observaciones = NULLIF(btrim(p_observaciones), '')
  WHERE id = p_id_pendiente AND estado = 'Pendiente';

  INSERT INTO public.donaciones_pendientes_historial (
    donacion_pendiente_id, accion, datos_anteriores, datos_nuevos, motivo, realizado_por
  ) VALUES (
    p_id_pendiente,
    'EDICION',
    jsonb_build_object(
      'fecha', v_pendiente.fecha,
      'entidad_donante', v_pendiente.entidad_donante,
      'metodo_ingreso', v_pendiente.metodo_ingreso,
      'monto_o_cantidad', v_pendiente.monto_o_cantidad,
      'moneda', v_pendiente.moneda,
      'monto_original', v_pendiente.monto_original,
      'referencia', v_pendiente.referencia,
      'destino_donacion_id', v_pendiente.destino_donacion_id,
      'destino_donacion', v_pendiente.destino_donacion,
      'observaciones', v_pendiente.observaciones
    ),
    v_nuevos,
    NULLIF(btrim(p_motivo), ''),
    p_registrado_por
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.aprobar_donacion_pendiente(
  p_id_pendiente UUID,
  p_registrado_por UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pendiente RECORD;
  v_nueva_id UUID;
  v_usuario UUID := auth.uid();
BEGIN
  IF NOT public.es_administrador() OR v_usuario IS NULL OR v_usuario <> p_registrado_por THEN
    RAISE EXCEPTION 'El usuario no tiene permisos para aprobar donaciones pendientes.';
  END IF;

  SELECT * INTO v_pendiente
  FROM public.donaciones_pendientes
  WHERE id = p_id_pendiente AND estado = 'Pendiente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La donación pendiente no existe o ya fue procesada.';
  END IF;

  INSERT INTO public.donaciones_recibidas (
    fecha, entidad_donante, metodo_ingreso, monto_o_cantidad, observaciones,
    registrado_por, moneda, monto_original, tasa_cambio, monto_equivalente_usd,
    id_ayuda, referencia, destino_donacion_id, destino_donacion
  ) VALUES (
    v_pendiente.fecha, v_pendiente.entidad_donante, v_pendiente.metodo_ingreso,
    v_pendiente.monto_o_cantidad, v_pendiente.observaciones, p_registrado_por,
    v_pendiente.moneda, v_pendiente.monto_original, v_pendiente.tasa_cambio,
    v_pendiente.monto_equivalente_usd, v_pendiente.id_ayuda, v_pendiente.referencia,
    v_pendiente.destino_donacion_id, v_pendiente.destino_donacion
  )
  RETURNING id INTO v_nueva_id;

  UPDATE public.donaciones_pendientes
  SET estado = 'Aprobado', procesado_por = p_registrado_por,
      fecha_procesado = timezone('utc'::text, now())
  WHERE id = p_id_pendiente;

  INSERT INTO public.donaciones_pendientes_historial (
    donacion_pendiente_id, accion, datos_anteriores, realizado_por
  ) VALUES (p_id_pendiente, 'APROBACION', to_jsonb(v_pendiente), p_registrado_por);

  RETURN v_nueva_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rechazar_donacion_pendiente(
  p_id_pendiente UUID,
  p_registrado_por UUID,
  p_motivo TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario UUID := auth.uid();
BEGIN
  IF NOT public.es_administrador() OR v_usuario IS NULL OR v_usuario <> p_registrado_por THEN
    RAISE EXCEPTION 'El usuario no tiene permisos para rechazar donaciones pendientes.';
  END IF;

  UPDATE public.donaciones_pendientes
  SET estado = 'Rechazado',
      procesado_por = p_registrado_por,
      fecha_procesado = timezone('utc'::text, now()),
      observaciones = CASE
        WHEN p_motivo IS NOT NULL AND btrim(p_motivo) <> ''
          THEN COALESCE(observaciones || ' | Motivo rechazo: ', '') || btrim(p_motivo)
        ELSE observaciones
      END
  WHERE id = p_id_pendiente AND estado = 'Pendiente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La donación pendiente no existe o ya fue procesada.';
  END IF;

  INSERT INTO public.donaciones_pendientes_historial (
    donacion_pendiente_id, accion, motivo, realizado_por
  ) VALUES (p_id_pendiente, 'RECHAZO', NULLIF(btrim(p_motivo), ''), p_registrado_por);
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_donacion_pendiente(UUID, UUID, DATE, VARCHAR, VARCHAR, TEXT, VARCHAR, NUMERIC, VARCHAR, UUID, VARCHAR, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aprobar_donacion_pendiente(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rechazar_donacion_pendiente(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_donacion_pendiente(UUID, UUID, DATE, VARCHAR, VARCHAR, TEXT, VARCHAR, NUMERIC, VARCHAR, UUID, VARCHAR, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aprobar_donacion_pendiente(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rechazar_donacion_pendiente(UUID, UUID, TEXT) TO authenticated;
