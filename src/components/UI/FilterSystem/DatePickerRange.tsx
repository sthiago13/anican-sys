import React from "react";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";

export interface DatePickerRangeProps {
  label: string;
  value: [Date | null, Date | null];
  onChange: (value: [Date | null, Date | null]) => void;
  icon?: React.ReactNode;
  placeholder?: string;
}

export const DatePickerRange: React.FC<DatePickerRangeProps> = ({
  label,
  value,
  onChange,
  icon = <IconCalendar size={16} stroke={1.5} />,
  placeholder = "Rango de fecha",
}) => {

  return (
    <DatePickerInput
      type="range"
      value={value as any}
      onChange={(val: any) => onChange(val)}
      leftSection={icon}
      
      clearable
      placeholder={placeholder}
      aria-label={label}
      styles={{
        root: {
          width: 250,
        },
        input: {
          fontWeight: 500,
          borderColor: "var(--anican-naranja)",
          color: "var(--anican-naranja)",
          backgroundColor: "var(--anican-bg-card)",
          cursor: "pointer",
          borderRadius: "var(--mantine-radius-md)",
          paddingLeft: "36px",
          height: "36px",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "var(--anican-naranja-light)",
            borderColor: "var(--anican-naranja)",
          },
        },
        section: {
          pointerEvents: "none",
        },
      }}
      valueFormat="DD/MM/YY"
    />
  );
};
