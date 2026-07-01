import { Stack, Title, Text, Grid, Card, Table } from "@mantine/core";
import { IconCash, IconHeartHandshake } from "@tabler/icons-react";
import { StatCard } from "../../../components/UI/StatCard";

export function DonationsView() {
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
          Registro de Donaciones
        </Title>
        <Text c="dimmed">
          Visualiza los aportes recibidos y entregados por la Fundación Anican
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
                  Las donaciones se conectarán con las tablas de Supabase
                  próximamente.
                </Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
