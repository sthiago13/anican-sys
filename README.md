# Fundación Anican - ERP y Sistema de Gestión

Sistema de planificación de recursos y gestión administrativa interna para la Fundación Anican. Permite administrar expedientes médicos de pacientes pediátricos oncológicos y controlar el inventario de ayudas institucionales.

## Stack Tecnológico
- **Frontend:** React 19, TypeScript, Vite
- **UI:** Mantine v9
- **Backend:** Supabase (PostgreSQL + GoTrue Auth)

## Configuración del Entorno (Local / Nube)

1. **Instalar dependencias** (uso estricto de pnpm):
   ```bash
   pnpm install
   ```

2. **Variables de Entorno:**
   Copia el archivo `.env.example` a un nuevo archivo llamado `.env.local` y configura tus llaves:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase_cloud
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_secreto

   # Credenciales para el administrador por defecto
   ADMIN_EMAIL=admin@anican.org
   ADMIN_PASSWORD=usa_una_clave_larga_y_unica
   ```
   > **Nota:** La llave `SUPABASE_SERVICE_ROLE_KEY` es estrictamente necesaria para el script de inicialización de usuarios. Nunca la expongas en el código frontend.

## Inicializar el Proyecto (Seed del Administrador)

Para poder iniciar sesión por primera vez y probar la aplicación, necesitas tener un usuario **Administrador** registrado. Hemos preparado un script oficial en NodeJS que utiliza la API de Supabase para insertarlo de forma segura (compatible con entornos locales y proyectos en la nube).

Ejecuta el siguiente comando en tu terminal (requiere Node 20+ para leer el `--env-file`):

```bash
node --env-file=.env.local scripts/seed-admin.js
```

Este comando se encargará de:
1. Crear el usuario nativamente en el módulo de Autenticación (GoTrue).
2. Crear y vincular su perfil público asignándole el rol `Administrador` en la tabla `perfiles`.

## Iniciar el Servidor de Desarrollo

Una vez configuradas las variables y creado el administrador:

```bash
pnpm run dev
```

Abre tu navegador, entra a la dirección local e inicia sesión con las credenciales por defecto (`admin@anican.org` / `admin12345`).

## Continuidad de Supabase en el plan Free

El workflow `.github/workflows/supabase-keep-alive.yml` consulta diariamente la función `anican_keep_alive()` mediante GitHub Actions. La función no modifica datos de negocio; solo confirma que la API y la base de datos responden.

Configura estos secretos en el repositorio de GitHub:

- `SUPABASE_URL`: URL pública del proyecto.
- `SUPABASE_ANON_KEY`: clave pública anon del proyecto.

El workflow puede ejecutarse manualmente desde la pestaña **Actions** para comprobar la configuración. Esta mitigación depende de GitHub Actions y no sustituye un plan de Supabase sin pausa automática.

## Donaciones públicas

La landing debe enviar las donaciones a la Edge Function `registrar-donacion-publica`; la tabla `donaciones_pendientes` no acepta inserciones anónimas directas.

Configura el secreto de rate limiting y despliega la función:

```bash
pnpm exec supabase secrets set PUBLIC_DONATION_RATE_LIMIT_SALT="una-cadena-secreta-larga"
pnpm exec supabase functions deploy registrar-donacion-publica
```

El `SUPABASE_SERVICE_ROLE_KEY` es inyectado por Supabase en la Edge Function y nunca debe configurarse en Vercel, el navegador ni GitHub Actions.

## Pruebas RLS con JWT

La prueba remota usa únicamente la clave `anon` y credenciales temporales de un Voluntario y un Administrador:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co \
SUPABASE_ANON_KEY=tu_anon_key \
VOLUNTEER_EMAIL=voluntario@ejemplo.org \
VOLUNTEER_PASSWORD="clave-del-voluntario" \
ADMIN_EMAIL=admin@ejemplo.org \
ADMIN_PASSWORD="clave-del-administrador" \
pnpm run test:rls
```

En PowerShell, define las mismas variables con `$env:NOMBRE="valor"` antes de ejecutar `pnpm run test:rls`. La prueba valida inserción anónima, escalamiento de rol, aprobación de donaciones por Voluntario y lectura administrativa.
