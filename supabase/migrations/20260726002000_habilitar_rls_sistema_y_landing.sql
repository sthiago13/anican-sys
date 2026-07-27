-- Migración para habilitar Row Level Security (RLS) en el esquema público y permitir inserción anónima desde la Landing Page

-- 1. Habilitar RLS en las 7 tablas del sistema
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_ayudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donaciones_entregadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donaciones_recibidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Seguridad para usuarios autenticados del ERP (Voluntarios y Administradores)
-- Tabla perfiles
CREATE POLICY "Permitir lectura de perfiles a autenticados"
  ON public.perfiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir insercion de perfiles a autenticados"
  ON public.perfiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de perfiles a autenticados"
  ON public.perfiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla representantes: gestión total para autenticados
CREATE POLICY "Permitir gestion total de representantes a autenticados"
  ON public.representantes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla pacientes: gestión total para autenticados
CREATE POLICY "Permitir gestion total de pacientes a autenticados"
  ON public.pacientes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla catalogo_ayudas: gestión total para autenticados
CREATE POLICY "Permitir gestion total de catalogo_ayudas a autenticados"
  ON public.catalogo_ayudas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla donaciones_entregadas: gestión total para autenticados
CREATE POLICY "Permitir gestion total de donaciones_entregadas a autenticados"
  ON public.donaciones_entregadas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla donaciones_recibidas: gestión total para autenticados
CREATE POLICY "Permitir gestion total de donaciones_recibidas a autenticados"
  ON public.donaciones_recibidas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla diagnosticos: gestión total para autenticados
CREATE POLICY "Permitir gestion total de diagnosticos a autenticados"
  ON public.diagnosticos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Política de Seguridad para la Landing Page (Usuarios anónimos)
-- Permitir únicamente la inserción de nuevas donaciones recibidas desde el formulario público web
CREATE POLICY "Permitir insercion publica de donaciones desde la landing page"
  ON public.donaciones_recibidas FOR INSERT
  TO anon
  WITH CHECK (true);
