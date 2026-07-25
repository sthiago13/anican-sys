import React, { useState, useMemo } from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Select,
  SegmentedControl,
  Stack,
} from "@mantine/core";
import { AreaChart } from "@mantine/charts";
import { IconFilter, IconTrendingUp } from "@tabler/icons-react";
import {
  type DonacionRecibida,
  type DonacionEntregada,
} from "../../donations/types";
import dayjs from "dayjs";

interface FinancialsChartProps {
  recibidas: DonacionRecibida[];
  entregadas: DonacionEntregada[];
}

export const FinancialsChart: React.FC<FinancialsChartProps> = ({
  recibidas,
  entregadas,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [viewMode, setViewMode] = useState<string>("ambos");

  // Obtener lista única de categorías disponibles
  const categoryOptions = useMemo(() => {
    const categorySet = new Set<string>();
    entregadas.forEach((item) => {
      if (item.catalogo_ayudas?.categoria) {
        categorySet.add(item.catalogo_ayudas.categoria);
      }
    });
    recibidas.forEach((item) => {
      if (item.catalogo_ayudas?.categoria) {
        categorySet.add(item.catalogo_ayudas.categoria);
      }
    });
    return [
      { value: "Todas", label: "Todas las categorías" },
      ...Array.from(categorySet)
        .sort()
        .map((c) => ({ value: c, label: c })),
    ];
  }, [entregadas, recibidas]);

  // Filtrar y agrupar mensualmente los datos
  const chartData = useMemo(() => {
    const dataMap: Record<string, { ingresos: number; egresos: number }> = {};

    // Filtrar ingresos
    recibidas.forEach((item) => {
      if (!item.fecha) return;
      if (
        selectedCategory !== "Todas" &&
        item.catalogo_ayudas?.categoria !== selectedCategory
      ) {
        return;
      }
      const mesStr = dayjs(item.fecha).format("YYYY-MM");
      if (!dataMap[mesStr]) {
        dataMap[mesStr] = { ingresos: 0, egresos: 0 };
      }
      dataMap[mesStr].ingresos += Number(item.monto_equivalente_usd) || 0;
    });

    // Filtrar egresos
    entregadas.forEach((item) => {
      if (!item.fecha) return;
      if (
        selectedCategory !== "Todas" &&
        item.catalogo_ayudas?.categoria !== selectedCategory
      ) {
        return;
      }
      const mesStr = dayjs(item.fecha).format("YYYY-MM");
      if (!dataMap[mesStr]) {
        dataMap[mesStr] = { ingresos: 0, egresos: 0 };
      }
      dataMap[mesStr].egresos += Number(item.monto_equivalente) || 0;
    });

    return Object.keys(dataMap)
      .sort()
      .map((key) => {
        const nombreMes = dayjs(`${key}-01`).format("MMM YY");
        return {
          periodo: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
          ingresos: Number(dataMap[key].ingresos.toFixed(2)),
          egresos: Number(dataMap[key].egresos.toFixed(2)),
        };
      });
  }, [recibidas, entregadas, selectedCategory]);

  const hasData = chartData.length > 0;

  // Determinar series a mostrar según el enfoque
  const seriesToDisplay = useMemo(() => {
    if (viewMode === "egresos") {
      return [
        { name: "egresos", color: "orange.6", label: "Ayudas Entregadas" },
      ];
    }
    if (viewMode === "ingresos") {
      return [
        { name: "ingresos", color: "teal.6", label: "Ingresos Recibidos" },
      ];
    }
    return [
      { name: "ingresos", color: "teal.6", label: "Ingresos Recibidos" },
      { name: "egresos", color: "orange.6", label: "Ayudas Entregadas" },
    ];
  }, [viewMode]);

  // Calcular el máximo valor dinámico para ajustar la escala Y en enfoque de egresos o categorías
  const maxYValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    let max = 0;
    chartData.forEach((point) => {
      if (viewMode === "egresos") {
        if (point.egresos > max) max = point.egresos;
      } else if (viewMode === "ingresos") {
        if (point.ingresos > max) max = point.ingresos;
      } else {
        if (point.ingresos > max) max = point.ingresos;
        if (point.egresos > max) max = point.egresos;
      }
    });
    return max > 0 ? Math.ceil(max * 1.15) : 100;
  }, [chartData, viewMode]);

  return (
    <Card
      withBorder
      radius="md"
      p="lg"
      shadow="xs"
      style={{
        backgroundColor: "var(--anican-bg-card)",
        borderColor: "var(--anican-border)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <Stack gap="md" mb="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <div>
            <Group gap="xs">
              <IconTrendingUp
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
                Balance Financiero Histórico
              </Title>
            </Group>
            <Text size="xs" c="dimmed">
              Evolución de donaciones recibidas vs. entregadas en USD
            </Text>
          </div>

          <Group gap="sm" wrap="wrap">
            {/* Filtro por Categoría de Ayuda */}
            <Select
              leftSection={<IconFilter size={16} />}
              placeholder="Categoría"
              data={categoryOptions}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val || "Todas")}
              style={{ width: 210 }}
              size="xs"
              radius="md"
            />

            {/* Selector de Enfoque de Vista */}
            <SegmentedControl
              size="xs"
              color="orange"
              value={viewMode}
              onChange={(val) => setViewMode(val)}
              data={[
                { label: "Ambos", value: "ambos" },
                { label: "Solo Egresos", value: "egresos" },
                { label: "Solo Ingresos", value: "ingresos" },
              ]}
            />
          </Group>
        </Group>
      </Stack>

      {hasData ? (
        <AreaChart
          h={340}
          data={chartData}
          dataKey="periodo"
          yAxisProps={{
            width: 120,
            domain: [0, maxYValue],
          }}
          series={seriesToDisplay}
          curveType="monotone"
          gridAxis="xy"
          withLegend
          valueFormatter={(value) =>
            `$\u00A0${value.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          }
          tooltipAnimationDuration={100}
          strokeWidth={2.5}
          dotProps={{ r: 4, strokeWidth: 2 }}
          activeDotProps={{ r: 6, strokeWidth: 2 }}
        />
      ) : (
        <Group justify="center" align="center" style={{ height: 320 }}>
          <Text c="dimmed" size="sm">
            No hay datos financieros registrados en el filtro o rango
            seleccionado.
          </Text>
        </Group>
      )}
    </Card>
  );
};
