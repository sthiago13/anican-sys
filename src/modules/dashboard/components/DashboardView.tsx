import { useState } from "react";
import { Stack, Title, Text, Grid, Divider, Card, Group, Center, Loader, SegmentedControl } from "@mantine/core";
import { IconActivity, IconHeartHandshake, IconCash, IconPresentationAnalytics, IconUserPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../../../components/UI/StatCard";
import { PacienteTable } from "../../patients/components/PatientTable";
import { Button } from "../../../components/UI/Button";
import { usePatients } from "../../patients/hooks/usePatients";
import { useDonations } from "../../donations/hooks/useDonations";

export function DashboardView() {
  const navigate = useNavigate();
  const { pacientes, diagnosticos, loading: loadingPatients, handleUpdateStatus, handleUpdatePaciente } = usePatients({
    page: 1,
    pageSize: 5000,
    searchQuery: "",
    filters: {
      estado: "Todos",
      sexo: "Todos",
      diagnostico: "Todos",
      nacimiento: {
        year: "Todos",
        month: "Todos",
        day: "Todos",
      },
    },
  });
  const { recibidas, entregadas, loading: loadingDonations } = useDonations({
    pageRecibidas: 1,
    pageEntregadas: 1,
    pageSize: 5000,
    searchRecibidas: "",
    searchEntregadas: "",
    filtersRecibidas: {
      ayuda: "Todos",
      fechaRango: [null, null],
    },
    filtersEntregadas: {
      tipoBeneficiario: "Todos",
      fechaRango: [null, null],
      ayuda: "Todos",
      conSoporte: "Todos",
    },
  });

  const [periodo, setPeriodo] = useState<"diario" | "semanal" | "mensual" | "anual">("mensual");

  const getPeriodDays = (p: "diario" | "semanal" | "mensual" | "anual") => {
    switch (p) {
      case "diario": return 1;
      case "semanal": return 7;
      case "mensual": return 30;
      case "anual": return 365;
    }
  };

  const getPeriodLabel = (p: "diario" | "semanal" | "mensual" | "anual") => {
    switch (p) {
      case "diario": return "vs. día anterior";
      case "semanal": return "vs. semana anterior";
      case "mensual": return "vs. mes anterior";
      case "anual": return "vs. año anterior";
    }
  };

  const dias = getPeriodDays(periodo);
  const labelPeriodo = getPeriodLabel(periodo);

  const totalPacientesActivos = pacientes.filter((p) => p.estado === "Activo").length;

  interface HasCreatedAt {
    created_at?: string;
  }

  const calcPeriodStats = <T extends HasCreatedAt>(
    lista: T[],
    diasPeriodo: number,
    label: string,
    getValue: (item: T) => number = () => 1
  ) => {
    const hoy = new Date();
    const hacePeriodo = new Date();
    hacePeriodo.setDate(hoy.getDate() - diasPeriodo);
    
    const haceDoblePeriodo = new Date();
    haceDoblePeriodo.setDate(hoy.getDate() - (diasPeriodo * 2));

    const totalActual = lista
      .filter((item) => {
        if (!item.created_at) return false;
        const fecha = new Date(item.created_at);
        return fecha >= hacePeriodo;
      })
      .reduce((sum, item) => sum + getValue(item), 0);

    const totalAnterior = lista
      .filter((item) => {
        if (!item.created_at) return false;
        const fecha = new Date(item.created_at);
        return fecha >= haceDoblePeriodo && fecha < hacePeriodo;
      })
      .reduce((sum, item) => sum + getValue(item), 0);

    if (totalActual === 0 && totalAnterior === 0) {
      return { total: 0, trend: undefined };
    }

    if (totalAnterior === 0) {
      return {
        total: totalActual,
        trend: {
          value: 100,
          type: "up" as const,
          label: `${label} (inicial)`,
        }
      };
    }

    const diferencia = totalActual - totalAnterior;
    const porcentaje = Math.round((Math.abs(diferencia) / totalAnterior) * 100);

    return {
      total: totalActual,
      trend: {
        value: porcentaje,
        type: diferencia >= 0 ? ("up" as const) : ("down" as const),
        label: label,
      }
    };
  };

  const statsRecibidas = calcPeriodStats(
    recibidas,
    dias,
    labelPeriodo,
    (item) => Number(item.monto_equivalente_usd) || 0
  );

  const statsEntregadas = calcPeriodStats(
    entregadas,
    dias,
    labelPeriodo,
    (item) => Number(item.monto_equivalente) || 0
  );

  const statsActivos = calcPeriodStats(
    pacientes.filter((p) => p.estado === "Activo"),
    dias,
    labelPeriodo
  );

  if (loadingPatients || loadingDonations) {
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
      <Group justify="space-between" align="center">
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
          <Text c="dimmed">Resumen general del sistema</Text>
        </div>
        <SegmentedControl
          value={periodo}
          onChange={(value) => setPeriodo(value as any)}
          data={[
            { label: "Diario", value: "diario" },
            { label: "Semanal", value: "semanal" },
            { label: "Mensual", value: "mensual" },
            { label: "Anual", value: "anual" },
          ]}
          color="orange"
          radius="md"
        />
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Niños Activos"
            value={totalPacientesActivos}
            icon={<IconActivity size={48} />}
            color="teal"
            trend={statsActivos.trend}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Donaciones Recibidas"
            value={`$ ${statsRecibidas.total.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={<IconHeartHandshake size={48} />}
            color="blue"
            trend={statsRecibidas.trend}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Donaciones Entregadas"
            value={`$ ${statsEntregadas.total.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={<IconCash size={48} />}
            color="green"
            trend={statsEntregadas.trend}
          />
        </Grid.Col>
      </Grid>

      <Divider />

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card
            withBorder
            radius="md"
            p="md"
            shadow="xs"
            className="anican-card-hover"
            style={{
              backgroundColor: "var(--anican-bg-card)",
              borderColor: "var(--anican-border)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Group gap="md" align="flex-start" wrap="nowrap" mb="md">
              <Center style={{ color: "var(--anican-naranja)", flexShrink: 0 }}>
                <IconUserPlus size={32} stroke={1.5} />
              </Center>
              <div>
                <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
                  Nuevo Registro
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                  Registra un nuevo paciente pediátrico y su representante legal en el sistema.
                </Text>
              </div>
            </Group>
            <Button
              color="orange"
              fullWidth
              radius="md"
              onClick={() => navigate("/registro")}
            >
              Ir a Registro
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card
            withBorder
            radius="md"
            p="md"
            shadow="xs"
            className="anican-card-hover"
            style={{
              backgroundColor: "var(--anican-bg-card)",
              borderColor: "var(--anican-border)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Group gap="md" align="flex-start" wrap="nowrap" mb="md">
              <Center style={{ color: "var(--anican-naranja)", flexShrink: 0 }}>
                <IconHeartHandshake size={32} stroke={1.5} />
              </Center>
              <div>
                <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
                  Donaciones
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                  Administra las donaciones recibidas y entregadas para los niños atendidos.
                </Text>
              </div>
            </Group>
            <Button
              color="orange"
              fullWidth
              radius="md"
              onClick={() => navigate("/donaciones")}
            >
              Ir a Donaciones
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card
            withBorder
            radius="md"
            p="md"
            shadow="xs"
            className="anican-card-hover"
            style={{
              backgroundColor: "var(--anican-bg-card)",
              borderColor: "var(--anican-border)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Group gap="md" align="flex-start" wrap="nowrap" mb="md">
              <Center style={{ color: "var(--anican-naranja)", flexShrink: 0 }}>
                <IconPresentationAnalytics size={32} stroke={1.5} />
              </Center>
              <div>
                <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
                  Reportes de Gestión
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                  Visualiza estadísticas avanzadas, finanzas e históricos para patrocinadores.
                </Text>
              </div>
            </Group>
            <Button
              color="orange"
              fullWidth
              radius="md"
              onClick={() => navigate("/reportes")}
            >
              Ver Reportes
            </Button>
          </Card>
        </Grid.Col>
      </Grid>


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
          pacientes={pacientes.slice(0, 5)}
          diagnosticos={diagnosticos}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePaciente={handleUpdatePaciente}
        />
      </Card>
    </Stack>
  );
}
