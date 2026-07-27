import React from "react";
import { Card, Title, Text, Grid, Group, Flex, Badge } from "@mantine/core";
import { BarChart, DonutChart } from "@mantine/charts";
import { type ReportDemographicsPoint } from "../types";

interface DemographicsChartProps {
  diagnosticsData: ReportDemographicsPoint[];
  sexData: ReportDemographicsPoint[];
  ageData: ReportDemographicsPoint[];
}

const SEX_COLORS: Record<string, string> = {
  Masculino: "blue.5",
  Femenino: "pink.5",
  Otros: "teal.5",
  "No especificado": "gray.5",
};

export const DemographicsChart: React.FC<DemographicsChartProps> = ({
  diagnosticsData,
  sexData,
  ageData,
}) => {
  const hasDiagnostics = diagnosticsData.length > 0;
  const hasSex = sexData.length > 0;
  const hasAge = ageData.length > 0;

  const totalDiagnosticsCount = diagnosticsData.reduce((sum, d) => sum + d.cantidad, 0);

  // Asignar colores fijos a los sexos
  const formattedSexData = sexData.map((item) => ({
    name: item.label,
    value: item.cantidad,
    color: SEX_COLORS[item.label] || "gray.5",
  }));

  return (
    <Grid>
      {/* 1. Pacientes por Diagnóstico Oncopedíatrico (Full Width Card) */}
      <Grid.Col span={12}>
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
          <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
            <div>
              <Title
                order={3}
                style={{
                  color: "var(--anican-azul-oscuro)",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Pacientes por Diagnóstico
              </Title>
              <Text size="xs" c="dimmed">
                Distribución de niños activos según su patología oncológica
              </Text>
            </div>
            {hasDiagnostics && (
              <Badge variant="light" color="teal" size="lg" radius="sm">
                {totalDiagnosticsCount} {totalDiagnosticsCount === 1 ? "paciente" : "pacientes en total"}
              </Badge>
            )}
          </Group>

          {hasDiagnostics ? (
            <Grid align="center">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <BarChart
                  h={Math.max(220, diagnosticsData.length * 40)}
                  data={diagnosticsData}
                  dataKey="label"
                  orientation="vertical"
                  yAxisProps={{ width: 190, tickLine: false }}
                  series={[{ name: "cantidad", color: "teal.6", label: "Pacientes" }]}
                  gridAxis="y"
                  valueFormatter={(value) => `${value} ${value === 1 ? "niño" : "niños"}`}
                  barChartProps={{ margin: { top: 10, right: 25, left: 10, bottom: 0 } }}
                />
              </Grid.Col>

             {/*aqui iba algo*/}
            </Grid>
          ) : (
            <Group justify="center" align="center" style={{ height: 180 }}>
              <Text c="dimmed" size="sm">
                No hay pacientes registrados activos.
              </Text>
            </Group>
          )}
        </Card>
      </Grid.Col>

      {/* 2. Distribución por Rango de Edad */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Card
          withBorder
          radius="md"
          p="lg"
          shadow="xs"
          style={{
            backgroundColor: "var(--anican-bg-card)",
            borderColor: "var(--anican-border)",
            height: "100%",
          }}
        >
          <Title
            order={3}
            mb="xs"
            style={{
              color: "var(--anican-azul-oscuro)",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Distribución por Rango de Edad
          </Title>
          <Text size="xs" c="dimmed" mb="md">
            Población de pacientes agrupada por rango etario
          </Text>

          {hasAge ? (
            <BarChart
              h={180}
              data={ageData}
              dataKey="label"
              series={[{ name: "cantidad", color: "orange.5", label: "Niños" }]}
              gridAxis="x"
              yAxisProps={{ width: 75, allowDecimals: false }}
              valueFormatter={(value) => `${value} ${value === 1 ? "niño" : "niños"}`}
              barChartProps={{ margin: { top: 20, right: 15, left: 10, bottom: 0 } }}
            />
          ) : (
            <Group justify="center" align="center" style={{ height: 180 }}>
              <Text c="dimmed" size="sm">
                No hay información de edad disponible.
              </Text>
            </Group>
          )}
        </Card>
      </Grid.Col>

      {/* 3. Distribución por Sexo */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Card
          withBorder
          radius="md"
          p="lg"
          shadow="xs"
          style={{
            backgroundColor: "var(--anican-bg-card)",
            borderColor: "var(--anican-border)",
            height: "100%",
          }}
        >
          <Title
            order={3}
            mb="xs"
            style={{
              color: "var(--anican-azul-oscuro)",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Distribución por Sexo
          </Title>
          <Text size="xs" c="dimmed" mb="md">
            Proporción de género de la población de pacientes activos
          </Text>

          {hasSex ? (
            <Flex align="center" justify="space-around" style={{ minHeight: 180 }}>
              <DonutChart
                size={110}
                thickness={14}
                data={formattedSexData}
                withTooltip
                valueFormatter={(value) => `${value} ${value === 1 ? "paciente" : "pacientes"}`}
              />
              <Flex direction="column" gap="xs" style={{ flexGrow: 1, paddingLeft: 30 }}>
                {formattedSexData.map((item) => {
                  const total = sexData.reduce((sum, s) => sum + s.cantidad, 0);
                  const porcentaje = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                  return (
                    <Group key={item.name} justify="space-between" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap">
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: `var(--mantine-color-${item.color.replace(".", "-")})`,
                            flexShrink: 0,
                          }}
                        />
                        <Text size="xs" fw={600} style={{ color: "var(--anican-text)" }}>
                          {item.name}
                        </Text>
                      </Group>
                      <Text size="xs" fw={700} c="dimmed">
                        {item.value} ({porcentaje}%)
                      </Text>
                    </Group>
                  );
                })}
              </Flex>
            </Flex>
          ) : (
            <Group justify="center" align="center" style={{ height: 180 }}>
              <Text c="dimmed" size="sm">
                No hay registros de género de pacientes.
              </Text>
            </Group>
          )}
        </Card>
      </Grid.Col>
    </Grid>
  );
};
