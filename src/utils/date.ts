export const formatDate = (dateStr: string): string => {
  try {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const normalizeDateInput = (date: Date | string | null): Date | null => {
  if (!date) return null;

  let parsedDate: Date;
  if (typeof date === "string") {
    if (date.includes("-")) {
      const [year, month, day] = date.split("-").map(Number);
      parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      return parsedDate;
    }
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return null;
  } else if (date instanceof Date) {
    parsedDate = date;
  } else {
    return null;
  }

  let year = parsedDate.getFullYear();
  let month = parsedDate.getMonth();
  let day = parsedDate.getDate();

  // Si el objeto Date viene a las 00:00:00 UTC (muy común en selectores de fechas que trabajan en UTC)
  if (
    parsedDate.getUTCHours() === 0 &&
    parsedDate.getUTCMinutes() === 0 &&
    parsedDate.getUTCSeconds() === 0
  ) {
    year = parsedDate.getUTCFullYear();
    month = parsedDate.getUTCMonth();
    day = parsedDate.getUTCDate();
  }
  // Si viene a las 00:00:00 local
  else if (
    parsedDate.getHours() === 0 &&
    parsedDate.getMinutes() === 0 &&
    parsedDate.getSeconds() === 0
  ) {
    year = parsedDate.getFullYear();
    month = parsedDate.getMonth();
    day = parsedDate.getDate();
  }

  // Retornamos un objeto Date establecido a las 12:00:00 en hora local para blindarlo
  // de cualquier desfase de huso horario posterior al ser renderizado por el componente
  return new Date(year, month, day, 12, 0, 0, 0);
};
