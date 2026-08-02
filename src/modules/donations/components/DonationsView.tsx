import { useState, useMemo } from "react";
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
  Pagination,
  SegmentedControl,
} from "@mantine/core";
import {
  IconCash,
  IconHeartHandshake,
  IconBuildingStore,
  IconUserHeart,
  IconCheck,
  IconCalendar,
  IconFileText,
  IconUserCheck,
  IconCirclePlus,
  IconGift,
  IconBuildingBank,
  IconEye,
} from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { ExportButton } from "../../../components/UI/ExportButton";
import { StatCard } from "../../../components/UI/StatCard";
import { SearchInput } from "../../../components/UI/SearchInput";
import { useDonations } from "../hooks/useDonations";
import { RecibidaModal } from "./RecibidaModal";
import { EntregadaModal } from "./EntregadaModal";
import { VerificarPendienteModal } from "./VerificarPendienteModal";
import { formatDate } from "../../../utils/date";
import { FilterBar } from "../../../components/UI/FilterSystem/FilterBar";
import { type FilterConfig } from "../../../components/UI/FilterSystem/types";
import {
  type RecibidasFilters,
  type EntregadasFilters,
  type PendientesFilters,
  type DonacionRecibida,
  type DonacionEntregada,
  type DonacionPendiente,
} from "../types";
import {
  exportToExcel,
  exportToCSV,
  type ColumnDefinition,
} from "../../../utils/exportUtils";
import dayjs from "dayjs";

const initialFiltersRecibidas: RecibidasFilters = {
  ayuda: "Todos",
  fechaRango: [null, null],
};

const initialFiltersEntregadas: EntregadasFilters = {
  tipoBeneficiario: "Todos",
  fechaRango: [null, null],
  ayuda: "Todos",
  conSoporte: "Todos",
};

const initialFiltersPendientes: PendientesFilters = {
  estado: "Pendiente",
  fechaRango: [null, null],
};

const filterConfigsPendientes: FilterConfig[] = [
  {
    key: "estado",
    label: "Estado",
    type: "select",
    options: [
      { label: "Todos los Estados", value: "Todos" },
      { label: "Pendientes por Verificar", value: "Pendiente" },
      { label: "Aprobadas", value: "Aprobado" },
      { label: "Rechazadas", value: "Rechazado" },
    ],
  },
  {
    key: "fechaRango",
    label: "Rango de Fecha",
    type: "date-range",
  },
];

const recibidasExportColumns: ColumnDefinition<DonacionRecibida>[] = [
  { header: "Donante / Benefactor", accessor: (r) => r.entidad_donante },
  { header: "Fecha", accessor: (r) => formatDate(r.fecha) },
  {
    header: "Artículo / Donativo",
    accessor: (r) => r.catalogo_ayudas?.nombre_articulo || "Donación General",
  },
  { header: "Detalle / Descripción", accessor: (r) => r.monto_o_cantidad },
  {
    header: "Monto Original",
    accessor: (r) =>
      r.monto_original != null && r.moneda
        ? `${r.monto_original} ${r.moneda}`
        : "—",
  },
  {
    header: "Equivalente (USD)",
    accessor: (r) =>
      r.monto_equivalente_usd != null
        ? `$ ${r.monto_equivalente_usd.toFixed(2)}`
        : "—",
  },
  { header: "Observaciones", accessor: (r) => r.observaciones || "—" },
];

const entregadasExportColumns: ColumnDefinition<DonacionEntregada>[] = [
  {
    header: "Beneficiario",
    accessor: (e) =>
      e.pacientes ? e.pacientes.nombres : e.beneficiario_externo || "Externo",
  },
  { header: "Fecha", accessor: (e) => formatDate(e.fecha) },
  {
    header: "Artículo / Ayuda",
    accessor: (e) =>
      e.catalogo_ayudas?.nombre_articulo || "Artículo no especificado",
  },
  { header: "Cantidad", accessor: (e) => e.cantidad },
  {
    header: "Monto Original",
    accessor: (e) => `${e.monto_original} ${e.moneda}`,
  },
  {
    header: "Costo Equivalente (USD)",
    accessor: (e) => `$ ${e.monto_equivalente.toFixed(2)}`,
  },
  { header: "Soporte Físico", accessor: (e) => (e.con_soporte ? "Sí" : "No") },
  { header: "Observaciones", accessor: (e) => e.observaciones || "—" },
];

