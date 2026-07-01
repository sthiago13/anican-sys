-- Seed file: Poblar datos iniciales para el entorno de desarrollo local.
-- Este archivo se ejecuta automáticamente al hacer `supabase start` o `supabase db reset`.

DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  -- 1. Insertar el usuario de prueba en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_uid,
    'authenticated',
    'authenticated',
    'admin@anican.org',
    crypt('admin12345', gen_salt('bf')), -- Contraseña por defecto para testing local
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Administrador Principal"}',
    now(),
    now()
  );

  -- 2. Insertar la identidad del usuario
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_uid,
    format('{"sub":"%s","email":"%s"}', admin_uid::text, 'admin@anican.org')::jsonb,
    'email',
    admin_uid::text,
    now(),
    now(),
    now()
  );

  -- 3. Vincular el perfil público con rol "Administrador"
  INSERT INTO public.perfiles (
    id,
    nombres,
    rol
  ) VALUES (
    admin_uid,
    'Administrador Principal',
    'Administrador'
  );
END $$;
