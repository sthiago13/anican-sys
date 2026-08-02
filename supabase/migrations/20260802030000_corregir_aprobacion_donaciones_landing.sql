-- Alinear el esquema de ingresos con las donaciones monetarias provenientes de la landing.

-- Las donaciones monetarias pueden no pertenecer a un artículo del catálogo.
ALTER TABLE public.donaciones_recibidas
  ALTER COLUMN id_ayuda DROP NOT NULL;

-- La RPC conserva el método de ingreso informado en la landing.
ALTER TABLE public.donaciones_recibidas
  ADD COLUMN IF NOT EXISTS metodo_ingreso VARCHAR(50);

COMMENT ON COLUMN public.donaciones_recibidas.id_ayuda IS
  'Artículo o ayuda relacionada; NULL para donaciones monetarias generales';

-- Mantener la función explícita para que la migración sea autocontenida cuando se
-- aplique sobre una base existente.
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
BEGIN
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
    id_ayuda
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
    v_pendiente.id_ayuda
  )
  RETURNING id INTO v_nueva_id;

  UPDATE public.donaciones_pendientes
  SET estado = 'Aprobado',
      procesado_por = p_registrado_por,
      fecha_procesado = timezone('utc'::text, now())
  WHERE id = p_id_pendiente;

  RETURN v_nueva_id;
END;
$$;