export function DonationsView() {
  const [pageRecibidas, setPageRecibidas] = useState(1);
  const [pageEntregadas, setPageEntregadas] = useState(1);
  const [pagePendientes, setPagePendientes] = useState(1);
  const pageSize = 10;

  const [searchRecibidas, setSearchRecibidas] = useState("");
  const [searchEntregadas, setSearchEntregadas] = useState("");
  const [searchPendientes, setSearchPendientes] = useState("");

  const [filtersRecibidas, setFiltersRecibidas] = useState<RecibidasFilters>(
    initialFiltersRecibidas,
  );

  const [filtersEntregadas, setFiltersEntregadas] = useState<EntregadasFilters>(
    initialFiltersEntregadas,
  );

  const [filtersPendientes, setFiltersPendientes] = useState<PendientesFilters>(
    initialFiltersPendientes,
  );

  const [selectedPendiente, setSelectedPendiente] = useState<DonacionPendiente | null>(null);
  const [modalVerificarOpened, setModalVerificarOpened] = useState(false);

  const handleSearchRecibidas = (val: string) => {
    setSearchRecibidas(val);
    setPageRecibidas(1);
  };

  const handleSearchEntregadas = (val: string) => {
    setSearchEntregadas(val);
    setPageEntregadas(1);
  };

  const handleSearchPendientes = (val: string) => {
    setSearchPendientes(val);
    setPagePendientes(1);
  };

  const {
    recibidas,
    entregadas,
    pendientes,
    pendingBadgeCount,
    totalCountPendientes,
    totalPagesPendientes,
    ayudas,
    loading,
    totalCountRecibidas,
    totalPagesRecibidas,
    totalCountEntregadas,
    totalPagesEntregadas,
    stats,
    handleSaveRecibida,
    handleSaveEntregada,
    handleAprobarPendiente,
    handleRechazarPendiente,
    handleEditarPendiente,
    destinosDonacion,
    fetchExportRecibidas,
    fetchExportEntregadas,
  } = useDonations({
    pageRecibidas,
    pageEntregadas,
    pagePendientes,
    pageSize,
    searchRecibidas,
    searchEntregadas,
    searchPendientes,
    filtersRecibidas,
    filtersEntregadas,
    filtersPendientes,
  });

  const [exportingRecibidas, setExportingRecibidas] = useState(false);
  const [exportingEntregadas, setExportingEntregadas] = useState(false);

  const handleExportRecibidas = async (format: "excel" | "csv") => {
    try {
      setExportingRecibidas(true);
      const dataToExport = await fetchExportRecibidas();
      const filename = `donaciones_recibidas_${dayjs().format("YYYY-MM-DD")}`;
      if (format === "excel") {
        exportToExcel(
          dataToExport,
          recibidasExportColumns,
          filename,
          "Ingresos",
        );
      } else {
        exportToCSV(dataToExport, recibidasExportColumns, filename);
      }
    } catch (err) {
      console.error("Error al exportar donaciones recibidas:", err);
    } finally {
      setExportingRecibidas(false);
    }
  };

  const handleExportEntregadas = async (format: "excel" | "csv") => {
    try {
      setExportingEntregadas(true);
      const dataToExport = await fetchExportEntregadas();
      const filename = `ayudas_entregadas_${dayjs().format("YYYY-MM-DD")}`;
      if (format === "excel") {
        exportToExcel(
          dataToExport,
          entregadasExportColumns,
          filename,
          "Egresos",
        );
      } else {
        exportToCSV(dataToExport, entregadasExportColumns, filename);
      }
    } catch (err) {
      console.error("Error al exportar ayudas entregadas:", err);
    } finally {
      setExportingEntregadas(false);
    }
  };

  const filterConfigsRecibidas: FilterConfig[] = useMemo(() => {
    const ayudasOptions = [
      { value: "Todos", label: "Todos" },
      ...ayudas.map((a) => ({ value: a.id, label: a.nombre_articulo })),
    ];
    return [
      {
        key: "ayuda",
        label: "Artículo/Donativo",
        type: "select",
        icon: <IconCheck size={16} />,
        options: ayudasOptions,
      },
      {
        key: "fechaRango",
        label: "Rango de Fecha",
        type: "date-range",
        icon: <IconCalendar size={16} />,
        placeholder: "Seleccionar fechas",
      },
    ];
  }, [ayudas]);

  const filterConfigsEntregadas: FilterConfig[] = useMemo(() => {
    const ayudasOptions = [
      { value: "Todos", label: "Todos" },
      ...ayudas.map((a) => ({ value: a.id, label: a.nombre_articulo })),
    ];
    return [
      {
        key: "tipoBeneficiario",
        label: "Beneficiario",
        type: "select",
        icon: <IconUserCheck size={16} />,
        options: [
          { value: "Todos", label: "Todos" },
          { value: "Paciente", label: "Paciente Fundación" },
          { value: "Externo", label: "Beneficiario Externo" },
        ],
      },
      {
        key: "ayuda",
        label: "Artículo/Ayuda",
        type: "select",
        icon: <IconCheck size={16} />,
        options: ayudasOptions,
      },
      {
        key: "conSoporte",
        label: "Soporte",
        type: "select",
        icon: <IconFileText size={16} />,
        options: [
          { value: "Todos", label: "Todos" },
          { value: "Con Soporte", label: "Con Soporte" },
          { value: "Sin Soporte", label: "Sin Soporte" },
        ],
      },
      {
        key: "fechaRango",
        label: "Rango de Fecha",
        type: "date-range",
        icon: <IconCalendar size={16} />,
        placeholder: "Seleccionar fechas",
      },
    ];
  }, [ayudas]);

  const [activeTab, setActiveTab] = useState<string | null>("recibidas");
  const [recibidaModalOpened, setRecibidaModalOpened] = useState(false);
  const [entregadaModalOpened, setEntregadaModalOpened] = useState(false);

  // Selector de período para mini estadísticas (Lógica idéntica al DashboardView)
  const [periodoStats, setPeriodoStats] = useState<"dia" | "semana" | "mes" | "ano" | "historico">("mes");

  const calcDonationStats = useMemo(() => {
    const allRec = stats.allRecibidasStats || [];
    const allEnt = stats.allEntregadasStats || [];

    if (periodoStats === "historico") {
      const recSum = allRec.reduce((acc, r) => acc + (Number(r.monto_equivalente_usd) || 0), 0);
      const entSum = allEnt.reduce((acc, e) => acc + (Number(e.monto_equivalente) || 0), 0);
      return {
        recibidoMonetario: recSum,
        entregadoMonetario: entSum,
        entregadasCount: allEnt.length,
      };
    }

    const getDays = (p: typeof periodoStats) => {
      switch (p) {
        case "dia": return 1;
        case "semana": return 7;
        case "mes": return 30;
        case "ano": return 365;
        default: return 30;
      }
    };

    const dias = getDays(periodoStats);
    const hoy = new Date();
    const hacePeriodo = new Date();
    hacePeriodo.setDate(hoy.getDate() - dias);

    const filteredRec = allRec.filter((item) => {
      const dateStr = item.created_at || item.fecha;
      if (!dateStr) return false;
      const f = new Date(dateStr);
      return f >= hacePeriodo;
    });

    const filteredEnt = allEnt.filter((item) => {
      const dateStr = item.created_at || item.fecha;
      if (!dateStr) return false;
      const f = new Date(dateStr);
      return f >= hacePeriodo;
    });

    const recSum = filteredRec.reduce((acc, r) => acc + (Number(r.monto_equivalente_usd) || 0), 0);
    const entSum = filteredEnt.reduce((acc, e) => acc + (Number(e.monto_equivalente) || 0), 0);

    return {
      recibidoMonetario: recSum,
      entregadoMonetario: entSum,
      entregadasCount: filteredEnt.length,
    };
  }, [stats.allRecibidasStats, stats.allEntregadasStats, periodoStats]);

  const totalRecibidoMonetarioCalc = calcDonationStats.recibidoMonetario;
  const totalEntregadoMonetarioCalc = calcDonationStats.entregadoMonetario;
  const totalEntregadasCountCalc = calcDonationStats.entregadasCount;
  const totalRecibidasCount = stats.totalRecibidasCount;
  const totalEntregadasCount = stats.totalEntregadasCount;

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
            Visualiza y administra los aportes recibidos e insumos entregados
            por la Fundación Anican
          </Text>
        </div>
        <ExportButton
          onExport={activeTab === "recibidas" ? handleExportRecibidas : handleExportEntregadas}
          loading={exportingRecibidas || exportingEntregadas}
          label={`Exportar ${activeTab === "recibidas" ? "Ingresos" : "Egresos"}`}
        />
      </Group>

      {/* Sección de Mini Estadísticas con Selector de Período y Acciones Rápidas */}
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text fw={700} size="md" c="var(--anican-azul-oscuro)">
            Resumen Financiero e Insumos
          </Text>
          <SegmentedControl
            value={periodoStats}
            onChange={(val: any) => setPeriodoStats(val)}
            data={[
              { label: "Día", value: "dia" },
              { label: "Semana", value: "semana" },
              { label: "Mes", value: "mes" },
              { label: "Año", value: "ano" },
              { label: "Histórico", value: "historico" },
            ]}
            color="orange"
            size="sm"
            radius="md"
          />
        </Group>

        <Grid align="stretch">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Financiado / Entregado"
              value={`$ ${totalEntregadoMonetarioCalc.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              icon={<IconCash size={40} />}
              color="green"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Donado / Recibido"
              value={`$ ${totalRecibidoMonetarioCalc.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              icon={<IconHeartHandshake size={40} />}
              color="blue"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Ayudas Entregadas"
              value={`${totalEntregadasCountCalc} egresos`}
              icon={<IconUserHeart size={40} />}
              color="orange"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              withBorder
              radius="md"
              p="sm"
              shadow="xs"
              style={{
                backgroundColor: "var(--anican-bg-card)",
                borderColor: "var(--anican-border)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.5 }}>
                Acciones Rápidas
              </Text>
              <Button
                size="md"
                color="teal"
                variant="filled"
                leftSection={<IconCirclePlus size={20} />}
                onClick={() => setRecibidaModalOpened(true)}
                styles={{
                  root: {
                    height: "auto",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    boxShadow: "0 2px 6px rgba(12, 133, 153, 0.25)",
                  },
                }}
              >
                <Stack gap={0} align="flex-start">
                  <Text fw={700} size="xs" lh={1.2}>
                    Registrar Ingreso
                  </Text>
                  <Text size="10px" c="white" style={{ opacity: 0.85 }} lh={1.2}>
                    Entrada de donación o insumo
                  </Text>
                </Stack>
              </Button>
              <Button
                size="md"
                color="orange"
                variant="filled"
                leftSection={<IconGift size={20} />}
                onClick={() => setEntregadaModalOpened(true)}
                styles={{
                  root: {
                    height: "auto",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    boxShadow: "0 2px 6px rgba(232, 115, 25, 0.25)",
                  },
                }}
              >
                <Stack gap={0} align="flex-start">
                  <Text fw={700} size="xs" lh={1.2}>
                    Registrar Entrega
                  </Text>
                  <Text size="10px" c="white" style={{ opacity: 0.85 }} lh={1.2}>
                    Salida de ayuda a paciente
                  </Text>
                </Stack>
              </Button>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Tabs value={activeTab} onChange={setActiveTab} color="orange">
          <Tabs.List mb="md" style={{ borderBottom: "2px solid var(--anican-border)", gap: "12px" }}>
            <Tabs.Tab
              value="pendientes"
              leftSection={<IconBuildingBank size={18} />}
              rightSection={
                pendingBadgeCount > 0 ? (
                  <Badge color="red" size="xs" circle>
                    {pendingBadgeCount}
                  </Badge>
                ) : null
              }
              style={{
                fontWeight: activeTab === "pendientes" ? 700 : 500,
                fontSize: "14px",
                padding: "10px 20px",
                backgroundColor:
                  activeTab === "pendientes"
                    ? "rgba(232, 115, 25, 0.08)"
                    : "transparent",
                color:
                  activeTab === "pendientes"
                    ? "#e87319"
                    : "var(--anican-text-dimmed, #666666)",
                borderBottom:
                  activeTab === "pendientes"
                    ? "3px solid #e87319"
                    : "3px solid transparent",
                borderRadius: "8px 8px 0 0",
                transition: "none",
                marginBottom: "-2px",
              }}
            >
              Pendientes (Landing Web)
            </Tabs.Tab>

            <Tabs.Tab
              value="recibidas"
              leftSection={<IconHeartHandshake size={18} />}
              style={{
                fontWeight: activeTab === "recibidas" ? 700 : 500,
                fontSize: "14px",
                padding: "10px 20px",
                backgroundColor:
                  activeTab === "recibidas"
                    ? "rgba(232, 115, 25, 0.08)"
                    : "transparent",
                color:
                  activeTab === "recibidas"
                    ? "#e87319"
                    : "var(--anican-text-dimmed, #666666)",
                borderBottom:
                  activeTab === "recibidas"
                    ? "3px solid #e87319"
                    : "3px solid transparent",
                borderRadius: "8px 8px 0 0",
                transition: "none",
                marginBottom: "-2px",
              }}
            >
              Ingresos (Donaciones Recibidas) ({totalRecibidasCount})
            </Tabs.Tab>

            <Tabs.Tab
              value="entregadas"
              leftSection={<IconCash size={18} />}
              style={{
                fontWeight: activeTab === "entregadas" ? 700 : 500,
                fontSize: "14px",
                padding: "10px 20px",
                backgroundColor:
                  activeTab === "entregadas"
                    ? "rgba(232, 115, 25, 0.08)"
                    : "transparent",
                color:
                  activeTab === "entregadas"
                    ? "#e87319"
                    : "var(--anican-text-dimmed, #666666)",
                borderBottom:
                  activeTab === "entregadas"
                    ? "3px solid #e87319"
                    : "3px solid transparent",
                borderRadius: "8px 8px 0 0",
                transition: "none",
                marginBottom: "-2px",
              }}
            >
              Egresos (Ayudas Entregadas) ({totalEntregadasCount})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pendientes">
            <Group mb="md" justify="space-between" align="center">
              <div style={{ flexGrow: 1, maxWidth: 350 }}>
                <SearchInput
                  placeholder="Buscar pendientes por donante o referencia..."
                  onSearchChange={handleSearchPendientes}
                  style={{ width: "100%" }}
                />
              </div>
              <Group gap="sm">
                <FilterBar
                  configs={filterConfigsPendientes}
                  values={filtersPendientes}
                  initialValues={initialFiltersPendientes}
                  onChange={(newFilters) => {
                    setFiltersPendientes(newFilters as PendientesFilters);
                    setPagePendientes(1);
                  }}
                />
              </Group>
            </Group>

            {loading && pendientes.length === 0 ? (
              <Center style={{ height: "30vh" }}>
                <Loader color="orange" size="xl" type="bars" />
              </Center>
            ) : (
              <>
                <div className="anican-table-container">
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: "22%" }}>Donante / Benefactor</Table.Th>
                        <Table.Th style={{ width: "12%" }}>Fecha</Table.Th>
                        <Table.Th style={{ width: "22%" }}>Monto / Descripción</Table.Th>
                        <Table.Th style={{ width: "18%" }}>Método / Ref</Table.Th>
                        <Table.Th style={{ width: "12%" }}>Estado</Table.Th>
                        <Table.Th style={{ width: "14%" }} ta="center">Acción</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pendientes.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={6}>
                            <Text ta="center" py="xl" c="dimmed">
                              No hay donaciones pendientes registradas.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        pendientes.map((p) => (
                          <Table.Tr key={p.id}>
                            <Table.Td>
                              <Text size="sm" fw={600} c="var(--anican-azul-oscuro)">
                                {p.entidad_donante}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{formatDate(p.fecha)}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" fw={600}>{p.monto_o_cantidad}</Text>
                              {p.destino_donacion && (
                                <Text size="xs" c="dimmed" mt={2}>
                                  Destino: {p.destino_donacion}
                                </Text>
                              )}
                              {p.monto_equivalente_usd != null && (
                                <Text size="xs" c="teal" fw={700}>
                                  ${p.monto_equivalente_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="outline" color="blue" size="xs">
                                {p.metodo_ingreso || "Web Landing"}
                              </Badge>
                              {p.referencia && (
                                <Text size="xs" c="dimmed" mt={2}>
                                  Ref: {p.referencia}
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={
                                  p.estado === "Aprobado"
                                    ? "teal"
                                    : p.estado === "Rechazado"
                                    ? "red"
                                    : "orange"
                                }
                                variant="light"
                                size="sm"
                              >
                                {p.estado}
                              </Badge>
                            </Table.Td>
                            <Table.Td ta="center">
                              <Button
                                size="xs"
                                variant={p.estado === "Pendiente" ? "filled" : "outline"}
                                color={p.estado === "Pendiente" ? "orange" : "gray"}
                                leftSection={<IconEye size={14} />}
                                onClick={() => {
                                  setSelectedPendiente(p);
                                  setModalVerificarOpened(true);
                                }}
                              >
                                {p.estado === "Pendiente" ? "Verificar" : "Detalle"}
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </div>

                {totalPagesPendientes > 1 && (
                  <Group justify="space-between" mt="md" align="center">
                    <Text size="xs" c="dimmed">
                      Mostrando {pendientes.length} de {totalCountPendientes} registros
                    </Text>
                    <Pagination
                      total={totalPagesPendientes}
                      value={pagePendientes}
                      onChange={setPagePendientes}
                      color="orange"
                      size="sm"
                      withEdges
                    />
                  </Group>
                )}
              </>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="recibidas">
            <Group mb="md" justify="space-between" align="center">
              <div style={{ flexGrow: 1, maxWidth: 350 }}>
                <SearchInput
                  placeholder="Buscar ingresos por donante..."
                  onSearchChange={handleSearchRecibidas}
                  style={{ width: "100%" }}
                />
              </div>
              <Group gap="sm">
                <FilterBar
                  configs={filterConfigsRecibidas}
                  values={filtersRecibidas}
                  initialValues={initialFiltersRecibidas}
                  onChange={(newFilters) => {
                    setFiltersRecibidas(newFilters as RecibidasFilters);
                    setPageRecibidas(1);
                  }}
                />
              </Group>
            </Group>

            {loading && recibidas.length === 0 ? (
              <Center style={{ height: "30vh" }}>
                <Loader color="orange" size="xl" type="bars" />
              </Center>
            ) : (
              <>
                <div className="anican-table-container">
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: "22%" }}>
                          Donante / Benefactor
                        </Table.Th>
                        <Table.Th style={{ width: "10%" }}>Fecha</Table.Th>
                        <Table.Th style={{ width: "18%" }}>
                          Detalle / Descripción
                        </Table.Th>
                        <Table.Th style={{ width: "15%" }}>Monto</Table.Th>
                        <Table.Th style={{ width: "32%" }}>
                          Observaciones
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {recibidas.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={5}>
                            <Text ta="center" py="xl" c="dimmed">
                              No se encontraron donaciones recibidas que
                              coincidan con la búsqueda.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        recibidas.map((r) => (
                          <Table.Tr key={r.id}>
                            <Table.Td>
                              <Text
                                size="sm"
                                fw={600}
                                c="var(--anican-azul-oscuro)"
                              >
                                {r.entidad_donante}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{formatDate(r.fecha)}</Text>
                            </Table.Td>

                            <Table.Td>
                              {r.catalogo_ayudas && (
                                <Badge
                                  color="gray"
                                  variant="light"
                                  size="xs"
                                  mb={4}
                                  style={{
                                    display: "block",
                                    width: "fit-content",
                                  }}
                                >
                                  {r.catalogo_ayudas.nombre_articulo}
                                </Badge>
                              )}
                              <Text
                                size="sm"
                                style={{
                                  whiteSpace: "normal",
                                  wordBreak: "break-word",
                                }}
                              >
                                {r.monto_o_cantidad}
                              </Text>
                            </Table.Td>

                            <Table.Td>
                              {r.monto_original != null && r.moneda ? (
                                <Text size="sm" fw={700} c="teal">
                                  {r.monto_original.toLocaleString("es-ES", {
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  {r.moneda}
                                </Text>
                              ) : (
                                <Text size="sm" c="dimmed">
                                  —
                                </Text>
                              )}
                              {r.monto_equivalente_usd != null && (
                                <Text size="xs" c="dimmed">
                                  Equiv: ${" "}
                                  {r.monto_equivalente_usd.toLocaleString(
                                    "es-ES",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}{" "}
                                  USD
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td style={{ minWidth: 150 }}>
                              <Text
                                size="sm"
                                c="dimmed"
                                style={{
                                  whiteSpace: "normal",
                                  wordBreak: "break-word",
                                }}
                              >
                                {r.observaciones || "—"}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </div>

                {totalPagesRecibidas > 1 && (
                  <Group justify="space-between" mt="md" align="center">
                    <Text size="xs" c="dimmed">
                      Mostrando {recibidas.length} de {totalCountRecibidas}{" "}
                      ingresos
                    </Text>
                    <Pagination
                      total={totalPagesRecibidas}
                      value={pageRecibidas}
                      onChange={setPageRecibidas}
                      color="orange"
                      size="sm"
                      withEdges
                    />
                  </Group>
                )}
              </>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="entregadas">
            <Group mb="md" justify="space-between" align="center">
              <div style={{ flexGrow: 1, maxWidth: 350 }}>
                <SearchInput
                  placeholder="Buscar egresos por paciente o ayuda..."
                  onSearchChange={handleSearchEntregadas}
                  style={{ width: "100%" }}
                />
              </div>
              <Group gap="sm">
                <FilterBar
                  configs={filterConfigsEntregadas}
                  values={filtersEntregadas}
                  initialValues={initialFiltersEntregadas}
                  onChange={(newFilters) => {
                    setFiltersEntregadas(newFilters as EntregadasFilters);
                    setPageEntregadas(1);
                  }}
                />
              </Group>
            </Group>

            {loading && entregadas.length === 0 ? (
              <Center style={{ height: "30vh" }}>
                <Loader color="orange" size="xl" type="bars" />
              </Center>
            ) : (
              <>
                <div className="anican-table-container">
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: "22%" }}>
                          Beneficiario
                        </Table.Th>
                        <Table.Th style={{ width: "12%" }}>Fecha</Table.Th>
                        <Table.Th style={{ width: "22%" }}>
                          Artículo / Ayuda
                        </Table.Th>
                        <Table.Th style={{ width: "10%" }}>Cantidad</Table.Th>
                        <Table.Th style={{ width: "18%" }}>
                          Costo Equivalente
                        </Table.Th>
                        <Table.Th style={{ width: "8%", textAlign: "center" }}>
                          Soporte
                        </Table.Th>
                        <Table.Th style={{ width: "16%" }}>
                          Observaciones
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {entregadas.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={7}>
                            <Text ta="center" py="xl" c="dimmed">
                              No se encontraron ayudas entregadas que coincidan
                              con la búsqueda.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        entregadas.map((e) => (
                          <Table.Tr key={e.id}>
                            <Table.Td>
                              {e.pacientes ? (
                                <Group gap={4}>
                                  <IconUserHeart
                                    size={14}
                                    style={{ color: "var(--anican-naranja)" }}
                                  />
                                  <Text
                                    size="sm"
                                    fw={600}
                                    c="var(--anican-azul-oscuro)"
                                  >
                                    {e.pacientes.nombres}
                                  </Text>
                                </Group>
                              ) : (
                                <Group gap={4}>
                                  <IconBuildingStore
                                    size={14}
                                    style={{ color: "var(--anican-azul)" }}
                                  />
                                  <Text
                                    size="sm"
                                    fw={600}
                                    c="var(--anican-azul-oscuro)"
                                  >
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
                                {e.catalogo_ayudas?.nombre_articulo ||
                                  "Artículo no encontrado"}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{e.cantidad}</Text>
                            </Table.Td>
                            <Table.Td>
                              {e.moneda === "USD" ? (
                                <Text size="sm" fw={700} c="teal">
                                  ${" "}
                                  {e.monto_equivalente.toLocaleString("es-ES", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Text>
                              ) : (
                                <Stack gap={0}>
                                  <Text size="sm" fw={700} c="teal">
                                    {e.monto_original.toLocaleString("es-ES", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    {e.moneda}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    Equiv: ${" "}
                                    {e.monto_equivalente.toLocaleString(
                                      "es-ES",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}{" "}
                                    USD
                                  </Text>
                                </Stack>
                              )}
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              {e.con_soporte ? (
                                <Tooltip
                                  label="Físico archivado en sede"
                                  withArrow
                                >
                                  <Badge
                                    color="green"
                                    size="sm"
                                    variant="light"
                                  >
                                    Sí
                                  </Badge>
                                </Tooltip>
                              ) : (
                                <Tooltip
                                  label="Sin comprobante físico"
                                  withArrow
                                >
                                  <Badge color="red" size="sm" variant="light">
                                    No
                                  </Badge>
                                </Tooltip>
                              )}
                            </Table.Td>
                            <Table.Td style={{ minWidth: 150 }}>
                              <Text
                                size="sm"
                                c="dimmed"
                                style={{
                                  whiteSpace: "normal",
                                  wordBreak: "break-word",
                                }}
                              >
                                {e.observaciones || "—"}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </div>

                {totalPagesEntregadas > 1 && (
                  <Group justify="space-between" mt="md" align="center">
                    <Text size="xs" c="dimmed">
                      Mostrando {entregadas.length} de {totalCountEntregadas}{" "}
                      egresos
                    </Text>
                    <Pagination
                      total={totalPagesEntregadas}
                      value={pageEntregadas}
                      onChange={setPageEntregadas}
                      color="orange"
                      size="sm"
                      withEdges
                    />
                  </Group>
                )}
              </>
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

      <VerificarPendienteModal
        key={selectedPendiente?.id ?? "sin-seleccion"}
        opened={modalVerificarOpened}
        onClose={() => {
          setModalVerificarOpened(false);
          setSelectedPendiente(null);
        }}
        donacion={selectedPendiente}
        onAprobar={handleAprobarPendiente}
        onRechazar={handleRechazarPendiente}
        onEditar={handleEditarPendiente}
        destinos={destinosDonacion}
      />
    </Stack>
  );
}
