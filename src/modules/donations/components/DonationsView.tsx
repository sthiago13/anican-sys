import { useState } from "react";
import {
  Stack,
  Title,
  Text,
  Grid,
  Card,
  Table,
  Group,
  Tabs,
  Badge,
  Tooltip,
  Center,
  Loader,
} from "@mantine/core";
import {
  IconCash,
  IconHeartHandshake,
  IconBuildingStore,
  IconUserHeart,
} from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { StatCard } from "../../../components/UI/StatCard";
import { SearchInput } from "../../../components/UI/SearchInput";
import { useDonations } from "../hooks/useDonations";
import { RecibidaModal } from "./RecibidaModal";
import { EntregadaModal } from "./EntregadaModal";
import { formatDate } from "../../../utils/date";

export function DonationsView() {
  const {
    recibidas,
    entregadas,
    loading,
    handleSaveRecibida,
    handleSaveEntregada,
  } = useDonations();

  const [activeTab, setActiveTab] = useState<string | null>("recibidas");
  const [recibidaModalOpened, setRecibidaModalOpened] = useState(false);
  const [entregadaModalOpened, setEntregadaModalOpened] = useState(false);

  const [searchRecibidas, setSearchRecibidas] = useState("");
  const [searchEntregadas, setSearchEntregadas] = useState("");

  // Cálculos de KPIs
  const totalEntregadoMonetario = entregadas.reduce(
    (acc, curr) => acc + (Number(curr.monto_equivalente) || 0),
    0
  );
  const totalRecibidoMonetario = recibidas.reduce(
    (acc, curr) => acc + (Number(curr.monto_equivalente_usd) || 0),
    0
  );
  const totalRecibidasCount = recibidas.length;
  const totalEntregadasCount = entregadas.length;

  // Filtrado de búsquedas
  const filteredRecibidas = recibidas.filter(
    (r) =>
      r.entidad_donante.toLowerCase().includes(searchRecibidas.toLowerCase()) ||
      r.monto_o_cantidad.toLowerCase().includes(searchRecibidas.toLowerCase()) ||
      (r.observaciones && r.observaciones.toLowerCase().includes(searchRecibidas.toLowerCase()))
  );

  const filteredEntregadas = entregadas.filter((e) => {
    const term = searchEntregadas.toLowerCase();
    const matchesPaciente = e.pacientes?.nombres.toLowerCase().includes(term);
    const matchesExterno = e.beneficiario_externo?.toLowerCase().includes(term);
    const matchesAyuda = e.catalogo_ayudas?.nombre_articulo.toLowerCase().includes(term);
    const matchesObservaciones = e.observaciones?.toLowerCase().includes(term);

    return matchesPaciente || matchesExterno || matchesAyuda || matchesObservaciones;
  });

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
            Registro de Donaciones
          </Title>
          <Text c="dimmed">
            Visualiza y administra los aportes recibidos e insumos entregados por la Fundación Anican
          </Text>
        </div>
        <Group>
          <Button
            variant="outline"
            leftSection={<IconHeartHandshake size={16} />}
            onClick={() => setRecibidaModalOpened(true)}
          >
            Registrar Ingreso
          </Button>
          <Button
            leftSection={<IconCash size={16} />}
            onClick={() => setEntregadaModalOpened(true)}
          >
            Registrar Entrega
          </Button>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Total Financiado / Entregado"
            value={`$ ${totalEntregadoMonetario.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={<IconCash size={24} />}
            color="green"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Total Donado / Recibido"
            value={`$ ${totalRecibidoMonetario.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={<IconHeartHandshake size={24} />}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Ayudas Entregadas"
            value={`${totalEntregadasCount} egresos`}
            icon={<IconUserHeart size={24} />}
            color="orange"
          />
        </Grid.Col>
      </Grid>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Tabs value={activeTab} onChange={setActiveTab} color="orange" variant="outline">
          <Tabs.List mb="md">
            <Tabs.Tab value="recibidas" leftSection={<IconHeartHandshake size={16} />}>
              Ingresos (Donaciones Recibidas) ({totalRecibidasCount})
            </Tabs.Tab>
            <Tabs.Tab value="entregadas" leftSection={<IconCash size={16} />}>
              Egresos (Ayudas Entregadas) ({totalEntregadasCount})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="recibidas">
            <Group mb="md" justify="space-between">
              <div style={{ flexGrow: 1, maxWidth: 350 }}>
                <SearchInput
                  placeholder="Buscar ingresos por donante..."
                  onSearchChange={setSearchRecibidas}
                  style={{ width: "100%" }}
                />
              </div>
            </Group>

            {loading && recibidas.length === 0 ? (
              <Center style={{ height: "30vh" }}>
                <Loader color="orange" size="xl" type="bars" />
              </Center>
            ) : (
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Donante / Benefactor</Table.Th>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Monto o Detalle</Table.Th>
                    <Table.Th>Observaciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredRecibidas.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Text ta="center" py="xl" c="dimmed">
                          No se encontraron donaciones recibidas que coincidan con la búsqueda.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    filteredRecibidas.map((r) => (
                      <Table.Tr key={r.id}>
                        <Table.Td>
                          <Text size="sm" fw={600} c="var(--anican-azul-oscuro)">
                            {r.entidad_donante}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(r.fecha)}</Text>
                        </Table.Td>

                        <Table.Td>
                          {r.catalogo_ayudas && (
                            <Badge color="gray" variant="light" size="xs" mb={4} style={{ display: "block", width: "fit-content" }}>
                              {r.catalogo_ayudas.nombre_articulo}
                            </Badge>
                          )}
                          <Text size="sm" fw={700} c="teal">
                            {r.monto_o_cantidad}
                          </Text>
                          {r.monto_original && r.moneda && (
                            <Text size="xs" c="dimmed" mt={2}>
                              Valoración:{" "}
                              <strong>
                                {r.monto_original.toLocaleString("es-ES")}{" "}
                                {r.moneda}
                              </strong>{" "}
                              {r.moneda !== "USD" && r.monto_equivalente_usd && (
                                <>
                                  (Equiv: ${" "}
                                  {r.monto_equivalente_usd.toLocaleString("es-ES", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  USD)
                                </>
                              )}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td style={{ maxWidth: 200 }}>
                          <Text size="sm" c="dimmed" truncate="end">
                            {r.observaciones || "—"}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="entregadas">
            <Group mb="md" justify="space-between">
              <div style={{ flexGrow: 1, maxWidth: 350 }}>
                <SearchInput
                  placeholder="Buscar egresos por paciente o ayuda..."
                  onSearchChange={setSearchEntregadas}
                  style={{ width: "100%" }}
                />
              </div>
            </Group>

            {loading && entregadas.length === 0 ? (
              <Center style={{ height: "30vh" }}>
                <Loader color="orange" size="xl" type="bars" />
              </Center>
            ) : (
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Beneficiario</Table.Th>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Artículo / Ayuda</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    <Table.Th>Costo Equivalente</Table.Th>
                    <Table.Th style={{ textAlign: "center" }}>Soporte</Table.Th>
                    <Table.Th>Observaciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredEntregadas.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        <Text ta="center" py="xl" c="dimmed">
                          No se encontraron ayudas entregadas que coincidan con la búsqueda.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    filteredEntregadas.map((e) => (
                      <Table.Tr key={e.id}>
                        <Table.Td>
                          {e.pacientes ? (
                            <Group gap={4}>
                              <IconUserHeart size={14} style={{ color: "var(--anican-naranja)" }} />
                              <Text size="sm" fw={600} c="var(--anican-azul-oscuro)">
                                {e.pacientes.nombres}
                              </Text>
                            </Group>
                          ) : (
                            <Group gap={4}>
                              <IconBuildingStore size={14} style={{ color: "var(--anican-azul)" }} />
                              <Text size="sm" fw={600} c="var(--anican-azul-oscuro)">
                                {e.beneficiario_externo || "Externo"}
                              </Text>
                            </Group>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(e.fecha)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {e.catalogo_ayudas?.nombre_articulo || "Artículo no encontrado"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{e.cantidad}</Text>
                        </Table.Td>
                        <Table.Td>
                          {e.moneda === "USD" ? (
                            <Text size="sm" fw={700} c="green">
                              $ {e.monto_equivalente.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          ) : (
                            <Stack gap={0}>
                              <Text size="sm" fw={700} c="green">
                                {e.monto_original.toLocaleString("es-ES", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                {e.moneda}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Equiv: $ {e.monto_equivalente.toLocaleString("es-ES", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                USD
                              </Text>
                            </Stack>
                          )}
                        </Table.Td>
                        <Table.Td style={{ textAlign: "center" }}>
                          {e.con_soporte ? (
                            <Tooltip label="Físico archivado en sede" withArrow>
                              <Badge color="green" size="sm" variant="light">
                                Sí
                              </Badge>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Sin comprobante físico" withArrow>
                              <Badge color="red" size="sm" variant="light">
                                No
                              </Badge>
                            </Tooltip>
                          )}
                        </Table.Td>
                        <Table.Td style={{ maxWidth: 150 }}>
                          <Text size="sm" c="dimmed" truncate="end">
                            {e.observaciones || "—"}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>
        </Tabs>
      </Card>

      <RecibidaModal
        opened={recibidaModalOpened}
        onClose={() => setRecibidaModalOpened(false)}
        onSave={handleSaveRecibida}
      />

      <EntregadaModal
        opened={entregadaModalOpened}
        onClose={() => setEntregadaModalOpened(false)}
        onSave={handleSaveEntregada}
      />
    </Stack>
  );
}
