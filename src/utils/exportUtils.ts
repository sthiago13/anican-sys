import { utils, writeFile } from "xlsx";

export interface ColumnDefinition<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

/**
 * Exporta un arreglo de objetos a un archivo Excel (.xlsx) mapeando sus columnas.
 */
export function exportToExcel<T>(
  data: T[],
  columns: ColumnDefinition<T>[],
  filename: string,
  sheetName = "Datos"
): void {
  if (data.length === 0) return;

  // Convertir arreglo de datos en formato AOA (Array of Arrays)
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const val = col.accessor(item);
      return val ?? "";
    })
  );

  const aoa = [headers, ...rows];
  const worksheet = utils.aoa_to_sheet(aoa);

  // Ajustar anchos de columnas de forma dinámica
  const columnWidths = headers.map((header, colIndex) => {
    let maxLength = header.length;
    rows.forEach((row) => {
      const cellValue = String(row[colIndex] ?? "");
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });
    return { wch: Math.min(Math.max(maxLength + 2, 12), 40) };
  });

  worksheet["!cols"] = columnWidths;

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, sheetName);

  writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exporta un arreglo de objetos a un archivo CSV con codificación UTF-8 con BOM (para compatibilidad perfecta en Excel).
 */
export function exportToCSV<T>(
  data: T[],
  columns: ColumnDefinition<T>[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const val = col.accessor(item);
      const text = String(val ?? "").replace(/"/g, '""');
      return `"${text}"`;
    })
  );

  const csvLines = [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","), ...rows.map((r) => r.join(","))];
  const csvContent = csvLines.join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
