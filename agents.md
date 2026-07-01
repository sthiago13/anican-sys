# Contexto del Proyecto: anican-sys

## Propósito del Sistema
Sistema de planificación de recursos (ERP) y gestión administrativa interna para la Fundación Anican (Fundación de Ayuda a Niños con Cáncer). Permite administrar expedientes médicos de pacientes pediátricos oncológicos, controlar tutores legales (representantes) y auditar de extremo a extremo las donaciones entrantes y salientes.

## Stack Tecnológico Principal
- **Frontend:** React 19 (Functional Components, Hooks avanzados), Vite, TypeScript.
- **Estilos y Componentes UI:** Mantine v9 (Uso mandatorio de `MantineProvider` y componentes nativos de `@mantine/core`).
- **Iconografía:** `@tabler/icons-react`.
- **Backend & Base de Datos:** Supabase (PostgreSQL para almacenamiento persistente y Supabase Auth para la gestión de accesos).

## Estructura del Repositorio
- `src/config/`: Configuración y arranque del cliente SDK de Supabase.
- `src/components/UI/`: Componentes genéricos de interfaz (Botones, Inputs estilizados).
- `src/components/Feature/`: Módulos específicos de lógica de negocio (Login, Tablas de pacientes, Flujos guiados de registro).
- `supabase/migrations/`: Archivos de control de versiones y esquemas de la base de datos SQL.

## Reglas y Convenciones de Desarrollo
1. **Tipado Estricto:** Todo componente, propiedad o respuesta de base de datos debe estar debidamente tipado bajo interfaces claras de TypeScript.
2. **Estilizado Consistente:** No escribir CSS tradicional ni sobreescribir estilos globales a menos que sea indispensable. Utilizar las propiedades de personalización de Mantine v9 y las variables de diseño declaradas en `src/index.css`.
3. **Flujo de Mutaciones en DB:** Toda inserción de pacientes requiere la existencia previa de un registro de representante en cumplimiento con el esquema relacional relacional de la base de datos.
4. **Restricciones de Vocabulario:** Bajo ninguna circunstancia se debe emplear el término "Quirúrgica" en la documentación, interfaces de usuario, comentarios de código o registros médicos dentro del sistema.

## Estado Actual y Próximos Pasos
- El diseño visual del Dashboard, Login y Gestión de Pacientes se encuentra completado con datos simulados (Mocks).
- **Tarea Prioritaria:** Migrar el estado local en memoria hacia consultas asíncronas directas utilizando el cliente expuesto en `src/config/supabase.ts`.
- **Siguiente Módulo:** Implementar interfaces operativas y flujos lógicos para el control de inventario de ayudas institucionales y reportes financieros de donaciones.

## Uso estricto de pnpm
- Siempre que se instale una nueva dependencia se debe usar "pnpm add <nombre_de_la_dependencia>"
- Nunca usar "npm add <nombre_de_la_dependencia>"