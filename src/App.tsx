import { useState } from "react";
import {
  MantineProvider,
  createTheme,
  Box,
  Group,
  Stack,
  Title,
  Text,
  Grid,
  Card,
  Divider,
  Table,
} from "@mantine/core";
import {
  IconUsers,
  IconHeartHandshake,
  IconActivity,
  IconCash,
} from "@tabler/icons-react";
import { Sidebar } from "./components/Feature/Sidebar";
import {
  PacienteTable,
  type Paciente,
  type Representante,
} from "./components/Feature/PatientTable";
import { RegistrationStepper } from "./components/Feature/RegistrationStepper";
import { StatCard } from "./components/UI/StatCard";
import { SearchInput } from "./components/UI/SearchInput";
import { FilterDropdown } from "./components/UI/FilterDropdown";
import { Button } from "./components/UI/Button";
import { Login } from "./components/Feature/Login";

const theme = createTheme({
  primaryColor: "orange",
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

// =============================================
// Datos mock alineados a Supabase
// =============================================

const INITIAL_REPRESENTANTES: Representante[] = [
  {
    id: "rep-1",
    cedula: "V-15234567",
    nombres: "María del Carmen García",
    telefono_1: "+58 412-1234567",
    telefono_2: "+58 241-8901234",
    residencia: "Av. Bolívar Norte, Valencia, Carabobo",
  },
  {
    id: "rep-2",
    cedula: "V-18765432",
    nombres: "José Luis Rodríguez",
    telefono_1: "+58 414-7654321",
    residencia: "Urb. El Trigal, Valencia, Carabobo",
  },
  {
    id: "rep-3",
    cedula: "V-20123456",
    nombres: "Ana Beatriz Mendoza",
    telefono_1: "+58 424-5551234",
    residencia: "Sector La Isabelica, Valencia",
  },
  {
    id: "rep-4",
    cedula: "V-16789012",
    nombres: "Carlos Eduardo Pérez",
    telefono_1: "+58 416-3334567",
    telefono_2: "+58 241-6667890",
    residencia: "Municipio San Diego, Carabobo",
  },
  {
    id: "rep-5",
    cedula: "V-22345678",
    nombres: "Luisa Fernanda Torres",
    telefono_1: "+58 412-9998877",
    residencia: "Naguanagua, Carabobo",
  },
];

const INITIAL_PACIENTES: Paciente[] = [
  {
    id: "pac-1",
    id_representante: "rep-1",
    nombres: "Sebastián Alejandro",
    apellidos: "García Martínez",
    fecha_nacimiento: "2019-03-15",
    diagnostico: "Leucemia Linfoblástica Aguda",
    sexo: "Masculino",
    estado: "Activo",
    representante_nombre: "María del Carmen García",
  },
  {
    id: "pac-2",
    id_representante: "rep-2",
    nombres: "Valentina",
    apellidos: "Rodríguez Silva",
    fecha_nacimiento: "2020-07-22",
    diagnostico: "Neuroblastoma",
    sexo: "Femenino",
    estado: "Activo",
    representante_nombre: "José Luis Rodríguez",
  },
  {
    id: "pac-3",
    id_representante: "rep-3",
    nombres: "Daniel Enrique",
    apellidos: "Mendoza López",
    fecha_nacimiento: "2017-11-08",
    diagnostico: "Linfoma de Hodgkin",
    sexo: "Masculino",
    estado: "Inactivo",
    representante_nombre: "Ana Beatriz Mendoza",
  },
  {
    id: "pac-4",
    id_representante: "rep-4",
    nombres: "Camila Sofía",
    apellidos: "Pérez Herrera",
    fecha_nacimiento: "2021-01-30",
    diagnostico: "Tumor de Wilms",
    sexo: "Femenino",
    estado: "Activo",
    representante_nombre: "Carlos Eduardo Pérez",
  },
  {
    id: "pac-5",
    id_representante: "rep-5",
    nombres: "Mateo Andrés",
    apellidos: "Torres Ramírez",
    fecha_nacimiento: "2018-05-12",
    diagnostico: "Osteosarcoma",
    sexo: "Masculino",
    estado: "Activo",
    representante_nombre: "Luisa Fernanda Torres",
  },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [pacientes, setPacientes] = useState<Paciente[]>(INITIAL_PACIENTES);
  const [representantes, setRepresentantes] = useState<Representante[]>(
    INITIAL_REPRESENTANTES,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  // Handle new registration from Stepper
  const handleRegistrationComplete = (
    newRep: Representante,
    newPac: Paciente,
  ) => {
    setRepresentantes([newRep, ...representantes]);
    setPacientes([newPac, ...pacientes]);
    setActiveView("pacientes");
  };

  const handleDeletePaciente = (id: string) => {
    if (
      confirm("¿Estás seguro de que deseas eliminar este paciente del sistema?")
    ) {
      setPacientes(pacientes.filter((p) => p.id !== id));
    }
  };

  const handleEditPaciente = (paciente: Paciente) => {
    // For now, navigate to registration view (future: pre-fill form)
    console.log("Editar paciente:", paciente);
    setActiveView("registro");
  };

  // Stats calculation
  const totalPacientes = pacientes.length;
  const enTratamiento = pacientes.filter((p) => p.estado === "Activo").length;
  const inactivos = pacientes.filter((p) => p.estado === "Inactivo").length;
  const totalRepresentantes = representantes.length;

  const filterOptions = [
    { value: "Todos", label: "Todos" },
    { value: "Activo", label: "Activo" },
    { value: "Inactivo", label: "Inactivo" },
    { value: "Fallecido", label: "Fallecido" },
  ];

  if (!isAuthenticated) {
    return (
      <MantineProvider theme={theme}>
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={theme}>
      <Box
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "var(--anican-bg)",
        }}
      >
        {/* Sidebar Nav */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Main Workspace */}
        <Box
          style={{ flexGrow: 1, padding: 32, maxWidth: "calc(100% - 260px)" }}
        >
          {/* =============================================
              DASHBOARD
              ============================================= */}
          {activeView === "dashboard" && (
            <Stack gap="xl" className="anican-fade-in">
              <div>
                <Title
                  order={1}
                  style={{
                    letterSpacing: -1,
                    color: "var(--anican-azul-oscuro)",
                  }}
                >
                  Panel de Control
                </Title>
                <Text c="dimmed">Resumen general de la Fundación Anican</Text>
              </div>

              {/* KPIs Grid */}
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Pacientes Registrados"
                    value={totalPacientes}
                    icon={<IconUsers size={24} />}
                    trend={{ value: 12, type: "up" }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Pacientes Activos"
                    value={enTratamiento}
                    icon={<IconActivity size={24} />}
                    color="teal"
                    trend={{ value: 8, type: "up", label: "este mes" }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Representantes"
                    value={totalRepresentantes}
                    icon={<IconHeartHandshake size={24} />}
                    color="blue"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Pacientes Inactivos"
                    value={inactivos}
                    icon={<IconCash size={24} />}
                    color="orange"
                    trend={{
                      value: 2,
                      type: "down",
                      label: "desde la semana pasada",
                    }}
                  />
                </Grid.Col>
              </Grid>

              <Divider />

              {/* Quick Table Preview */}
              <Card withBorder radius="md" p="lg" shadow="xs">
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={3} c="var(--anican-azul-oscuro)">
                      Pacientes Recientes
                    </Title>
                    <Text size="sm" c="dimmed">
                      Últimos pacientes registrados en el sistema
                    </Text>
                  </div>
                  <Button onClick={() => setActiveView("pacientes")}>
                    Ver Todos los Pacientes
                  </Button>
                </Group>
                <PacienteTable
                  pacientes={pacientes.slice(0, 3)}
                  searchQuery=""
                  filterStatus="Todos"
                  onEditPaciente={handleEditPaciente}
                  onDeletePaciente={handleDeletePaciente}
                />
              </Card>
            </Stack>
          )}

          {/* =============================================
              PACIENTES
              ============================================= */}
          {activeView === "pacientes" && (
            <Stack gap="xl" className="anican-fade-in">
              <Group justify="space-between" align="center">
                <div>
                  <Title
                    order={1}
                    style={{
                      letterSpacing: -1,
                      color: "var(--anican-azul-oscuro)",
                    }}
                  >
                    Gestión de Pacientes
                  </Title>
                  <Text c="dimmed">
                    Consulta y administra los pacientes registrados en la
                    fundación
                  </Text>
                </div>
                <Button
                  leftSection={<IconUsers size={16} />}
                  onClick={() => setActiveView("registro")}
                >
                  Nuevo Registro
                </Button>
              </Group>

              <Card withBorder radius="md" p="lg" shadow="xs">
                <Group justify="space-between" mb="lg">
                  <Group style={{ flexGrow: 1, maxWidth: 400 }}>
                    <SearchInput
                      placeholder="Buscar por nombre, diagnóstico..."
                      onSearchChange={setSearchQuery}
                      style={{ width: "100%" }}
                    />
                  </Group>
                  <FilterDropdown
                    label="Estado"
                    options={filterOptions}
                    selectedValue={filterStatus}
                    onSelect={setFilterStatus}
                  />
                </Group>

                <PacienteTable
                  pacientes={pacientes}
                  searchQuery={searchQuery}
                  filterStatus={filterStatus}
                  onEditPaciente={handleEditPaciente}
                  onDeletePaciente={handleDeletePaciente}
                />
              </Card>
            </Stack>
          )}

          {/* =============================================
              REGISTRO (STEPPER)
              ============================================= */}
          {activeView === "registro" && (
            <RegistrationStepper
              onRegistrationComplete={handleRegistrationComplete}
            />
          )}

          {/* =============================================
              DONACIONES
              ============================================= */}
          {activeView === "donaciones" && (
            <Stack gap="xl" className="anican-fade-in">
              <div>
                <Title
                  order={1}
                  style={{
                    letterSpacing: -1,
                    color: "var(--anican-azul-oscuro)",
                  }}
                >
                  Registro de Donaciones
                </Title>
                <Text c="dimmed">
                  Visualiza los aportes recibidos y entregados por la Fundación
                  Anican
                </Text>
              </div>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <StatCard
                    title="Donaciones Entregadas"
                    value="—"
                    icon={<IconCash size={24} />}
                    color="green"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <StatCard
                    title="Donaciones Recibidas"
                    value="—"
                    icon={<IconHeartHandshake size={24} />}
                    color="blue"
                  />
                </Grid.Col>
              </Grid>

              <Card withBorder radius="md" p="lg" shadow="xs">
                <Title order={3} mb="md" c="var(--anican-azul-oscuro)">
                  Historial de Donaciones
                </Title>
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Entidad / Paciente</Table.Th>
                      <Table.Th>Tipo</Table.Th>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Observaciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Text ta="center" py="xl" c="dimmed">
                          Las donaciones se conectarán con las tablas de
                          Supabase próximamente.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Card>
            </Stack>
          )}

          {/* =============================================
              CONFIGURACIÓN
              ============================================= */}
          {activeView === "configuracion" && (
            <Stack gap="xl" className="anican-fade-in">
              <div>
                <Title
                  order={1}
                  style={{
                    letterSpacing: -1,
                    color: "var(--anican-azul-oscuro)",
                  }}
                >
                  Configuración del Sistema
                </Title>
                <Text c="dimmed">
                  Ajustes generales del panel administrativo de Anican
                </Text>
              </div>

              <Card withBorder radius="md" p="lg" shadow="xs">
                <Stack gap="md">
                  <Title order={4} c="var(--anican-azul-oscuro)">
                    Preferencias Generales
                  </Title>
                  <Text size="sm" c="dimmed">
                    El sistema está configurado en español. Gestión de pacientes
                    pediátricos oncológicos y sus representantes legales.
                  </Text>
                  <Divider />
                  <Group justify="space-between">
                    <div>
                      <Text fw={600} c="var(--anican-azul-oscuro)">
                        Tema del Sistema
                      </Text>
                      <Text size="xs" c="dimmed">
                        Cambiar la apariencia de la interfaz
                      </Text>
                    </div>
                    <Button variant="outline" color="gray" disabled>
                      Tema Claro (Predeterminado)
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          )}
        </Box>
      </Box>
    </MantineProvider>
  );
}

export default App;
