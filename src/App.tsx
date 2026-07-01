import { useState, useEffect } from "react";
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
  Center,
  Loader,
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
import { supabase } from "./config/supabase";

const theme = createTheme({
  primaryColor: "orange",
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

interface DbPaciente {
  id: string;
  id_representante: string | null;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  diagnostico: string | null;
  sexo: string | null;
  estado: Paciente["estado"];
  created_at?: string;
  representantes: { nombres: string } | { nombres: string }[] | null;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pacData, error: pacError } = await supabase.from(
        "pacientes",
      ).select(`
          id,
          id_representante,
          nombres,
          apellidos,
          fecha_nacimiento,
          diagnostico,
          sexo,
          estado,
          created_at,
          representantes (
            nombres
          )
        `);

      if (pacError) throw pacError;

      const { data: repData, error: repError } = await supabase
        .from("representantes")
        .select("*");

      if (repError) throw repError;

      const mappedPacientes: Paciente[] = (
        (pacData as unknown as DbPaciente[]) || []
      ).map((pac) => {
        const rep = Array.isArray(pac.representantes)
          ? pac.representantes[0]
          : pac.representantes;

        return {
          id: pac.id,
          id_representante: pac.id_representante || undefined,
          nombres: pac.nombres,
          apellidos: pac.apellidos,
          fecha_nacimiento: pac.fecha_nacimiento,
          diagnostico: pac.diagnostico || undefined,
          sexo: pac.sexo || undefined,
          estado: pac.estado,
          created_at: pac.created_at,
          representante_nombre: rep ? rep.nombres : "—",
        };
      });

      setPacientes(mappedPacientes);
      setRepresentantes(repData || []);
      console.log(repData);
    } catch (err: unknown) {
      console.error("Error al cargar datos desde Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        void fetchData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Handle new registration from Stepper
  const handleRegistrationComplete = (
    newRep: Representante,
    newPac: Paciente,
  ) => {
    setRepresentantes((prev) => [newRep, ...prev]);
    setPacientes((prev) => [newPac, ...prev]);
    setActiveView("pacientes");
  };

  const handleDeletePaciente = async (id: string) => {
    if (
      confirm("¿Estás seguro de que deseas eliminar este paciente del sistema?")
    ) {
      try {
        setLoading(true);
        const { error: deleteError } = await supabase
          .from("pacientes")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        setPacientes((prev) => prev.filter((p) => p.id !== id));
      } catch (err: unknown) {
        console.error("Error al eliminar paciente:", err);
        alert(
          err instanceof Error
            ? `Error al eliminar: ${err.message}`
            : "No se pudo eliminar el paciente.",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditPaciente = (paciente: Paciente) => {
    // For now, navigate to registration view (future: pre-fill form)
    console.log("Editar paciente:", paciente);
    setActiveView("registro");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  // Stats calculation
  const totalPacientes = pacientes.length;
  const enTratamiento = pacientes.filter((p) => p.estado === "Activo").length;
  const inactivos = pacientes.filter((p) => p.estado === "Inactivo").length;
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
        <Sidebar activeView={activeView} onViewChange={setActiveView} onLogout={handleLogout} />

        {/* Main Workspace */}
        <Box
          style={{ flexGrow: 1, padding: 32, maxWidth: "calc(100% - 260px)" }}
        >
          {loading ? (
            <Center style={{ height: "70vh" }}>
              <Stack align="center" gap="md">
                <Loader color="orange" size="xl" type="bars" />
                <Text size="sm" c="dimmed">
                  Cargando información...
                </Text>
              </Stack>
            </Center>
          ) : (
            <>
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
                    <Text c="dimmed">
                      Resumen general de la Fundación Anican
                    </Text>
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
                      representantes={representantes}
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
                      representantes={representantes}
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
                      Visualiza los aportes recibidos y entregados por la
                      Fundación Anican
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
                        El sistema está configurado en español. Gestión de
                        pacientes pediátricos oncológicos y sus representantes
                        legales.
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
            </>
          )}
        </Box>
      </Box>
    </MantineProvider>
  );
}

export default App;
