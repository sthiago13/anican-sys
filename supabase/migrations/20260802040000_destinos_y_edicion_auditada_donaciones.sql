-- Destinos públicos de donación y edición auditada de registros pendientes.

CREATE TABLE IF NOT EXISTS public.destinos_donacion_publicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion VARCHAR(255),
  emoji VARCHAR(10),
  orden SMALLINT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT destinos_donacion_publicos_nombre_key UNIQUE (nombre)
);

ALTER TABLE public.destinos_donacion_publicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de destinos de donacion activos" ON public.destinos_donacion_publicos;
CREATE POLICY "Lectura publica de destinos de donacion activos"
  ON public.destinos_donacion_publicos FOR SELECT
  TO anon, authenticated
  USING (activo = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Gestion autenticada de destinos de donacion" ON public.destinos_donacion_publicos;
CREATE POLICY "Gestion autenticada de destinos de donacion"
  ON public.destinos_donacion_publicos FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

INSERT INTO public.destinos_donacion_publicos (nombre, descripcion, emoji, orden)
VALUES
  ('Insumos de protección', 'Guantes, mascarillas y material estéril', '🧤', 1),
  ('Un examen de control', 'Estudios que vigilan la lucha a tiempo', '🔬', 2),
  ('Una sesión de quimioterapia', 'Medicamento de alto costo para un guerrero', '💊', 3),
  ('Lo que tu corazón diga', 'Todo aporte cuenta, sin importar el monto', '❤️', 4)
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE public.donaciones_pendientes
  ADD COLUMN IF NOT EXISTS destino_donacion_id UUID REFERENCES public.destinos_donacion_publicos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destino_donacion VARCHAR(150);

ALTER TABLE public.donaciones_recibidas
  ADD COLUMN IF NOT EXISTS referencia VARCHAR(100),
  ADD COLUMN IF NOT EXISTS destino_donacion_id UUID REFERENCES public.destinos_donacion_publicos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destino_donacion VARCHAR(150);

CREATE TABLE IF NOT EXISTS public.donaciones_pendientes_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donacion_pendiente_id UUID NOT NULL REFERENCES public.donaciones_pendientes(id) ON DELETE CASCADE,
  accion VARCHAR(30) NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  motivo TEXT,
  realizado_por UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.donaciones_pendientes_historial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura autenticada del historial de donaciones" ON public.donaciones_pendientes_historial;
CREATE POLICY "Lectura autenticada del historial de donaciones"
  ON public.donaciones_pendientes_historial FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

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
  IF v_usuario IS NULL OR v_usuario <> p_registrado_por THEN
    RAISE EXCEPTION 'El usuario autenticado no coincide con el operador indicado.';
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
    donacion_pendiente_id,
    accion,
    datos_anteriores,
    datos_nuevos,
    motivo,
    realizado_por
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
  IF v_usuario IS NULL OR v_usuario <> p_registrado_por THEN
    RAISE EXCEPTION 'El usuario autenticado no coincide con el operador indicado.';
  END IF;

  SELECT * INTO v_pendiente
  FROM public.donaciones_pendientes
  WHERE id = p_id_pendiente AND estado = 'Pendiente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La donación pendiente no existe o ya fue procesada.';
  END IF;

  INSERT INTO public.donaciones_recibidas (
    fecha,
    entidad_donante,
    metodo_ingreso,
    monto_o_cantidad,
    observaciones,
    registrado_por,
    moneda,
    monto_original,
    tasa_cambio,
    monto_equivalente_usd,
    id_ayuda,
    referencia,
    destino_donacion_id,
    destino_donacion
  ) VALUES (
    v_pendiente.fecha,
    v_pendiente.entidad_donante,
    v_pendiente.metodo_ingreso,
    v_pendiente.monto_o_cantidad,
    v_pendiente.observaciones,
    p_registrado_por,
    v_pendiente.moneda,
    v_pendiente.monto_original,
    v_pendiente.tasa_cambio,
    v_pendiente.monto_equivalente_usd,
    v_pendiente.id_ayuda,
    v_pendiente.referencia,
    v_pendiente.destino_donacion_id,
    v_pendiente.destino_donacion
  )
  RETURNING id INTO v_nueva_id;

  UPDATE public.donaciones_pendientes
  SET estado = 'Aprobado',
      procesado_por = p_registrado_por,
      fecha_procesado = timezone('utc'::text, now())
  WHERE id = p_id_pendiente;

  INSERT INTO public.donaciones_pendientes_historial (
    donacion_pendiente_id, accion, datos_anteriores, realizado_por
  ) VALUES (
    p_id_pendiente, 'APROBACION', to_jsonb(v_pendiente), p_registrado_por
  );

  RETURN v_nueva_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.actualizar_donacion_pendiente(UUID, UUID, DATE, VARCHAR, VARCHAR, TEXT, VARCHAR, NUMERIC, VARCHAR, UUID, VARCHAR, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aprobar_donacion_pendiente(UUID, UUID) TO authenticated;
