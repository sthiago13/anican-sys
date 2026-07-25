import React from "react";
import { Menu, type MantineColor } from "@mantine/core";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypeCsv,
} from "@tabler/icons-react";
import { Button } from "./Button";

export interface ExportButtonProps {
  onExport: (format: "excel" | "csv") => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  color?: MantineColor;
  variant?: "outline" | "filled" | "light" | "subtle";
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  loading = false,
  disabled = false,
  color = "teal",
  variant = "outline",
  label = "Exportar",
}) => {
  return (
    <Menu shadow="md" width={180} position="bottom-end">
      <Menu.Target>
        <Button
          variant={variant}
          color={color}
          leftSection={<IconDownload size={16} />}
          loading={loading}
          disabled={disabled}
        >
          {label}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Formato de descarga</Menu.Label>
        <Menu.Item
          leftSection={<IconFileSpreadsheet size={16} />}
          onClick={() => void onExport("excel")}
        >
          Excel (.xlsx)
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFileTypeCsv size={16} />}
          onClick={() => void onExport("csv")}
        >
          CSV (.csv)
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
