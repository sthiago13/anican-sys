import React, { useMemo } from "react";
import { Popover, Group, Select, Stack, Text, SimpleGrid } from "@mantine/core";
import { IconCalendar, IconChevronDown } from "@tabler/icons-react";
import { Button } from "../Button";

export interface DatePartsValue {
  year: string;
  month: string;
  day: string;
}

export interface DatePickerPartsProps {
  label: string;
  value: DatePartsValue;
  onChange: (value: DatePartsValue) => void;
  icon?: React.ReactNode;
}

const months = [
  { value: "Todos", label: "Todos" },
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const days = [
  "Todos",
  ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")),
];

export const DatePickerParts: React.FC<DatePickerPartsProps> = ({
  label,
  value,
  onChange,
  icon = <IconCalendar size={16} stroke={1.5} />,
}) => {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = ["Todos"];
    for (let i = 0; i < 25; i++) {
      list.push(String(currentYear - i));
    }
    return list;
  }, []);

  const handleYearChange = (yearVal: string) => {
    onChange({ ...value, year: yearVal });
  };

  const handleMonthChange = (monthVal: string) => {
    onChange({ ...value, month: monthVal });
  };

  const handleDayChange = (dayVal: string) => {
    onChange({ ...value, day: dayVal });
  };

  const handleClear = () => {
    onChange({ year: "Todos", month: "Todos", day: "Todos" });
  };

  const getDateFilterLabel = () => {
    if (
      value.year === "Todos" &&
      value.month === "Todos" &&
      value.day === "Todos"
    ) {
      return "Todos";
    }
    const parts = [];
    if (value.day !== "Todos") parts.push(value.day);
    if (value.month !== "Todos") {
      const monthObj = months.find((m) => m.value === value.month);
      parts.push(monthObj ? monthObj.label.slice(0, 3) : value.month);
    }
    if (value.year !== "Todos") parts.push(value.year);
    return parts.join("/");
  };

  const hasActiveFilters =
    value.year !== "Todos" ||
    value.month !== "Todos" ||
    value.day !== "Todos";

  return (
    <Popover
      width={320}
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
            <span style={{ fontWeight: 600 }}>{getDateFilterLabel()}</span>
          </Group>
        </Button>
      </Popover.Target>
      <Popover.Dropdown p="md">
        <Stack gap="sm">
          <Text size="xs" fw={600} c="var(--anican-azul-oscuro)">
            Filtrar por {label}
          </Text>
          <SimpleGrid cols={3} spacing="xs">
            <Select
              label="Día"
              placeholder="Día"
              data={days}
              value={value.day}
              onChange={(val) => handleDayChange(val || "Todos")}
              size="xs"
              comboboxProps={{ shadow: "md" }}
            />
            <Select
              label="Mes"
              placeholder="Mes"
              data={months}
              value={value.month}
              onChange={(val) => handleMonthChange(val || "Todos")}
              size="xs"
              comboboxProps={{ shadow: "md" }}
            />
            <Select
              label="Año"
              placeholder="Año"
              data={years}
              value={value.year}
              onChange={(val) => handleYearChange(val || "Todos")}
              size="xs"
              comboboxProps={{ shadow: "md" }}
            />
          </SimpleGrid>
          {hasActiveFilters && (
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
