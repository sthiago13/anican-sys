import React from 'react';
import { Paper, Text, Group, ThemeIcon } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    type: 'up' | 'down';
    label?: string;
  };
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'orange',
}) => {
  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      shadow="xs"
      className="anican-card-hover"
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        height: "100%"
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {value}
          </Text>
        </div>
        <ThemeIcon
          variant="light"
          color={color}
          size="xl"
          radius="md"
          styles={{
            root: {
              backgroundColor: "transparent",
              color: `var(--mantine-color-${color}-filled)`,
            },
          }}
        >
          {icon}
        </ThemeIcon>
      </Group>

      {trend && (
        <Group gap={4} mt="xs">
          <Text
            c={trend.type === 'up' ? 'teal' : 'red'}
            size="sm"
            fw={700}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            {trend.type === 'up' ? <IconArrowUpRight size={16} /> : <IconArrowDownRight size={16} />}
            <span>{trend.value}%</span>
          </Text>
          <Text size="xs" c="dimmed">
            {trend.label || 'respecto al mes anterior'}
          </Text>
        </Group>
      )}
    </Paper>
  );
};
