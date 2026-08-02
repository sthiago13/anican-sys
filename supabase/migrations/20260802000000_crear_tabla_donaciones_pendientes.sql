-- Migración para el Módulo de Donaciones Pendientes (Issue #38)
-- Separa las donaciones entrantes desde la Landing Page de la tabla oficial donaciones_recibidas

-- 1. Crear tabla donaciones_pendientes
CREATE TABLE IF NOT EXISTS public.donaciones_pendientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  entidad_donante VARCHAR(150) NOT NULL,
  metodo_ingreso VARCHAR(50),
  monto_o_cantidad TEXT NOT NULL,
  moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
  monto_original DECIMAL(12, 2),
  tasa_cambio DECIMAL(12, 2),
  monto_equivalente_usd DECIMAL(12, 2),
  id_ayuda UUID REFERENCES public.catalogo_ayudas(id) ON DELETE SET NULL,
  observaciones TEXT,
  referencia VARCHAR(100),
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobado', 'Rechazado'
  procesado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  fecha_procesado TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Comentarios aclarativos de columnas
COMMENT ON TABLE public.donaciones_pendientes IS 'Donaciones ingresadas desde la Landing Page pendientes por verificación de un operador';
COMMENT ON COLUMN public.donaciones_pendientes.estado IS 'Estado de la verificación: Pendiente, Aprobado o Rechazado';

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.donaciones_pendientes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
DROP POLICY IF EXISTS "Permitir gestion total de donaciones_pendientes a autenticados" ON public.donaciones_pendientes;
CREATE POLICY "Permitir gestion total de donaciones_pendientes a autenticados"
  ON public.donaciones_pendientes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir insercion publica pendientes landing" ON public.donaciones_pendientes;
DROP POLICY IF EXISTS "Permitir insercion publica de donaciones pendientes desde la landing page" ON public.donaciones_pendientes;
CREATE POLICY "Permitir insercion publica pendientes landing"
  ON public.donaciones_pendientes FOR INSERT
  TO anon
  WITH CHECK (true);

-- Revocar la política anónima previa en donaciones_recibidas (la landing ya no inserta directo aquí)
DROP POLICY IF EXISTS "Permitir insercion publica de donaciones desde la landing page" ON public.donaciones_recibidas;

-- 4. Definición defensiva de la función para autocalcular equivalente en USD
CREATE OR REPLACE FUNCTION public.calcular_monto_equivalente_donacion_recibida()
RETURNS TRIGGER AS $$
DECLARE
  rate_record RECORD;
BEGIN
  IF NEW.monto_original IS NOT NULL AND NEW.monto_original > 0 AND NEW.monto_equivalente_usd IS NULL THEN
    IF NEW.moneda = 'USD' OR NEW.moneda IS NULL THEN
      NEW.moneda := 'USD';
      NEW.tasa_cambio := COALESCE(NEW.tasa_cambio, 1.0);
      NEW.monto_equivalente_usd := NEW.monto_original;
    ELSE
      IF NEW.tasa_cambio IS NULL OR NEW.tasa_cambio <= 0 THEN
        SELECT tasa_ves, tasa_cop INTO rate_record
        FROM public.tasas_cambio
        WHERE fecha <= NEW.fecha
        ORDER BY fecha DESC
        LIMIT 1;

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

      IF NEW.tasa_cambio IS NOT NULL AND NEW.tasa_cambio > 0 THEN
        NEW.monto_equivalente_usd := ROUND((NEW.monto_original / NEW.tasa_cambio)::numeric, 2);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para autocalcular tasa y monto en USD en donaciones_pendientes
DROP TRIGGER IF EXISTS trigger_calcular_monto_equivalente_pendiente ON public.donaciones_pendientes;
CREATE TRIGGER trigger_calcular_monto_equivalente_pendiente
  BEFORE INSERT OR UPDATE ON public.donaciones_pendientes
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_monto_equivalente_donacion_recibida();

-- 6. Función RPC para aprobar una donación pendiente
CREATE OR REPLACE FUNCTION public.aprobar_donacion_pendiente(
  p_id_pendiente UUID,
  p_registrado_por UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pendiente RECORD;
  v_nueva_id UUID;
BEGIN
  -- Obtener la donación pendiente activa
  SELECT * INTO v_pendiente
  FROM public.donaciones_pendientes
  WHERE id = p_id_pendiente AND estado = 'Pendiente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La donación pendiente no existe o ya fue procesada.';
  END IF;

  -- Insertar en donaciones_recibidas oficiales
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

  -- Marcar la donación pendiente como Aprobada
  UPDATE public.donaciones_pendientes
  SET estado = 'Aprobado',
      procesado_por = p_registrado_por,
      fecha_procesado = timezone('utc'::text, now())
  WHERE id = p_id_pendiente;

  RETURN v_nueva_id;
END;
$$;

-- 7. Función RPC para rechazar una donación pendiente
CREATE OR REPLACE FUNCTION public.rechazar_donacion_pendiente(
  p_id_pendiente UUID,
  p_registrado_por UUID,
  p_motivo TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.donaciones_pendientes
  SET estado = 'Rechazado',
      procesado_por = p_registrado_por,
      fecha_procesado = timezone('utc'::text, now()),
      observaciones = CASE 
        WHEN p_motivo IS NOT NULL AND TRIM(p_motivo) <> '' THEN COALESCE(observaciones || ' | Motivo rechazo: ', '') || TRIM(p_motivo)
        ELSE observaciones
      END
  WHERE id = p_id_pendiente AND estado = 'Pendiente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La donación pendiente no existe o ya fue procesada.';
  END IF;
END;
$$;
