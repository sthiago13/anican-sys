import { Stack, Title, Text, Grid, Divider, Card, Group, Center, Loader } from "@mantine/core";
import { IconUsers, IconActivity, IconHeartHandshake, IconCash } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../../../components/UI/StatCard";
import { PacienteTable } from "../../patients/components/PatientTable";
import { Button } from "../../../components/UI/Button";
import { usePatients } from "../../patients/hooks/usePatients";

export function DashboardView() {
  const navigate = useNavigate();
  const { pacientes, representantes, loading, handleDeletePaciente } = usePatients();

  const totalPacientes = pacientes.length;
  const enTratamiento = pacientes.filter((p) => p.estado === "Activo").length;
  const inactivos = pacientes.filter((p) => p.estado === "Inactivo").length;
  const totalRepresentantes = representantes.length;

  const handleEditPaciente = () => {
    navigate("/registro");
  };

  if (loading) {
    return (
      <Center style={{ height: "70vh" }}>
        <Stack align="center" gap="md">
          <Loader color="orange" size="xl" type="bars" />
          <Text size="sm" c="dimmed">
            Cargando información...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
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
          <Button onClick={() => navigate("/pacientes")}>
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
  );
}
