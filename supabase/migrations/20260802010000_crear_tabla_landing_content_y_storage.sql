-- Migración para almacenar la configuración y contenidos editables de la Landing Page de ANICAN

CREATE TABLE IF NOT EXISTS public.landing_content (
  key VARCHAR(100) PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.landing_content IS 'Contenidos dinámicos, textos, listas y configuraciones de la landing page';

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

-- Lectura pública para cualquier visitante de la landing
DROP POLICY IF EXISTS "Permitir lectura publica de landing_content" ON public.landing_content;
CREATE POLICY "Permitir lectura publica de landing_content"
  ON public.landing_content FOR SELECT
  TO anon, authenticated
  USING (true);

-- La escritura del CMS se protege posteriormente con la migración de endurecimiento RLS.
DROP POLICY IF EXISTS "Permitir gestion de landing_content" ON public.landing_content;
CREATE POLICY "Permitir gestion de landing_content"
  ON public.landing_content FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Crear el bucket público para los medios de la landing
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-media', 'landing-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Lectura pública de imágenes y materiales publicados
DROP POLICY IF EXISTS "Permitir lectura publica de landing-media" ON storage.objects;
CREATE POLICY "Permitir lectura publica de landing-media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'landing-media');

-- Estas políticas se reemplazan por políticas autenticadas en la migración de endurecimiento.
DROP POLICY IF EXISTS "Permitir insercion publica en landing-media" ON storage.objects;
CREATE POLICY "Permitir insercion publica en landing-media"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'landing-media');

DROP POLICY IF EXISTS "Permitir eliminacion publica de landing-media" ON storage.objects;
CREATE POLICY "Permitir eliminacion publica de landing-media"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'landing-media');
