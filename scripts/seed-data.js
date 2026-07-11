import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ ERROR: Faltan variables de entorno.");
  console.error("Asegúrate de definir 'VITE_SUPABASE_URL' y 'VITE_SUPABASE_SERVICE_ROLE_KEY' en tu archivo .env.local");
  console.error("Ejecuta el script con: node --env-file=.env.local scripts/seed-data.js");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Nombres y Apellidos comunes en español para generar datos ficticios
const NOMBRES_MASCULINOS = [
  'Santiago', 'Mateo', 'Juan', 'Sebastián', 'Alejandro', 'Nicolás', 'Samuel', 'Diego', 'Daniel', 'Leandro',
  'Luis', 'Carlos', 'Ángel', 'José', 'Jesús', 'Gabriel', 'Andrés', 'Miguel', 'David', 'Javier'
];
const NOMBRES_FEMENINOS = [
  'Sofía', 'Valentina', 'Isabella', 'Camila', 'Mariana', 'Gabriela', 'Victoria', 'Lucía', 'Martina', 'Luciana',
  'Andrea', 'Natalia', 'María', 'Carmen', 'Ana', 'Elena', 'Laura', 'Paula', 'Isabel', 'Clara'
];
const APELLIDOS = [
  'Hernández', 'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Flores',
  'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Ortiz', 'Torres', 'Gutiérrez', 'Ruiz', 'Alvarado',
  'Castillo', 'Vargas', 'Ramos', 'Mendoza', 'Castro', 'Álvarez', 'Rojas', 'Medina', 'Rivas', 'Suárez'
];

const CIUDADES = [
  'Barquisimeto, Edo. Lara', 'Cabudare, Edo. Lara', 'Carora, Edo. Lara', 'San Cristóbal, Edo. Táchira',
  'Mérida, Edo. Mérida', 'Maracaibo, Edo. Zulia', 'Caracas, Distrito Capital', 'Valencia, Edo. Carabobo',
  'Maracay, Edo. Aragua', 'Cúcuta, Norte de Santander'
];

const DONANTES = [
  'Fundación Polar', 'Club de Leones Barquisimeto', 'Donante Anónimo', 'Farmacia SAAS', 'Dr. Carlos Rodríguez',
  'Farmatodo C.A.', 'Empresas Polar', 'Asociación Civil Fe y Alegría', 'Supermercados Garzón', 'Colegio de Médicos',
  'Inversiones Médicas del Centro', 'Fundación Solidaridad', 'Grupo Ramos', 'Distribuidora Occidental'
];

const CATEGORIAS_AYUDA = [
  'Medicamentos', 'Insumos Médicos', 'Nutrición y Suplementos', 'Servicios Médicos', 'Logística y Traslado'
];

const ARTICULOS_AYUDA = [
  { nombre_articulo: 'Quimioterapia (Ciclo)', categoria: 'Medicamentos' },
  { nombre_articulo: 'Antibióticos Endovenosos', categoria: 'Medicamentos' },
  { nombre_articulo: 'Analgésicos (Ampollas)', categoria: 'Medicamentos' },
  { nombre_articulo: 'Antieméticos (Ondansetrón)', categoria: 'Medicamentos' },
  { nombre_articulo: 'Catéter de Puerto (Port-a-cath)', categoria: 'Insumos Médicos' },
  { nombre_articulo: 'Pañales Desechables (Talla G)', categoria: 'Insumos Médicos' },
  { nombre_articulo: 'Pañales Desechables (Talla M)', categoria: 'Insumos Médicos' },
  { nombre_articulo: 'Jeringas 10cc (Caja 100 uds)', categoria: 'Insumos Médicos' },
  { nombre_articulo: 'Agujas Huber para Catéter', categoria: 'Insumos Médicos' },
  { nombre_articulo: 'Fórmula Láctea Pediátrica', categoria: 'Nutrición y Suplementos' },
  { nombre_articulo: 'Suplemento Nutricional Pediasure', categoria: 'Nutrición y Suplementos' },
  { nombre_articulo: 'Examen de Laboratorio (Perfil 20)', categoria: 'Servicios Médicos' },
  { nombre_articulo: 'Estudio de Imagen (Tomografía)', categoria: 'Servicios Médicos' },
  { nombre_articulo: 'Ecocardiograma Pediátrico', categoria: 'Servicios Médicos' },
  { nombre_articulo: 'Apoyo Económico para Pasaje de Autobús', categoria: 'Logística y Traslado' }
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max, decimals = 0) {
  const rand = Math.random() * (max - min) + min;
  const power = Math.pow(10, decimals);
  return Math.round(rand * power) / power;
}

