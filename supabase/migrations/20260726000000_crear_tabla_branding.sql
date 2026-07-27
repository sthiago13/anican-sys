-- Migración para crear la tabla de configuración de branding y bucket de almacenamiento para imágenes institucionales

-- 1. Tabla de configuración de branding (Patrón Singleton)
CREATE TABLE IF NOT EXISTS public.configuracion_branding (
  id INT PRIMARY KEY DEFAULT 1 CONSTRAINT configuracion_branding_single_row CHECK (id = 1),
  nombre_fundacion VARCHAR(150) NOT NULL DEFAULT 'Fundación Anican',
  rif VARCHAR(30) DEFAULT 'J-00000000-0',
  correo VARCHAR(100) DEFAULT 'contacto@anican.org',
  telefono VARCHAR(30) DEFAULT '',
  telefono_2 VARCHAR(30) DEFAULT '',
  direccion TEXT DEFAULT '',
  logo_url TEXT DEFAULT NULL,
  favicon_url TEXT DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES public.perfiles(id) ON DELETE SET NULL
);

-- 2. Insertar registro inicial semilla (Seed data)
INSERT INTO public.configuracion_branding (id, nombre_fundacion, rif, correo, telefono, direccion)
VALUES (1, 'Fundación Anican', 'J-00000000-0', 'contacto@anican.org', '', '')
ON CONFLICT (id) DO NOTHING;

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.configuracion_branding ENABLE ROW LEVEL SECURITY;

-- 4. Política de Lectura Pública (Permite a anónimos en el Login y autenticados ver el branding)
CREATE POLICY "Permitir lectura de branding a todos los usuarios"
  ON public.configuracion_branding FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Política de Actualización Restringida a Administradores
CREATE POLICY "Permitir actualización de branding solo a Administradores"
  ON public.configuracion_branding FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'Administrador'
    )
  );

-- 6. Configuración de Bucket en Supabase Storage para logotipos y recursos de branding
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para Storage (Bucket 'branding')
-- Nota: Al ser un bucket público ('public = true'), el acceso a las imágenes por URL es público por defecto.
-- No se requiere una política SELECT abierta en storage.objects, evitando que clientes anónimos listen el directorio.

CREATE POLICY "Solo Administradores pueden gestionar imagenes de branding en storage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'branding' AND
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'Administrador'
    )
  );
