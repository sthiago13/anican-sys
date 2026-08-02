import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "VOLUNTEER_EMAIL",
  "VOLUNTEER_PASSWORD",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

for (const name of required) {
  if (!process.env[name]) throw new Error(`Falta la variable ${name}.`);
}

const createTestClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const expectError = async (label, operation) => {
  const { error } = await operation();
  assert(error, `${label}: la operación fue permitida.`);
  console.log(`PASS ${label}`);
};

const signIn = async (email, password) => {
  const client = createTestClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`No se pudo autenticar ${email}.`);
  return { client, user: data.user };
};

const anon = createTestClient();
await expectError("anon no inserta donaciones pendientes", () => anon
  .from("donaciones_pendientes")
  .insert({ entidad_donante: "RLS test", monto_o_cantidad: "1", moneda: "USD" }));

const volunteer = await signIn(process.env.VOLUNTEER_EMAIL, process.env.VOLUNTEER_PASSWORD);
const { data: volunteerProfile, error: volunteerProfileError } = await volunteer.client
  .from("perfiles")
  .select("rol")
  .eq("id", volunteer.user.id)
  .single();
if (volunteerProfileError) throw new Error("No se pudo leer el perfil del Voluntario.");

await expectError("Voluntario no modifica su rol", () => volunteer.client
  .from("perfiles")
  .update({ rol: volunteerProfile.rol })
  .eq("id", volunteer.user.id)
  .select("id")
  .single());

await expectError("Voluntario no aprueba donaciones", () => volunteer.client.rpc(
  "aprobar_donacion_pendiente",
  { p_id_pendiente: crypto.randomUUID(), p_registrado_por: volunteer.user.id },
));

const admin = await signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
const { error: adminPendingError } = await admin.client
  .from("donaciones_pendientes")
  .select("id")
  .limit(1);
assert(!adminPendingError, "Administrador no pudo consultar donaciones pendientes.");
console.log("PASS Administrador consulta donaciones pendientes");

console.log("RLS JWT checks completed successfully.");
