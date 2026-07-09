import React from "react";
import {
  Stack,
  Title,
  Text,
  Grid,
  Divider,
  Group,
  Button,
  Center,
  Loader,
  Box,
  Card,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconPrinter,
  IconFileSpreadsheet,
  IconCalendar,
  IconArrowLeft,
  IconTrendingUp,
  IconTrendingDown,
  IconHeartHandshake,
  IconCash,
  IconClipboardList,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../../../components/UI/StatCard";
import { useReportsData } from "../hooks/useReportsData";
import { FinancialsChart } from "./FinancialsChart";
import { DistributionChart } from "./DistributionChart";
import { DemographicsChart } from "./DemographicsChart";
import { utils, writeFile } from "xlsx";
import dayjs from "dayjs";

export const ReportsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading,
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    summary,
    financialsChartData,
    categoriesChartData,
    topAidsChartData,
    diagnosticsDemographics,
    sexDemographics,
    ageDemographics,
    pacientesTotales,
  } = useReportsData();

  // Estados locales temporales para retrasar la actualización de filtros
  const [tempFechaInicio, setTempFechaInicio] = React.useState<Date | null>(fechaInicio);
  const [tempFechaFin, setTempFechaFin] = React.useState<Date | null>(fechaFin);

  // Sincronizar estados locales cuando cambien los globales
  React.useEffect(() => {
    setTempFechaInicio(fechaInicio);
    setTempFechaFin(fechaFin);
  }, [fechaInicio, fechaFin]);

  // Función para exportar a Excel consolidando múltiples reportes en pestañas
  const handleExportExcel = () => {
    if (financialsChartData.length === 0 && categoriesChartData.length === 0) return;

    const wb = utils.book_new();

    // Hoja 1: Resumen Ejecutivo
    const resumenData = [
      ["FUNDACIÓN ANICAN", ""],
      ["Reporte de Gestión - Resumen Ejecutivo", ""],
      ["Periodo:", getFormattedPeriod()],
      ["Fecha de Generación:", dayjs().format("DD/MM/YYYY hh:mm A")],
      ["", ""],
      ["Métrica", "Valor"],
      ["Donaciones Recibidas (Ingresos)", `$ ${summary.totalIngresosUsd.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`],
      ["Ayudas Entregadas (Inversión)", `$ ${summary.totalEgresosUsd.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`],
      ["Balance Neto", `$ ${summary.balanceNetoUsd.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`],
      ["Niños Beneficiados (Periodo)", summary.pacientesUnicosBeneficiados],
      ["Volumen de Ayudas Otorgadas", `${summary.ayudasTotalesEntregadas} unidades`]
    ];
    const wsResumen = utils.aoa_to_sheet(resumenData);
    utils.book_append_sheet(wb, wsResumen, "Resumen");

    // Hoja 2: Finanzas Históricas
    if (financialsChartData.length > 0) {
      const finData = [
        ["Periodo", "Ingresos (USD)", "Egresos (USD)", "Balance (USD)"],
        ...financialsChartData.map((item) => [
          item.periodo,
          item.ingresos,
          item.egresos,
          Number((item.ingresos - item.egresos).toFixed(2)),
        ]),
      ];
      const wsFin = utils.aoa_to_sheet(finData);
      utils.book_append_sheet(wb, wsFin, "Historial Financiero");
    }

    // Hoja 3: Distribución de Ayudas
    if (categoriesChartData.length > 0) {
      const totalCat = categoriesChartData.reduce((sum, item) => sum + item.value, 0);
      const catData = [
        ["Categoría de Ayuda", "Total Invertido (USD)", "Porcentaje (%)"],
        ...categoriesChartData.map((item) => {
          const porcentaje = totalCat > 0 ? Number(((item.value / totalCat) * 100).toFixed(2)) : 0;
          return [item.name, item.value, porcentaje];
        }),
      ];
      const wsCat = utils.aoa_to_sheet(catData);
      utils.book_append_sheet(wb, wsCat, "Distribución de Ayudas");
    }

    // Descargar el libro .xlsx
    writeFile(wb, `reporte_gestion_anican_${dayjs().format("YYYY-MM-DD")}.xlsx`);
  };

  // Función para exportar los datos financieros a CSV
  const handleExportFinancialsCSV = () => {
    if (financialsChartData.length === 0) return;

    const headers = ["Periodo", "Ingresos Recibidos (USD)", "Egresos Entregados (USD)", "Balance Neto (USD)"];
    const rows = financialsChartData.map((item) => [
      item.periodo,
      item.ingresos,
      item.egresos,
      (item.ingresos - item.egresos).toFixed(2),
    ]);

    exportToCSV(rows, headers, `reporte_financiero_${dayjs().format("YYYY-MM-DD")}.csv`);
  };

  // Utilidad nativa de exportación a CSV con BOM UTF-8 (compatible con Excel)
  const exportToCSV = (data: any[][], headers: string[], filename: string) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        row
          .map((val) => {
            const text = String(val ?? "").replace(/"/g, '""');
            return `"${text}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Acción para imprimir el reporte en formato PDF
  const handlePrint = () => {
    window.print();
  };

  const getFormattedPeriod = () => {
    if (fechaInicio && fechaFin) {
      return `del ${dayjs(fechaInicio).format("DD/MM/YYYY")} al ${dayjs(fechaFin).format("DD/MM/YYYY")}`;
    }
    if (fechaInicio) {
      return `desde ${dayjs(fechaInicio).format("DD/MM/YYYY")}`;
    }
    if (fechaFin) {
      return `hasta ${dayjs(fechaFin).format("DD/MM/YYYY")}`;
    }
    return "Histórico Completo";
  };

  if (loading) {
    return (
      <Center style={{ height: "70vh" }}>
        <Stack align="center" gap="md">
          <Loader color="orange" size="xl" type="bars" />
          <Text size="sm" c="dimmed">
            Consolidando estadísticas e históricos...
          </Text>
        </Stack>
      </Center>
    );
  }

  // Lógica para color y tendencia del balance neto
  const trendBalance =
    summary.balanceNetoUsd >= 0
      ? {
          value: 100,
          type: "up" as const,
          label: "Balance positivo",
        }
      : {
          value: 100,
          type: "down" as const,
          label: "Balance deficitario",
        };

  return (
    <Stack gap="xl" className="anican-fade-in printable-report">
      {/* -------------------------------------------------------------
          MEMBRETE DE IMPRESIÓN (Invisible en pantalla, visible en PDF)
          ------------------------------------------------------------- */}
      <Box className="print-header" style={{ display: "none" }} mb="xl">
        <Group justify="space-between" align="flex-start" style={{ borderBottom: "2px solid #1a365d", paddingBottom: 15 }}>
          <div>
            <Title order={1} style={{ color: "#1a365d", fontSize: 24, fontWeight: 800 }}>
              FUNDACIÓN ANICAN
            </Title>
            <Text size="sm" fw={600} style={{ color: "#e07e00" }}>
              Ayuda a Niños con Cáncer
            </Text>
            <Text size="xs" c="dimmed">
              R.I.F: J-40810232-0 | San Cristóbal, Táchira
            </Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <Title order={3} style={{ color: "#1a365d", fontSize: 16 }}>
              Reporte Analítico e Histórico de Gestión
            </Title>
            <Text size="xs" fw={500}>
              Periodo: {getFormattedPeriod()}
            </Text>
            <Text size="xs" c="dimmed">
              Generado el: {dayjs().format("DD/MM/YYYY hh:mm A")}
            </Text>
          </div>
        </Group>
      </Box>

      {/* -------------------------------------------------------------
          CABECERA DE PANTALLA (Oculta al imprimir)
          ------------------------------------------------------------- */}
      <Group justify="space-between" align="center" className="no-print">
        <div>
          <Group gap="xs">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/")}
              styles={{ root: { padding: "0 8px" } }}
            >
              Volver
            </Button>
            <Divider orientation="vertical" />
            <div>
              <Title
                order={1}
                style={{
                  letterSpacing: -1,
                  color: "var(--anican-azul-oscuro)",
                }}
              >
                Reportes de Gestión
              </Title>
              <Text c="dimmed" size="sm">
                Consolidación de métricas de la fundación para patrocinadores y auditoría interna
              </Text>
            </div>
          </Group>
        </div>

        {/* Acciones principales */}
        <Group gap="sm">
          <Button
            variant="outline"
            color="orange"
            leftSection={<IconPrinter size={18} />}
            onClick={handlePrint}
            radius="md"
          >
            Imprimir Reporte (PDF)
          </Button>

          <Button
            variant="filled"
            color="teal"
            leftSection={<IconFileSpreadsheet size={18} />}
            onClick={handleExportExcel}
            radius="md"
            disabled={financialsChartData.length === 0 && categoriesChartData.length === 0}
          >
            Exportar a Excel (XLSX)
          </Button>

          <Button
            variant="light"
            color="blue"
            leftSection={<IconFileSpreadsheet size={18} />}
            onClick={handleExportFinancialsCSV}
            radius="md"
            disabled={financialsChartData.length === 0}
          >
            Exportar Finanzas (CSV)
          </Button>
        </Group>
      </Group>

      {/* -------------------------------------------------------------
          CONTROLES DE FILTRO (Ocultos al imprimir, compactados y con botón Aplicar)
          ------------------------------------------------------------- */}
      <Card withBorder radius="md" p="md" className="no-print" shadow="xs" style={{ maxWidth: 680 }}>
        <Group gap="md" align="flex-end" wrap="nowrap">
          <DatePickerInput
            leftSection={<IconCalendar size={18} stroke={1.5} />}
            label="Fecha Inicio"
            placeholder="Seleccione fecha"
            value={tempFechaInicio}
            onChange={(val: any) => setTempFechaInicio(val)}
            clearable
            maxDate={tempFechaFin || undefined}
            styles={{ root: { flexGrow: 1 } }}
          />

          <DatePickerInput
            leftSection={<IconCalendar size={18} stroke={1.5} />}
            label="Fecha Fin"
            placeholder="Seleccione fecha"
            value={tempFechaFin}
            onChange={(val: any) => setTempFechaFin(val)}
            clearable
            minDate={tempFechaInicio || undefined}
            maxDate={new Date()}
            styles={{ root: { flexGrow: 1 } }}
          />

          <Button
            color="orange"
            onClick={() => {
              setFechaInicio(tempFechaInicio);
              setFechaFin(tempFechaFin);
            }}
            radius="md"
          >
            Aplicar
          </Button>

          {(fechaInicio || fechaFin || tempFechaInicio || tempFechaFin) && (
            <Button
              variant="subtle"
              color="red"
              onClick={() => {
                setTempFechaInicio(null);
                setTempFechaFin(null);
                setFechaInicio(null);
                setFechaFin(null);
              }}
              radius="md"
            >
              Limpiar
            </Button>
          )}
        </Group>
      </Card>

      {/* -------------------------------------------------------------
          RESUMEN EJECUTIVO (KPIs - Reestructurado simétricamente)
          ------------------------------------------------------------- */}
      <Stack gap="xs">
        <Title order={2} c="var(--anican-azul-oscuro)" size={20}>
          Resumen Ejecutivo
        </Title>
        <Text size="xs" c="dimmed" mb="sm" className="no-print">
          Métricas clave correspondientes al periodo seleccionado
        </Text>
        
        <Stack gap="md">
          {/* Fila 1: KPIs Financieros principales (3 columnas holgadas) */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Donaciones Recibidas"
                value={`$ ${summary.totalIngresosUsd.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon={<IconHeartHandshake size={32} />}
                color="teal"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Ayudas Entregadas (Inversión)"
                value={`$ ${summary.totalEgresosUsd.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon={<IconCash size={32} />}
                color="orange"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <StatCard
                title="Balance Neto"
                value={`$ ${summary.balanceNetoUsd.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon={summary.balanceNetoUsd >= 0 ? <IconTrendingUp size={32} /> : <IconTrendingDown size={32} />}
                color={summary.balanceNetoUsd >= 0 ? "blue" : "red"}
                trend={trendBalance}
              />
            </Grid.Col>
          </Grid>

          {/* Fila 2: KPIs Operativos de Impacto (2 columnas grandes y simétricas) */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <StatCard
                title="Niños Beneficiados"
                value={summary.pacientesUnicosBeneficiados}
                icon={<IconUsers size={32} />}
                color="indigo"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <StatCard
                title="Volumen Ayudas Otorgadas"
                value={`${summary.ayudasTotalesEntregadas} unidades`}
                icon={<IconClipboardList size={32} />}
                color="cyan"
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Stack>

      <Divider my="sm" />

      {/* -------------------------------------------------------------
          FINANZAS HISTÓRICAS
          ------------------------------------------------------------- */}
      <Stack gap="xs">
        <Title order={2} c="var(--anican-azul-oscuro)" size={20}>
          Histórico de Finanzas
        </Title>
        <FinancialsChart data={financialsChartData} />
      </Stack>

      <Divider my="sm" className="print-page-break" />

      {/* -------------------------------------------------------------
          DISTRIBUCIÓN DE AYUDAS
          ------------------------------------------------------------- */}
      <Stack gap="xs">
        <Title order={2} c="var(--anican-azul-oscuro)" size={20}>
          Desglose y Distribución de Ayudas
        </Title>
        <DistributionChart
          categoriesData={categoriesChartData}
          topAidsData={topAidsChartData}
        />
      </Stack>

      <Divider my="sm" />

      {/* -------------------------------------------------------------
          DEMOGRAFÍA DE PACIENTES
          ------------------------------------------------------------- */}
      <Stack gap="xs">
        <Group justify="space-between" align="baseline">
          <Title order={2} c="var(--anican-azul-oscuro)" size={20}>
            Demografía de Pacientes Activos
          </Title>
          <Text size="xs" fw={600} c="dimmed">
            Población Activa Total: {pacientesTotales} niños
          </Text>
        </Group>
        <DemographicsChart
          diagnosticsData={diagnosticsDemographics}
          sexData={sexDemographics}
          ageData={ageDemographics}
        />
      </Stack>
    </Stack>
  );
};
export default ReportsView;
