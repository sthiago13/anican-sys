import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: Para crear usuarios y bypassear RLS se necesita el service_role key, NO el anon key.
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const email = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const password = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ ERROR: Faltan variables de entorno.");
  console.error("Asegúrate de definir 'VITE_SUPABASE_URL' y 'SUPABASE_SERVICE_ROLE_KEY' en tu archivo .env.local");
  console.error("Ejecuta el script de esta manera si usas Node 20+: node --env-file=.env.local scripts/seed-admin.js");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedAdmin() {
  console.log(`⏳ Creando usuario administrador: ${email}...`);

  // 1. Crear el usuario usando la API de admin (GoTrue)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Esto simula que el usuario ya confirmó su correo
    user_metadata: { name: 'Administrador Principal' }
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
      console.log('⚠️ El usuario ya existe en Supabase Auth. Buscando su ID...');
    } else {
      console.error('❌ Error creando usuario en Auth:', authError.message);
      return;
    }
  } else {
    console.log(`✅ Usuario creado en Supabase Auth con ID: ${authData.user.id}`);
  }

  // Obtener el ID del usuario recién creado o del existente
  let userId;
  if (authData?.user) {
    userId = authData.user.id;
  } else {
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ No se pudo listar usuarios:', listError.message);
      return;
    }
    const existingUser = usersData.users.find(u => u.email === email);
    if (!existingUser) {
      console.error('❌ No se encontró el usuario.');
      return;
    }
    userId = existingUser.id;
  }

  // 2. Insertar o actualizar su perfil público con el rol superior
  console.log('⏳ Creando/actualizando registro en tabla `perfiles`...');
  const { error: profileError } = await supabase
    .from('perfiles')
    .upsert({
      id: userId,
      nombres: 'Administrador Principal',
      rol: 'Administrador'
    });

  if (profileError) {
    console.error('❌ Error creando perfil:', profileError.message);
    return;
  }

  console.log('✅ Perfil vinculado correctamente en la base de datos.');
  console.log('🎉 Seed completado exitosamente. Ahora puedes iniciar sesión con las credenciales dadas.');
}

seedAdmin();
