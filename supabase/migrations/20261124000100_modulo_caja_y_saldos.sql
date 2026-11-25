-- Migración: Módulo de Caja Multimoneda y Saldos Automáticos
-- Crea la tabla public.caja_monedas protegida por RLS para administradores,
-- realiza el backfill inicial desde donaciones_recibidas y donaciones_entregadas,
-- y configura triggers para mantener saldo_actual sincronizado automáticamente.

-- 1. Tabla de saldos por moneda
CREATE TABLE IF NOT EXISTS public.caja_monedas (
  moneda VARCHAR(10) PRIMARY KEY,
  saldo_actual NUMERIC(14, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.caja_monedas IS 'Saldo acumulado actual por moneda (USD, VES, COP) mantenido automáticamente por triggers.';

-- 2. Habilitar Row Level Security (RLS) solo para administradores
ALTER TABLE public.caja_monedas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Administradores consultan caja_monedas" ON public.caja_monedas;
CREATE POLICY "Administradores consultan caja_monedas"
  ON public.caja_monedas FOR SELECT
  TO authenticated
  USING (public.es_administrador());

DROP POLICY IF EXISTS "Administradores gestionan caja_monedas" ON public.caja_monedas;
CREATE POLICY "Administradores gestionan caja_monedas"
  ON public.caja_monedas FOR ALL
  TO authenticated
  USING (public.es_administrador())
  WITH CHECK (public.es_administrador());

-- 3. Backfill inicial para USD, VES y COP
WITH monedas_base AS (
  SELECT unnest(ARRAY['USD', 'VES', 'COP'])::VARCHAR(10) AS moneda
),
ingresos AS (
  SELECT
    UPPER(TRIM(COALESCE(NULLIF(moneda, ''), 'USD')))::VARCHAR(10) AS moneda,
    COALESCE(SUM(monto_original), 0) AS total_ingresos
  FROM public.donaciones_recibidas
  WHERE monto_original IS NOT NULL
  GROUP BY 1
),
egresos AS (
  SELECT
    UPPER(TRIM(COALESCE(NULLIF(moneda, ''), 'USD')))::VARCHAR(10) AS moneda,
    COALESCE(SUM(monto_original), 0) AS total_egresos
  FROM public.donaciones_entregadas
  WHERE monto_original IS NOT NULL
  GROUP BY 1
),
todas_monedas AS (
  SELECT moneda FROM monedas_base
  UNION
  SELECT moneda FROM ingresos
  UNION
  SELECT moneda FROM egresos
)
INSERT INTO public.caja_monedas (moneda, saldo_actual, updated_at)
SELECT
  m.moneda,
  ROUND((COALESCE(i.total_ingresos, 0) - COALESCE(e.total_egresos, 0))::numeric, 2),
  timezone('utc'::text, now())
FROM todas_monedas m
LEFT JOIN ingresos i ON i.moneda = m.moneda
LEFT JOIN egresos e ON e.moneda = m.moneda
ON CONFLICT (moneda) DO UPDATE
  SET saldo_actual = EXCLUDED.saldo_actual,
      updated_at = EXCLUDED.updated_at;

-- 4. Helper seguro para ajustar saldo en caja_monedas (crea la fila si no existe)
CREATE OR REPLACE FUNCTION public.ajustar_saldo_caja(
  p_moneda VARCHAR,
  p_delta NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_moneda VARCHAR(10);
  v_delta NUMERIC(14, 2);
BEGIN
  v_moneda := UPPER(TRIM(COALESCE(NULLIF(p_moneda, ''), 'USD')));
  v_delta := ROUND(COALESCE(p_delta, 0)::numeric, 2);

  IF v_delta = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.caja_monedas (moneda, saldo_actual, updated_at)
  VALUES (v_moneda, v_delta, timezone('utc'::text, now()))
  ON CONFLICT (moneda) DO UPDATE
    SET saldo_actual = ROUND((public.caja_monedas.saldo_actual + EXCLUDED.saldo_actual)::numeric, 2),
        updated_at = timezone('utc'::text, now());
END;
$$;

REVOKE ALL ON FUNCTION public.ajustar_saldo_caja(VARCHAR, NUMERIC) FROM PUBLIC;

-- 5. Trigger function para ingresos (donaciones_recibidas)
CREATE OR REPLACE FUNCTION public.trg_caja_donaciones_recibidas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.ajustar_saldo_caja(NEW.moneda, COALESCE(NEW.monto_original, 0));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.ajustar_saldo_caja(OLD.moneda, -COALESCE(OLD.monto_original, 0));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF UPPER(TRIM(COALESCE(NULLIF(OLD.moneda, ''), 'USD'))) IS NOT DISTINCT FROM UPPER(TRIM(COALESCE(NULLIF(NEW.moneda, ''), 'USD')))
       AND COALESCE(OLD.monto_original, 0) = COALESCE(NEW.monto_original, 0) THEN
      RETURN NEW;
    END IF;

    PERFORM public.ajustar_saldo_caja(OLD.moneda, -COALESCE(OLD.monto_original, 0));
    PERFORM public.ajustar_saldo_caja(NEW.moneda, COALESCE(NEW.monto_original, 0));
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_caja_donaciones_recibidas() FROM PUBLIC;

-- 6. Trigger function para egresos (donaciones_entregadas)
CREATE OR REPLACE FUNCTION public.trg_caja_donaciones_entregadas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.ajustar_saldo_caja(NEW.moneda, -COALESCE(NEW.monto_original, 0));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.ajustar_saldo_caja(OLD.moneda, COALESCE(OLD.monto_original, 0));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF UPPER(TRIM(COALESCE(NULLIF(OLD.moneda, ''), 'USD'))) IS NOT DISTINCT FROM UPPER(TRIM(COALESCE(NULLIF(NEW.moneda, ''), 'USD')))
       AND COALESCE(OLD.monto_original, 0) = COALESCE(NEW.monto_original, 0) THEN
      RETURN NEW;
    END IF;

    PERFORM public.ajustar_saldo_caja(OLD.moneda, COALESCE(OLD.monto_original, 0));
    PERFORM public.ajustar_saldo_caja(NEW.moneda, -COALESCE(NEW.monto_original, 0));
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_caja_donaciones_entregadas() FROM PUBLIC;

-- 7. Registrar triggers AFTER INSERT OR UPDATE OR DELETE
DROP TRIGGER IF EXISTS trigger_caja_donaciones_recibidas ON public.donaciones_recibidas;
CREATE TRIGGER trigger_caja_donaciones_recibidas
  AFTER INSERT OR UPDATE OR DELETE ON public.donaciones_recibidas
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_caja_donaciones_recibidas();

DROP TRIGGER IF EXISTS trigger_caja_donaciones_entregadas ON public.donaciones_entregadas;
CREATE TRIGGER trigger_caja_donaciones_entregadas
  AFTER INSERT OR UPDATE OR DELETE ON public.donaciones_entregadas
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_caja_donaciones_entregadas();
