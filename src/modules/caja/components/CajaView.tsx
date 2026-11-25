import React, { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { AreaChart, LineChart } from "@mantine/charts";
import {
  IconAlertCircle,
  IconChartLine,
  IconCoins,
  IconCurrencyDollar,
  IconRefresh,
  IconWallet,
} from "@tabler/icons-react";
import { Navigate } from "react-router-dom";
import { Button } from "../../../components/UI/Button";
import { StatCard } from "../../../components/UI/StatCard";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCaja } from "../hooks/useCaja";
import { type MonedaCaja, type RangoFechaCaja } from "../types";
import { formatDate } from "../../../utils/date";

const CURRENCY_META: Record<
  MonedaCaja,
  {
    name: string;
    unitLabel: string;
    mantineColor: string;
    chartColorLight: string;
    chartColorDark: string;
  }
> = {
  USD: {
    name: "Dólares Estadounidenses",
    unitLabel: "USD",
    mantineColor: "teal",
    chartColorLight: "teal.7",
    chartColorDark: "teal.4",
  },
  VES: {
    name: "Bolívares",
    unitLabel: "Bs",
    mantineColor: "blue",
    chartColorLight: "blue.7",
    chartColorDark: "blue.4",
  },
  COP: {
    name: "Pesos Colombianos",
    unitLabel: "COP",
    mantineColor: "orange",
    chartColorLight: "orange.6",
    chartColorDark: "orange.4",
  },
};

