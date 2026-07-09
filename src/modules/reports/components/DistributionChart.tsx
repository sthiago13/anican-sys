import React from "react";
import { Card, Title, Text, Grid, Group, Flex } from "@mantine/core";
import { DonutChart, BarChart } from "@mantine/charts";
import { type ReportCategoryPoint, type ReportTopAidPoint } from "../types";

interface DistributionChartProps {
  categoriesData: ReportCategoryPoint[];
  topAidsData: ReportTopAidPoint[];
}

const PALETTE_COLORES = [
  "orange.6",
  "blue.6",
  "teal.6",
  "pink.6",
  "cyan.6",
  "yellow.6",
  "grape.6",
  "violet.6",
  "indigo.6",
  "lime.6",
];

export const DistributionChart: React.FC<DistributionChartProps> = ({
  categoriesData,
  topAidsData,
}) => {
  const hasCategories = categoriesData.length > 0;
  const hasTopAids = topAidsData.length > 0;

  // Asignar colores a las categorías dinámicamente
  const formattedCategoriesData = categoriesData.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: PALETTE_COLORES[index % PALETTE_COLORES.length],
  }));

  return (
    <Grid>
      {/* 1. Egresos por Categorías */}
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
            Egresos por Categoría
          </Title>
          <Text size="xs" c="dimmed" mb="xl">
            Inversión en USD según categorías del catálogo de ayudas
          </Text>

          {hasCategories ? (
            <Flex
              direction={{ base: "column", sm: "row" }}
              gap="lg"
              align="center"
              justify="center"
              style={{ minHeight: 250 }}
            >
              <DonutChart
                size={180}
                thickness={24}
                data={formattedCategoriesData}
                withLabels
                withTooltip
                valueFormatter={(value) =>
                  `$ ${value.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                }
              />
              
              {/* Leyenda Personalizada para visualización de montos y porcentajes */}
              <Flex direction="column" gap={6} style={{ flexGrow: 1, width: "100%" }}>
                {formattedCategoriesData.map((item) => {
                  const total = categoriesData.reduce((sum, c) => sum + c.value, 0);
                  const porcentaje = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                  return (
                    <Group key={item.name} justify="space-between" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: `var(--mantine-color-${item.color.replace(".", "-")})`,
                            flexShrink: 0,
                          }}
                        />
                        <Text size="xs" fw={500} style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: 140 }}>
                          {item.name}
                        </Text>
                      </Group>
                      <Text size="xs" fw={600} c="dimmed">
                        {porcentaje}%
                      </Text>
                    </Group>
                  );
                })}
              </Flex>
            </Flex>
          ) : (
            <Group justify="center" align="center" style={{ height: 250 }}>
              <Text c="dimmed" size="sm">
                No hay egresos registrados en el periodo seleccionado.
              </Text>
            </Group>
          )}
        </Card>
      </Grid.Col>

      {/* 2. Top 5 Artículos de Ayuda */}
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
            Top 5 Ayudas Entregadas
          </Title>
          <Text size="xs" c="dimmed" mb="xl">
            Artículos del catálogo con mayor cantidad (volumen) entregada
          </Text>

          {hasTopAids ? (
            <BarChart
              h={250}
              data={topAidsData}
              dataKey="nombre"
              orientation="vertical"
              yAxisProps={{ width: 120 }}
              series={[{ name: "cantidad", color: "blue.6", label: "Unidades" }]}
              gridAxis="y"
              valueFormatter={(value) => `${value.toLocaleString("es-ES")} uds`}
            />
          ) : (
            <Group justify="center" align="center" style={{ height: 250 }}>
              <Text c="dimmed" size="sm">
                No hay entregas registradas en el periodo seleccionado.
              </Text>
            </Group>
          )}
        </Card>
      </Grid.Col>
    </Grid>
  );
};
