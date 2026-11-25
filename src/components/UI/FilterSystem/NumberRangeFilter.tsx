import React from "react";
import { Popover, Group, NumberInput, Stack, Text, SimpleGrid } from "@mantine/core";
import { IconChevronDown, IconHash } from "@tabler/icons-react";
import { Button } from "../Button";

export interface NumberRangeValue {
  min: number | null;
  max: number | null;
}

export interface NumberRangeFilterProps {
  label: string;
  value: NumberRangeValue;
  onChange: (value: NumberRangeValue) => void;
  icon?: React.ReactNode;
  minLimit?: number;
  maxLimit?: number;
  unitSuffix?: string;
}

export const NumberRangeFilter: React.FC<NumberRangeFilterProps> = ({
  label,
  value,
  onChange,
  icon = <IconHash size={16} stroke={1.5} />,
  minLimit = 0,
  maxLimit = 120,
  unitSuffix = "años",
}) => {
  const hasMin = value?.min !== null && value?.min !== undefined;
  const hasMax = value?.max !== null && value?.max !== undefined;
  const isFiltered = hasMin || hasMax;

  const getSummaryLabel = () => {
    if (!isFiltered) return "Todos";
    if (hasMin && hasMax) {
      if (value.min === value.max) {
        return `${value.min} ${value.min === 1 ? "año" : unitSuffix}`;
      }
      return `${value.min} - ${value.max} ${unitSuffix}`;
    }
    if (hasMin) return `≥ ${value.min} ${unitSuffix}`;
    return `≤ ${value.max} ${unitSuffix}`;
  };

  const handleMinChange = (val: string | number) => {
    const parsed = typeof val === "number" && !Number.isNaN(val) ? val : null;
    onChange({ ...value, min: parsed });
  };

  const handleMaxChange = (val: string | number) => {
    const parsed = typeof val === "number" && !Number.isNaN(val) ? val : null;
    onChange({ ...value, max: parsed });
  };

  const handleClear = () => {
    onChange({ min: null, max: null });
  };

  return (
    <Popover
      width={260}
      position="bottom-end"
      withArrow
      shadow="md"
      trapFocus
    >
      <Popover.Target>
        <Button
          variant="outline"
          color="orange"
          radius="md"
          leftSection={icon}
          rightSection={<IconChevronDown size={14} stroke={1.5} />}
          styles={{
            root: {
              fontWeight: 500,
            },
          }}
        >
          <Group gap={4} wrap="nowrap">
            <span>{label}:</span>
            <span style={{ fontWeight: 600 }}>{getSummaryLabel()}</span>
          </Group>
        </Button>
      </Popover.Target>

      <Popover.Dropdown p="md">
        <Stack gap="sm">
          <Text size="xs" fw={600} c="var(--anican-azul-oscuro)">
            Filtrar por {label}
          </Text>

          <SimpleGrid cols={2} spacing="xs">
            <NumberInput
              label="Mínima"
              placeholder="Ej: 0"
              size="xs"
              min={minLimit}
              max={maxLimit}
              allowDecimal={false}
              allowNegative={false}
              value={hasMin ? value.min! : ""}
              onChange={handleMinChange}
            />
            <NumberInput
              label="Máxima"
              placeholder="Ej: 17"
              size="xs"
              min={minLimit}
              max={maxLimit}
              allowDecimal={false}
              allowNegative={false}
              value={hasMax ? value.max! : ""}
              onChange={handleMaxChange}
            />
          </SimpleGrid>

          {isFiltered && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={handleClear}
              styles={{
                root: {
                  height: 28,
                },
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
