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
   ADMIN_PASSWORD=admin12345
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