function formatAmount(amount: number, currency: MonedaCaja): string {
  const formatted = amount.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${CURRENCY_META[currency].unitLabel}`;
}

function formatRate(value: number): string {
  const decimals = Math.abs(value) < 100 ? 4 : 2;
  return value.toLocaleString("es-VE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export const CajaView: React.FC = () => {
  const { perfil, loading: authLoading } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const {
    saldos,
    latestRate,
    activeRates,
    totalConsolidadoUsd,
    loading,
    error,
    refetch,
    getUsdRatesSeries,
    getConsolidadoSeries,
  } = useCaja();

  const [range, setRange] = useState<RangoFechaCaja>("30d");

  const ratesChartData = useMemo(
    () => getUsdRatesSeries(range),
    [getUsdRatesSeries, range],
  );

  const consolidadoChartData = useMemo(
    () => getConsolidadoSeries(range),
    [getConsolidadoSeries, range],
  );

  const rateCharts = useMemo(
    () => [
      {
        currency: "VES" as const,
        unitLabel: CURRENCY_META.VES.unitLabel,
        latestValue: activeRates.tasa_ves,
        series: [
          {
            name: "VES",
            label: "1 USD en Bs",
            color: isDark
              ? CURRENCY_META.VES.chartColorDark
              : CURRENCY_META.VES.chartColorLight,
          },
        ],
      },
      {
        currency: "COP" as const,
        unitLabel: CURRENCY_META.COP.unitLabel,
        latestValue: activeRates.tasa_cop,
        series: [
          {
            name: "COP",
            label: "1 USD en COP",
            color: isDark
              ? CURRENCY_META.COP.chartColorDark
              : CURRENCY_META.COP.chartColorLight,
          },
        ],
      },
    ],
    [activeRates, isDark],
  );

  if (authLoading) {
    return (
      <Center style={{ height: "70vh" }}>
        <Loader color="orange" size="xl" type="bars" />
      </Center>
    );
  }

  if (perfil?.rol !== "Administrador") {
    return <Navigate to="/" replace />;
  }

  if (
    loading &&
    ratesChartData.length === 0 &&
    saldos.every((s) => s.updated_at === null)
  ) {
    return (
      <Center style={{ height: "70vh" }}>
        <Stack align="center" gap="md">
          <Loader color="orange" size="xl" type="bars" />
          <Text size="sm" c="dimmed">
            Cargando saldos de caja y tasas de cambio...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="xl" className="anican-fade-in">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Group gap="xs" align="center">
            <IconWallet size={28} style={{ color: "var(--anican-naranja)" }} />
            <Title
              order={1}
              style={{
                letterSpacing: -1,
                color: "var(--anican-azul-oscuro)",
              }}
            >
              Caja
            </Title>
          </Group>
          <Text c="dimmed">
            Saldos disponibles por moneda y evolución histórica de tasas de
            cambio
          </Text>
        </div>

        <Button
          leftSection={<IconRefresh size={16} />}
          loading={loading}
          onClick={() => void refetch()}
        >
          Actualizar
        </Button>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={18} />}
          title="Error al cargar la caja"
          color="red"
          variant="light"
        >
          {error}
        </Alert>
      )}

      <Grid>
        {saldos.map((saldo) => {
          const meta = CURRENCY_META[saldo.moneda];
          return (
            <Grid.Col key={saldo.moneda} span={{ base: 12, sm: 6, md: 3 }}>
              <StatCard
                title={`${meta.name} (${meta.unitLabel})`}
                value={formatAmount(saldo.saldo_actual, saldo.moneda)}
                icon={<IconCoins size={48} />}
                color={meta.mantineColor}
              />
            </Grid.Col>
          );
        })}

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Consolidado Referencial"
            value={formatAmount(totalConsolidadoUsd, "USD")}
            icon={<IconCurrencyDollar size={48} />}
            color="green"
          />
        </Grid.Col>
      </Grid>

      <Card
        withBorder
        radius="md"
        p="lg"
        shadow="xs"
        style={{
          backgroundColor: "var(--anican-bg-card)",
          borderColor: "var(--anican-border)",
        }}
      >
        <Stack gap="md">
          <Group
            justify="space-between"
            align="flex-start"
            wrap="wrap"
            gap="md"
          >
            <div>
              <Group gap="xs">
                <IconChartLine
                  size={22}
                  style={{ color: "var(--anican-naranja)" }}
                />
                <Title
                  order={3}
                  style={{
                    color: "var(--anican-azul-oscuro)",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Evolución Histórica de Caja y Tasas
                </Title>
              </Group>
              <Text size="xs" c="dimmed">
                Consolidado referencial en USD y cotización del Bolívar (Bs) y
                Peso Colombiano (COP)
                {latestRate
                  ? ` · Última tasa: ${formatDate(latestRate.fecha)}`
                  : ""}
              </Text>
            </div>

            <SegmentedControl
              size="xs"
              color="orange"
              radius="md"
              value={range}
              onChange={(val) => setRange(val as RangoFechaCaja)}
              data={[
                { label: "7d", value: "7d" },
                { label: "30d", value: "30d" },
                { label: "90d", value: "90d" },
              ]}
            />
          </Group>

          <Group gap="sm" wrap="wrap">
            {rateCharts.map((item) => (
              <Badge
                key={item.currency}
                variant="light"
                color={CURRENCY_META[item.currency].mantineColor}
                size="md"
                radius="sm"
              >
                1 USD = {formatRate(item.latestValue)} {item.unitLabel}
              </Badge>
            ))}
            {activeRates.isFallback && (
              <Badge variant="outline" color="gray" size="sm" radius="sm">
                Tasa referencial por defecto
              </Badge>
            )}
          </Group>

          <Paper
            withBorder
            p="md"
            radius="md"
            style={{
              backgroundColor: "var(--anican-bg-card)",
              borderColor: "var(--anican-border)",
            }}
          >
            <Stack gap="sm">
              <Group justify="space-between" align="center" wrap="wrap">
                <div>
                  <Text size="sm" fw={700} c="var(--anican-azul-oscuro)">
                    Evolución del Consolidado Referencial
                  </Text>
                  <Text size="xs" c="dimmed">
                    Saldo acumulado en USD, Bs y COP valorado a la tasa de cada
                    fecha
                  </Text>
                </div>
                <Badge variant="light" color="green" size="sm">
                  Actual: {formatAmount(totalConsolidadoUsd, "USD")}
                </Badge>
              </Group>

              {consolidadoChartData.length > 0 ? (
                <AreaChart
                  h={260}
                  data={consolidadoChartData}
                  dataKey="fechaLabel"
                  series={[
                    {
                      name: "consolidadoUsd",
                      label: "Consolidado",
                      color: isDark ? "teal.4" : "teal.7",
                    },
                  ]}
                  curveType="monotone"
                  gridAxis="xy"
                  yAxisProps={{ width: 85, domain: ["auto", "auto"] }}
                  valueFormatter={(value) => `${value}`}
                  tooltipAnimationDuration={100}
                  strokeWidth={2.5}
                />
              ) : (
                <Center style={{ height: 220 }}>
                  <Text c="dimmed" size="sm">
                    No hay movimientos ni tasas en el rango seleccionado.
                  </Text>
                </Center>
              )}
            </Stack>
          </Paper>

          {ratesChartData.length > 0 ? (
            <Grid>
              {rateCharts.map((chart) => (
                <Grid.Col key={chart.currency} span={{ base: 12, lg: 6 }}>
                  <Paper
                    withBorder
                    p="md"
                    radius="md"
                    style={{
                      backgroundColor: "var(--anican-bg-card)",
                      borderColor: "var(--anican-border)",
                    }}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="center" wrap="wrap">
                        <div>
                          <Text
                            size="sm"
                            fw={700}
                            c="var(--anican-azul-oscuro)"
                          >
                            1 USD → {chart.unitLabel}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {CURRENCY_META[chart.currency].name}
                          </Text>
                        </div>
                        <Badge
                          variant="light"
                          color={CURRENCY_META[chart.currency].mantineColor}
                          size="sm"
                        >
                          1 USD = {formatRate(chart.latestValue)}{" "}
                          {chart.unitLabel}
                        </Badge>
                      </Group>

                      <LineChart
                        h={260}
                        data={ratesChartData}
                        dataKey="fechaLabel"
                        series={chart.series}
                        curveType="monotone"
                        gridAxis="xy"
                        yAxisProps={{ width: 75, domain: ["auto", "auto"] }}
                        valueFormatter={(value) => `${value}`}
                        tooltipAnimationDuration={100}
                        strokeWidth={2.5}
                        dotProps={{ r: 3, strokeWidth: 2 }}
                        activeDotProps={{ r: 6, strokeWidth: 2 }}
                      />
                    </Stack>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <Center style={{ height: 220 }}>
              <Stack align="center" gap="xs">
                <Text c="dimmed" size="sm">
                  No hay registros históricos de tasas de cambio en el rango
                  seleccionado.
                </Text>
                {range !== "90d" && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="orange"
                    onClick={() => setRange("90d")}
                  >
                    Ver últimos 90 días
                  </Button>
                )}
              </Stack>
            </Center>
          )}
        </Stack>
      </Card>
    </Stack>
  );
};
