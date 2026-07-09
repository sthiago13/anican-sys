import React from "react";
import { Card, Title, Text, Group } from "@mantine/core";
import { AreaChart } from "@mantine/charts";
import { type ReportFinancialPoint } from "../types";

interface FinancialsChartProps {
  data: ReportFinancialPoint[];
}

export const FinancialsChart: React.FC<FinancialsChartProps> = ({ data }) => {
  const hasData = data.length > 0;

  return (
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
      <Group justify="space-between" mb="lg">
        <div>
          <Title
            order={3}
            style={{
              color: "var(--anican-azul-oscuro)",
              fontSize: 18,
            }}
          >
            Balance Financiero Histórico
          </Title>
          <Text size="xs" c="dimmed">
            Evolución de donaciones recibidas vs. entregadas en USD
          </Text>
        </div>
      </Group>

      {hasData ? (
        <AreaChart
          h={300}
          data={data}
          dataKey="periodo"
          series={[
            { name: "ingresos", color: "teal.6", label: "Ingresos Recibidos" },
            { name: "egresos", color: "orange.6", label: "Ayudas Entregadas" },
          ]}
          curveType="monotone"
          gridAxis="xy"
          withLegend
          valueFormatter={(value) =>
            `$ ${value.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          }
          tooltipAnimationDuration={200}
        />
      ) : (
        <Group justify="center" align="center" style={{ height: 300 }}>
          <Text c="dimmed" size="sm">
            No hay datos financieros registrados en el rango de fechas seleccionado.
          </Text>
        </Group>
      )}
    </Card>
  );
};
