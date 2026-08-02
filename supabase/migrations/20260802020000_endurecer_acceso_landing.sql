-- Mantener lectura pública, pero reservar escritura del CMS al endpoint server-side.

ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir gestion de landing_content" ON public.landing_content;
DROP POLICY IF EXISTS "Permitir lectura publica de landing_content" ON public.landing_content;

CREATE POLICY "Permitir lectura publica de landing_content"
  ON public.landing_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir gestion autenticada de landing_content"
  ON public.landing_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir insercion publica en landing-media" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminacion publica de landing-media" ON storage.objects;

CREATE POLICY "Permitir insercion autenticada en landing-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'landing-media');

CREATE POLICY "Permitir actualizacion autenticada en landing-media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'landing-media')
  WITH CHECK (bucket_id = 'landing-media');

CREATE POLICY "Permitir eliminacion autenticada de landing-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'landing-media');
