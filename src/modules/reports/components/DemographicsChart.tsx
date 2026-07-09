import React from "react";
import { Card, Title, Text, Grid, Group, Flex } from "@mantine/core";
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

  // Asignar colores fijos a los sexos
  const formattedSexData = sexData.map((item) => ({
    name: item.label,
    value: item.cantidad,
    color: SEX_COLORS[item.label] || "gray.5",
  }));

  return (
    <Grid>
      {/* 1. Pacientes por Diagnóstico Oncopedíatrico */}
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
            }}
          >
            Pacientes por Diagnóstico
          </Title>
          <Text size="xs" c="dimmed" mb="xl">
            Distribución de niños activos según su patología oncológica
          </Text>

          {hasDiagnostics ? (
            <BarChart
              h={280}
              data={diagnosticsData}
              dataKey="label"
              orientation="vertical"
              yAxisProps={{ width: 120 }}
              series={[{ name: "cantidad", color: "teal.6", label: "Pacientes" }]}
              gridAxis="y"
              valueFormatter={(value) => `${value} niños`}
            />
          ) : (
            <Group justify="center" align="center" style={{ height: 280 }}>
              <Text c="dimmed" size="sm">
                No hay pacientes registrados activos.
              </Text>
            </Group>
          )}
        </Card>
      </Grid.Col>

      {/* 2. Edad y Sexo */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Grid style={{ height: "100%" }}>
          {/* Rangos de Edad */}
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
              <Title
                order={3}
                mb="xs"
                style={{
                  color: "var(--anican-azul-oscuro)",
                  fontSize: 18,
                }}
              >
                Distribución por Rango de Edad
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Población de pacientes agrupada por rango etario
              </Text>

              {hasAge ? (
                <BarChart
                  h={120}
                  data={ageData}
                  dataKey="label"
                  series={[{ name: "cantidad", color: "orange.5", label: "Niños" }]}
                  gridAxis="x"
                  valueFormatter={(value) => `${value} niños`}
                />
              ) : (
                <Group justify="center" align="center" style={{ height: 120 }}>
                  <Text c="dimmed" size="sm">
                    No hay información de edad disponible.
                  </Text>
                </Group>
              )}
            </Card>
          </Grid.Col>

          {/* Distribución por Sexo */}
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
              <Title
                order={3}
                mb="xs"
                style={{
                  color: "var(--anican-azul-oscuro)",
                  fontSize: 18,
                }}
              >
                Distribución por Sexo
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Proporción de género de la población de pacientes activos
              </Text>

              {hasSex ? (
                <Flex align="center" justify="space-around" style={{ minHeight: 100 }}>
                  <DonutChart
                    size={90}
                    thickness={12}
                    data={formattedSexData}
                    withTooltip
                    valueFormatter={(value) => `${value} pacientes`}
                  />
                  <Flex direction="column" gap={6} style={{ flexGrow: 1, paddingLeft: 30 }}>
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
                            <Text size="xs" fw={500}>
                              {item.name}
                            </Text>
                          </Group>
                          <Text size="xs" fw={600} c="dimmed">
                            {item.value} ({porcentaje}%)
                          </Text>
                        </Group>
                      );
                    })}
                  </Flex>
                </Flex>
              ) : (
                <Group justify="center" align="center" style={{ height: 100 }}>
                  <Text c="dimmed" size="sm">
                    No hay registros de género de pacientes.
                  </Text>
                </Group>
              )}
            </Card>
          </Grid.Col>
        </Grid>
      </Grid.Col>
    </Grid>
  );
};
