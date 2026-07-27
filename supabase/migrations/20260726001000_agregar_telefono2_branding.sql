-- Migración para agregar la columna telefono_2 a la tabla configuracion_branding

ALTER TABLE public.configuracion_branding
ADD COLUMN IF NOT EXISTS telefono_2 VARCHAR(30) DEFAULT '';