// Genera un histórico de fechas de los últimos 24 meses hacia atrás
function generateDates(monthsCount = 24) {
  const dates = [];
  const today = new Date();
  for (let i = monthsCount * 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// Generar una cédula venezolana aleatoria
function generateCedula() {
  const num = getRandomNumber(8000000, 32000000);
  const letra = Math.random() > 0.05 ? 'V' : 'E';
  return `${letra}-${num}`;
}

// Generar un teléfono aleatorio
function generateTelefono() {
  const prefijos = ['0414', '0424', '0412', '0416', '0426', '0251', '0276'];
  const prefijo = getRandomElement(prefijos);
  const num = String(getRandomNumber(1000000, 9999999));
  return `${prefijo}-${num}`;
}

// Generar fecha de nacimiento pediátrica (de 1 a 17 años)
function generateFechaNacimiento() {
  const today = new Date();
  const ageInYears = getRandomNumber(1, 17);
  const birthDate = new Date(today);
  birthDate.setFullYear(today.getFullYear() - ageInYears);
  // Ajustar días aleatorios
  birthDate.setDate(birthDate.getDate() - getRandomNumber(0, 365));
  return birthDate.toISOString().split('T')[0];
}

async function seed() {
  console.log('🚀 Iniciando seeding masivo de datos de prueba...');

  try {
    // 1. Obtener el ID del administrador principal
    console.log('🔍 Buscando perfil de Administrador...');
    const { data: perfilesData, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('rol', 'Administrador')
      .limit(1);

    if (perfilesError || !perfilesData || perfilesData.length === 0) {
      throw new Error('No se encontró ningún perfil de Administrador en la tabla perfiles. Corre primero: node --env-file=.env.local scripts/seed-admin.js');
    }
    const adminId = perfilesData[0].id;
    console.log(`✅ ID de Administrador encontrado: ${adminId}`);

    // 2. Generar tasas de cambio históricas (24 meses)
    console.log('📈 Generando tasas de cambio diarias...');
    const dates = generateDates(24);
    
    // Tasa inicial base
    let currentVes = 36.50;
    let currentCop = 3950.00;

    const tasasToInsert = [];
    const tasasMap = new Map(); // Para buscar rápidamente la tasa por fecha

    for (const fecha of dates) {
      // Fluctuaciones suaves hacia arriba con ligera deriva alcista
      currentVes += getRandomNumber(-0.02, 0.05, 4);
      currentCop += getRandomNumber(-5.0, 8.0, 4);

      if (currentVes < 25.0) currentVes = 25.0;
      if (currentCop < 3000.0) currentCop = 3000.0;

      tasasToInsert.push({
        fecha,
        tasa_ves: parseFloat(currentVes.toFixed(4)),
        tasa_cop: parseFloat(currentCop.toFixed(4)),
        actualizado_por: adminId
      });

      tasasMap.set(fecha, {
        tasa_ves: currentVes,
        tasa_cop: currentCop
      });
    }

    const { error: errorTasas } = await supabase
      .from('tasas_cambio')
      .upsert(tasasToInsert, { onConflict: 'fecha' });

    if (errorTasas) {
      console.error('❌ Error insertando tasas_cambio:', errorTasas.message);
      throw errorTasas;
    }
    console.log(`✅ ${tasasToInsert.length} tasas de cambio registradas/actualizadas.`);

    // 3. Poblar Catálogo de Ayudas
    console.log('📦 Creando catálogo de ayudas institucionales...');
    const { data: ayudasExistentes, error: errorAyudasGet } = await supabase
      .from('catalogo_ayudas')
      .select('id, nombre_articulo');

    if (errorAyudasGet) throw errorAyudasGet;

    let ayudasIds = [];
    if (ayudasExistentes.length === 0) {
      const { data: ayudasNuevas, error: errorAyudasIns } = await supabase
        .from('catalogo_ayudas')
        .insert(ARTICULOS_AYUDA)
        .select();

      if (errorAyudasIns) throw errorAyudasIns;
      ayudasIds = ayudasNuevas;
      console.log(`✅ Catálogo de ayudas creado con ${ayudasNuevas.length} artículos.`);
    } else {
      ayudasIds = ayudasExistentes;
      console.log(`⚠️ El catálogo ya tiene ${ayudasExistentes.length} artículos. Usando los existentes.`);
    }

    // 4. Obtener Diagnósticos
    console.log('🩺 Obteniendo lista de diagnósticos...');
    const { data: diagnosticosData, error: errorDiag } = await supabase
      .from('diagnosticos')
      .select('id, nombre');

    if (errorDiag || !diagnosticosData || diagnosticosData.length === 0) {
      throw new Error('No hay diagnósticos en la base de datos. Verifica tus migraciones.');
    }
    console.log(`✅ Se encontraron ${diagnosticosData.length} diagnósticos.`);

    // 5. Generar Representantes
    console.log('👥 Generando 40 representantes legales...');
    const representantesToInsert = [];
    
    // Generar nombres y cédulas asegurando no colisionar localmente
    const cedulasUnicas = new Set();
    while (cedulasUnicas.size < 40) {
      cedulasUnicas.add(generateCedula());
    }
    const cedulasList = Array.from(cedulasUnicas);

    for (let i = 0; i < 40; i++) {
      const nombres = Math.random() > 0.5 
        ? `${getRandomElement(NOMBRES_FEMENINOS)} ${getRandomElement(APELLIDOS)}`
        : `${getRandomElement(NOMBRES_MASCULINOS)} ${getRandomElement(APELLIDOS)}`;

      representantesToInsert.push({
        cedula: cedulasList[i],
        nombres,
        telefono_1: generateTelefono(),
        telefono_2: Math.random() > 0.3 ? generateTelefono() : null,
        residencia: getRandomElement(CIUDADES)
      });
    }

    const { data: representantesInsertados, error: errorReps } = await supabase
      .from('representantes')
      .upsert(representantesToInsert, { onConflict: 'cedula' })
      .select();

    if (errorReps) {
      console.error('❌ Error insertando representantes:', errorReps.message);
      throw errorReps;
    }
    console.log(`✅ ${representantesInsertados.length} representantes legales insertados/sincronizados.`);

    // 6. Generar Pacientes
    console.log('👶 Generando 50 pacientes pediátricos...');
    const pacientesToInsert = [];

    for (let i = 0; i < 50; i++) {
      const sexo = Math.random() > 0.5 ? 'Masculino' : 'Femenino';
      const nombres = sexo === 'Masculino'
        ? `${getRandomElement(NOMBRES_MASCULINOS)} ${getRandomElement(NOMBRES_MASCULINOS)}`
        : `${getRandomElement(NOMBRES_FEMENINOS)} ${getRandomElement(NOMBRES_FEMENINOS)}`;
      const apellidos = `${getRandomElement(APELLIDOS)} ${getRandomElement(APELLIDOS)}`;
      
      const estadoRand = Math.random();
      const estado = estadoRand < 0.80 ? 'Activo' : (estadoRand < 0.90 ? 'Inactivo' : 'Fallecido');
      
      // Asociar a un representante aleatorio
      const rep = getRandomElement(representantesInsertados);
      // Asociar a un diagnóstico aleatorio
      const diag = getRandomElement(diagnosticosData);

      pacientesToInsert.push({
        id_representante: rep.id,
        nombres,
        apellidos,
        fecha_nacimiento: generateFechaNacimiento(),
        sexo,
        estado,
        id_diagnostico: diag.id
      });
    }

    const { data: pacientesInsertados, error: errorPacs } = await supabase
      .from('pacientes')
      .insert(pacientesToInsert)
      .select();

    if (errorPacs) {
      console.error('❌ Error insertando pacientes:', errorPacs.message);
      throw errorPacs;
    }
    console.log(`✅ ${pacientesInsertados.length} pacientes registrados con éxito.`);

    // 7. Generar Donaciones Recibidas (Ingresos - 150 registros)
    console.log('💰 Generando 150 donaciones recibidas (Ingresos)...');
    const donacionesRecibidasToInsert = [];

    for (let i = 0; i < 150; i++) {
      // Fecha aleatoria de la lista de fechas
      const fecha = getRandomElement(dates);
      const donante = getRandomElement(DONANTES);
      const ayuda = getRandomElement(ayudasIds);
      
      const monedaRand = Math.random();
      const moneda = monedaRand < 0.4 ? 'USD' : (monedaRand < 0.8 ? 'VES' : 'COP');
      
      let montoOriginal = 0;
      let tasaCambio = 1.0;
      let montoEquivalenteUsd = 0;

      const tasasDia = tasasMap.get(fecha) || { tasa_ves: 36.5, tasa_cop: 3950.0 };

      if (moneda === 'USD') {
        montoOriginal = getRandomNumber(10, 1500, 2);
        tasaCambio = 1.0;
        montoEquivalenteUsd = montoOriginal;
      } else if (moneda === 'VES') {
        montoOriginal = getRandomNumber(500, 40000, 2);
        tasaCambio = parseFloat(tasasDia.tasa_ves.toFixed(4));
        montoEquivalenteUsd = parseFloat((montoOriginal / tasaCambio).toFixed(2));
      } else {
        montoOriginal = getRandomNumber(50000, 4000000, 2);
        tasaCambio = parseFloat(tasasDia.tasa_cop.toFixed(4));
        montoEquivalenteUsd = parseFloat((montoOriginal / tasaCambio).toFixed(2));
      }

      const observaciones = Math.random() > 0.6 
        ? `Donación para apoyo en el área de ${ayuda.nombre_articulo}.`
        : null;

      const monto_o_cantidad = `${montoOriginal.toFixed(2)} ${moneda}`;

      donacionesRecibidasToInsert.push({
        fecha,
        entidad_donante: donante,
        monto_o_cantidad,
        observaciones,
        registrado_por: adminId,
        moneda,
        monto_original: montoOriginal,
        tasa_cambio: tasaCambio,
        monto_equivalente_usd: montoEquivalenteUsd,
        id_ayuda: ayuda.id
      });
    }

    const { error: errorRecibidas } = await supabase
      .from('donaciones_recibidas')
      .insert(donacionesRecibidasToInsert);

    if (errorRecibidas) {
      console.error('❌ Error insertando donaciones_recibidas:', errorRecibidas.message);
      throw errorRecibidas;
    }
    console.log(`✅ ${donacionesRecibidasToInsert.length} donaciones recibidas insertadas correctamente.`);

    // 8. Generar Donaciones Entregadas (Egresos - 250 registros)
    console.log('🎁 Generando 250 donaciones entregadas (Egresos)...');
    const donacionesEntregadasToInsert = [];

    // Costos base estimados en USD para las ayudas para calcular montos realistas
    const costosAyudaUsd = {
      'Quimioterapia (Ciclo)': 120.00,
      'Antibióticos Endovenosos': 45.00,
      'Analgésicos (Ampollas)': 8.00,
      'Antieméticos (Ondansetrón)': 12.00,
      'Catéter de Puerto (Port-a-cath)': 150.00,
      'Pañales Desechables (Talla G)': 18.00,
      'Pañales Desechables (Talla M)': 16.00,
      'Jeringas 10cc (Caja 100 uds)': 10.00,
      'Agujas Huber para Catéter': 5.00,
      'Fórmula Láctea Pediátrica': 15.00,
      'Suplemento Nutricional Pediasure': 22.00,
      'Examen de Laboratorio (Perfil 20)': 15.00,
      'Estudio de Imagen (Tomografía)': 80.00,
      'Ecocardiograma Pediátrico': 40.00,
      'Apoyo Económico para Pasaje de Autobús': 25.00
    };

    for (let i = 0; i < 250; i++) {
      const fecha = getRandomElement(dates);
      const ayuda = getRandomElement(ayudasIds);
      const esPacienteInterno = Math.random() > 0.12;
      
      let id_paciente = null;
      let beneficiario_externo = null;

      if (esPacienteInterno) {
        id_paciente = getRandomElement(pacientesInsertados).id;
      } else {
        beneficiario_externo = getRandomElement([
          'Hospital Pedíatrico Agustín Zubillaga',
          'Unidad de Oncología Infantil HCUAMP',
          'Hospital Central Antonio María Pineda'
        ]);
      }

      const cantidad = getRandomElement([1, 1, 1, 2, 3]);
      const costoUnitarioUsd = costosAyudaUsd[ayuda.nombre_articulo] || 15.00;
      const costoTotalUsd = costoUnitarioUsd * cantidad;

      const monedaRand = Math.random();
      const moneda = monedaRand < 0.6 ? 'USD' : (monedaRand < 0.9 ? 'VES' : 'COP');
      
      let montoOriginal = 0;
      let tasaCambio = 1.0;
      let montoEquivalenteUsd = costoTotalUsd;

      const tasasDia = tasasMap.get(fecha) || { tasa_ves: 36.5, tasa_cop: 3950.0 };

      if (moneda === 'USD') {
        montoOriginal = costoTotalUsd;
        tasaCambio = 1.0;
      } else if (moneda === 'VES') {
        tasaCambio = parseFloat(tasasDia.tasa_ves.toFixed(4));
        montoOriginal = parseFloat((costoTotalUsd * tasaCambio).toFixed(2));
      } else {
        tasaCambio = parseFloat(tasasDia.tasa_cop.toFixed(4));
        montoOriginal = parseFloat((costoTotalUsd * tasaCambio).toFixed(2));
      }

      donacionesEntregadasToInsert.push({
        fecha,
        id_paciente,
        beneficiario_externo,
        id_ayuda: ayuda.id,
        cantidad,
        monto_equivalente: parseFloat(montoEquivalenteUsd.toFixed(2)),
        con_soporte: Math.random() > 0.2,
        observaciones: Math.random() > 0.8 ? 'Entrega prioritaria para tratamiento.' : null,
        registrado_por: adminId,
        moneda,
        monto_original: montoOriginal,
        tasa_cambio: tasaCambio
      });
    }

    const { error: errorEntregadas } = await supabase
      .from('donaciones_entregadas')
      .insert(donacionesEntregadasToInsert);

    if (errorEntregadas) {
      console.error('❌ Error insertando donaciones_entregadas:', errorEntregadas.message);
      throw errorEntregadas;
    }
    console.log(`✅ ${donacionesEntregadasToInsert.length} donaciones entregadas insertadas correctamente.`);

    console.log('🎉 ¡El seed masivo de la base de datos se ha completado con éxito!');
  } catch (err) {
    console.error('❌ Proceso de seed fallido:', err);
    process.exit(1);
  }
}

seed();
