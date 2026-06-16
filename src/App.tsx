import React, { useState } from 'react';
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
} from '@mantine/core';
import {
  IconUsers,
  IconHeartHandshake,
  IconActivity,
  IconCash,
  IconPlus,
} from '@tabler/icons-react';
import { Sidebar } from './components/Feature/Sidebar';
import { PatientTable, type Patient } from './components/Feature/PatientTable';
import { StatCard } from './components/UI/StatCard';
import { SearchInput } from './components/UI/SearchInput';
import { FilterDropdown } from './components/UI/FilterDropdown';
import { Button } from './components/UI/Button';
import { Input } from './components/UI/Input';
import { Login } from './components/Feature/Login';

const theme = createTheme({
  primaryColor: 'orange',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
});

const INITIAL_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Bobby',
    species: 'Perro',
    breed: 'Golden Retriever',
    status: 'Activo',
    admissionDate: '2026-01-15',
    lastDonationDate: '150',
  },
  {
    id: '2',
    name: 'Luna',
    species: 'Gato',
    breed: 'Siamés',
    status: 'En Tratamiento',
    admissionDate: '2026-03-10',
    lastDonationDate: '80',
  },
  {
    id: '3',
    name: 'Kira',
    species: 'Perro',
    breed: 'Pastor Alemán',
    status: 'Adoptado',
    admissionDate: '2025-11-20',
    lastDonationDate: '200',
  },
  {
    id: '4',
    name: 'Toby',
    species: 'Perro',
    breed: 'Mestizo',
    status: 'Activo',
    admissionDate: '2026-04-02',
  },
  {
    id: '5',
    name: 'Mimi',
    species: 'Gato',
    breed: 'Persa',
    status: 'En Tratamiento',
    admissionDate: '2026-05-18',
    lastDonationDate: '50',
  },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Form states for adding/editing patients
  const [formName, setFormName] = useState('');
  const [formSpecies, setFormSpecies] = useState('');
  const [formBreed, setFormBreed] = useState('');
  const [formStatus, setFormStatus] = useState<'Activo' | 'En Tratamiento' | 'Adoptado'>('Activo');
  const [formDonation, setFormDonation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddOrUpdatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSpecies.trim() || !formBreed.trim()) return;

    if (editingId) {
      setPatients(
        patients.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: formName,
                species: formSpecies,
                breed: formBreed,
                status: formStatus,
                lastDonationDate: formDonation || undefined,
              }
            : p
        )
      );
      setEditingId(null);
    } else {
      const newPatient: Patient = {
        id: Date.now().toString(),
        name: formName,
        species: formSpecies,
        breed: formBreed,
        status: formStatus,
        admissionDate: new Date().toISOString().split('T')[0],
        lastDonationDate: formDonation || undefined,
      };
      setPatients([newPatient, ...patients]);
    }

    // Reset form
    setFormName('');
    setFormSpecies('');
    setFormBreed('');
    setFormStatus('Activo');
    setFormDonation('');
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingId(patient.id);
    setFormName(patient.name);
    setFormSpecies(patient.species);
    setFormBreed(patient.breed);
    setFormStatus(patient.status);
    setFormDonation(patient.lastDonationDate || '');
    setActiveView('pacientes'); // switch view to ensure they see the form
  };

  const handleDeletePatient = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
      setPatients(patients.filter((p) => p.id !== id));
    }
  };

  // Stats calculation
  const totalPatients = patients.length;
  const inTreatment = patients.filter((p) => p.status === 'En Tratamiento').length;
  const activePatients = patients.filter((p) => p.status === 'Activo').length;
  const totalDonations = patients.reduce(
    (acc, p) => acc + (p.lastDonationDate ? parseFloat(p.lastDonationDate) : 0),
    0
  );

  const filterOptions = [
    { value: 'Todos', label: 'Todos' },
    { value: 'Activo', label: 'Activo' },
    { value: 'En Tratamiento', label: 'En Tratamiento' },
    { value: 'Adoptado', label: 'Adoptado' },
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
      <Box style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        {/* Sidebar Nav */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Main Workspace */}
        <Box style={{ flexGrow: 1, padding: 32, maxWidth: 'calc(100% - 260px)' }}>
          {activeView === 'dashboard' && (
            <Stack gap="xl">
              <div>
                <Title order={1} style={{ letterSpacing: -1 }}>
                  Panel de Control
                </Title>
                <Text c="dimmed">Resumen general y KPIs de la fundación Anican</Text>
              </div>

              {/* KPIs Grid */}
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Mascotas Totales"
                    value={totalPatients}
                    icon={<IconUsers size={24} />}
                    trend={{ value: 12, type: 'up' }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="En Tratamiento"
                    value={inTreatment}
                    icon={<IconActivity size={24} />}
                    color="orange"
                    trend={{ value: 5, type: 'down', label: 'desde la semana pasada' }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Mascotas Activas"
                    value={activePatients}
                    icon={<IconUsers size={24} />}
                    color="teal"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Fondos Recaudados"
                    value={`$${totalDonations}`}
                    icon={<IconCash size={24} />}
                    color="green"
                    trend={{ value: 24, type: 'up' }}
                  />
                </Grid.Col>
              </Grid>

              <Divider />

              {/* Quick Table Preview */}
              <Card withBorder radius="md" p="lg" shadow="xs">
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={3}>Mascotas Recientes</Title>
                    <Text size="sm" c="dimmed">
                      Últimos pacientes registrados en la base de datos
                    </Text>
                  </div>
                  <Button onClick={() => setActiveView('pacientes')}>
                    Ver Todos los Pacientes
                  </Button>
                </Group>
                <PatientTable
                  patients={patients.slice(0, 3)}
                  searchQuery=""
                  filterStatus="Todos"
                  onEditPatient={handleEditPatient}
                  onDeletePatient={handleDeletePatient}
                />
              </Card>
            </Stack>
          )}

          {activeView === 'pacientes' && (
            <Stack gap="xl">
              <Group justify="space-between" align="center">
                <div>
                  <Title order={1} style={{ letterSpacing: -1 }}>
                    Gestión de Pacientes
                  </Title>
                  <Text c="dimmed">
                    Registra, edita y filtra la lista de mascotas albergadas
                  </Text>
                </div>
              </Group>

              <Grid>
                {/* Search & Table list (Left side, takes 8 cols) */}
                <Grid.Col span={{ base: 12, lg: 8 }}>
                  <Card withBorder radius="md" p="lg" shadow="xs">
                    <Group justify="space-between" mb="lg">
                      <Group style={{ flexGrow: 1, maxWidth: 400 }}>
                        <SearchInput
                          placeholder="Buscar por nombre, especie..."
                          onSearchChange={setSearchQuery}
                          style={{ width: '100%' }}
                        />
                      </Group>
                      <FilterDropdown
                        label="Estado"
                        options={filterOptions}
                        selectedValue={filterStatus}
                        onSelect={setFilterStatus}
                      />
                    </Group>

                    <PatientTable
                      patients={patients}
                      searchQuery={searchQuery}
                      filterStatus={filterStatus}
                      onEditPatient={handleEditPatient}
                      onDeletePatient={handleDeletePatient}
                    />
                  </Card>
                </Grid.Col>

                {/* Registry Form (Right side, takes 4 cols) */}
                <Grid.Col span={{ base: 12, lg: 4 }}>
                  <Card withBorder radius="md" p="lg" shadow="xs">
                    <Title order={3} mb="xs">
                      {editingId ? 'Editar Paciente' : 'Nuevo Registro'}
                    </Title>
                    <Text size="sm" c="dimmed" mb="lg">
                      {editingId
                        ? 'Modifica los datos del paciente seleccionado'
                        : 'Ingresa una nueva mascota al sistema'}
                    </Text>

                    <form onSubmit={handleAddOrUpdatePatient}>
                      <Stack gap="md">
                        <Input
                          label="Nombre de la Mascota"
                          placeholder="Ej. Bobby, Luna"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                        />

                        <Input
                          label="Especie"
                          placeholder="Ej. Perro, Gato"
                          value={formSpecies}
                          onChange={(e) => setFormSpecies(e.target.value)}
                          required
                        />

                        <Input
                          label="Raza"
                          placeholder="Ej. Mestizo, Criollo"
                          value={formBreed}
                          onChange={(e) => setFormBreed(e.target.value)}
                          required
                        />

                        <Input
                          label="Última Donación ($) (Opcional)"
                          placeholder="Ej. 100"
                          type="number"
                          value={formDonation}
                          onChange={(e) => setFormDonation(e.target.value)}
                        />

                        {/* Status selector (custom select wrapping input styling) */}
                        <Box>
                          <Text fw={600} size="sm" mb={4}>
                            Estado
                          </Text>
                          <select
                            value={formStatus}
                            onChange={(e) =>
                              setFormStatus(
                                e.target.value as 'Activo' | 'En Tratamiento' | 'Adoptado'
                              )
                            }
                            style={{
                              width: '100%',
                              height: '36px',
                              padding: '0 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--mantine-color-gray-4)',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              backgroundColor: 'white',
                            }}
                          >
                            <option value="Activo">Activo</option>
                            <option value="En Tratamiento">En Tratamiento</option>
                            <option value="Adoptado">Adoptado</option>
                          </select>
                        </Box>

                        <Group justify="flex-end" mt="md">
                          {editingId && (
                            <Button
                              variant="outline"
                              color="gray"
                              onClick={() => {
                                setEditingId(null);
                                setFormName('');
                                setFormSpecies('');
                                setFormBreed('');
                                setFormStatus('Activo');
                                setFormDonation('');
                              }}
                            >
                              Cancelar
                            </Button>
                          )}
                          <Button type="submit" leftSection={<IconPlus size={16} />}>
                            {editingId ? 'Guardar Cambios' : 'Registrar'}
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  </Card>
                </Grid.Col>
              </Grid>
            </Stack>
          )}

          {activeView === 'donaciones' && (
            <Stack gap="xl">
              <div>
                <Title order={1} style={{ letterSpacing: -1 }}>
                  Registro de Donaciones
                </Title>
                <Text c="dimmed">
                  Visualiza los aportes económicos y patrocinadores de Anican
                </Text>
              </div>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <StatCard
                    title="Total Recaudado"
                    value={`$${totalDonations}`}
                    icon={<IconCash size={24} />}
                    color="green"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <StatCard
                    title="Patrocinadores Activos"
                    value={patients.filter((p) => p.lastDonationDate).length}
                    icon={<IconHeartHandshake size={24} />}
                    color="red"
                  />
                </Grid.Col>
              </Grid>

              <Card withBorder radius="md" p="lg" shadow="xs">
                <Title order={3} mb="md">
                  Historial de Aportes
                </Title>
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Donante (Mascota Vinculada)</Table.Th>
                      <Table.Th>Monto</Table.Th>
                      <Table.Th>Fecha Registro</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {patients
                      .filter((p) => p.lastDonationDate)
                      .map((p) => (
                        <Table.Tr key={p.id}>
                          <Table.Td fw={600}>{p.name}</Table.Td>
                          <Table.Td c="green" fw={700}>
                            ${p.lastDonationDate}
                          </Table.Td>
                          <Table.Td>{p.admissionDate}</Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Stack>
          )}

          {activeView === 'configuracion' && (
            <Stack gap="xl">
              <div>
                <Title order={1} style={{ letterSpacing: -1 }}>
                  Configuración del Sistema
                </Title>
                <Text c="dimmed">Ajustes generales del panel administrativo de Anican</Text>
              </div>

              <Card withBorder radius="md" p="lg" shadow="xs">
                <Stack gap="md">
                  <Title order={4}>Preferencias Generales</Title>
                  <Text size="sm" c="dimmed">
                    El sistema está configurado en español con soporte multiespecie (perros y gatos).
                  </Text>
                  <Divider />
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>Tema del Sistema</Text>
                      <Text size="xs" c="dimmed">
                        Cambiar la apariencia de la interfaz
                      </Text>
                    </div>
                    <Button variant="outline" color="orange" disabled>
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
