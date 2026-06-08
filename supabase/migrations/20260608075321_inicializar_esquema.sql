-- 0. Tabla de Perfiles (Se vincula automáticamente a los usuarios registrados en auth)
CREATE TABLE perfiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  rol VARCHAR(50) DEFAULT 'Voluntario', -- Puede ser 'Administrador' o 'Voluntario'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1. Tabla de Representantes
CREATE TABLE representantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  telefono_1 VARCHAR(20),
  telefono_2 VARCHAR(20),
  residencia TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Pacientes
CREATE TABLE pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_representante UUID REFERENCES representantes(id) ON DELETE SET NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  diagnostico VARCHAR(150),
  sexo VARCHAR(10),
  estado VARCHAR(20) DEFAULT 'Activo', -- 'Activo', 'Fallecido', 'Inactivo'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Catálogo de Ayudas (Medicamentos, Insumos, Servicios)
CREATE TABLE catalogo_ayudas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_articulo VARCHAR(150) NOT NULL,
  categoria VARCHAR(50) NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Donaciones Entregadas (Egresos)
CREATE TABLE donaciones_entregadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  id_paciente UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  beneficiario_externo VARCHAR(150), -- Para entidades como Hospital Central
  id_ayuda UUID REFERENCES catalogo_ayudas(id) ON DELETE RESTRICT,
  metodo_entrega VARCHAR(50), 
  cantidad INT DEFAULT 1,
  monto_equivalente DECIMAL(12, 2), -- Valor numérico referencial (ej. en USD o COP)
  con_soporte BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  registrado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL, -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Donaciones Recibidas (Ingresos)
CREATE TABLE donaciones_recibidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  entidad_donante VARCHAR(150) NOT NULL, 
  metodo_ingreso VARCHAR(50), 
  monto_o_cantidad TEXT NOT NULL, 
  observaciones TEXT,
  registrado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL, -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);