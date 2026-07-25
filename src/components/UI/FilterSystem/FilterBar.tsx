import React, { useState } from "react";
import { Group, Tooltip } from "@mantine/core";
import { IconFilter, IconFilterOff } from "@tabler/icons-react";
import { type FilterConfig } from "./types";
import { FilterDropdown } from "../FilterDropdown";
import { DatePickerParts, type DatePartsValue } from "./DatePickerParts";
import { DatePickerRange } from "./DatePickerRange";
import { IconButton } from "../IconButton";

export interface FilterBarProps {
  configs: FilterConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  onReset?: () => void;
  showFilters?: boolean;
  onToggleShowFilters?: () => void;
  activeCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  configs,
  values,
  onChange,
  initialValues,
  onReset,
  showFilters,
  onToggleShowFilters,
  activeCount,
}) => {
  const [internalShowFilters, setInternalShowFilters] = useState(false);

  const isExpanded =
    showFilters !== undefined ? showFilters : internalShowFilters;

  const handleToggle = () => {
    if (onToggleShowFilters) {
      onToggleShowFilters();
    } else {
      setInternalShowFilters((prev) => !prev);
    }
  };

  const computedActiveCount = (): number => {
    if (activeCount !== undefined) return activeCount;
    if (!initialValues) return 0;

    let count = 0;
    Object.keys(initialValues).forEach((key) => {
      const val = values[key];
      const init = initialValues[key];

      if (val === undefined) return;

      if (Array.isArray(val) && Array.isArray(init)) {
        if (val.some((item, idx) => item !== init[idx])) count++;
      } else if (
        typeof val === "object" &&
        val !== null &&
        typeof init === "object" &&
        init !== null
      ) {
        if (Object.keys(val).some((k) => val[k] !== init[k])) count++;
      } else if (val !== init) {
        count++;
      }
    });

    return count;
  };

  const currentActiveCount = computedActiveCount();

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else if (initialValues) {
      onChange(initialValues);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  return (
    <Group gap="xs" wrap="nowrap" align="center">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          maxWidth: isExpanded ? "1200px" : "0px",
          opacity: isExpanded ? 1 : 0,
          visibility: isExpanded ? "visible" : "hidden",
          overflow: isExpanded ? "visible" : "hidden",
          transition:
            "max-width 0.3s ease, opacity 0.25s ease, gap 0.3s ease, visibility 0.3s ease",
          whiteSpace: "nowrap",
          gap: isExpanded ? "8px" : "0px",
          pointerEvents: isExpanded ? "auto" : "none",
        }}
      >
        {configs.map((config) => {
          const value = values[config.key];

          switch (config.type) {
            case "select":
              return (
                <FilterDropdown
                  key={config.key}
                  label={config.label}
                  icon={config.icon}
                  options={config.options || []}
                  selectedValue={value}
                  onSelect={(val) => handleFilterChange(config.key, val)}
                />
              );

            case "date-parts":
              return (
                <DatePickerParts
                  key={config.key}
                  label={config.label}
                  icon={config.icon}
                  value={value as DatePartsValue}
                  onChange={(val) => handleFilterChange(config.key, val)}
                />
              );

            case "date-range":
              return (
                <DatePickerRange
                  key={config.key}
                  label={config.label}
                  icon={config.icon}
                  value={value as [Date | null, Date | null]}
                  onChange={(val) => handleFilterChange(config.key, val)}
                  placeholder={config.placeholder}
                />
              );

            default:
              return null;
          }
        })}
      </div>

      {currentActiveCount > 0 && (
        <Tooltip label="Reiniciar filtros">
          <div>
            <IconButton
              variant="outline"
              color="gray"
              radius="xl"
              icon={<IconFilterOff size={18} stroke={2} />}
              size="xl"
              onClick={handleReset}
            />
          </div>
        </Tooltip>
      )}

      <IconButton
        variant={isExpanded ? "filled" : "outline"}
        color="var(--anican-naranja)"
        radius="xl"
        icon={<IconFilter size={18} stroke={2} />}
        size="xl"
        onClick={handleToggle}
      >
        {!isExpanded && currentActiveCount > 0 && (
          <span style={{ marginLeft: 6, fontWeight: 700 }}>
            ({currentActiveCount})
          </span>
        )}
      </IconButton>
    </Group>
  );
};
