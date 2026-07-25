import { useState, useMemo } from "react";
import {
  Stack,
  Group,
  Title,
  Text,
  Card,
  Center,
  Loader,
  Pagination,
} from "@mantine/core";
import {
  IconUsers,
  IconCheck,
  IconCalendar,
  IconStethoscope,
  IconUpload,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/UI/Button";
import { ExportButton } from "../../../components/UI/ExportButton";
import { SearchInput } from "../../../components/UI/SearchInput";
import { FilterBar } from "../../../components/UI/FilterSystem/FilterBar";
import { type FilterConfig } from "../../../components/UI/FilterSystem/types";
import { PacienteTable } from "./PatientTable";
import { usePatients } from "../hooks/usePatients";
import GenderIcon from "../../../components/UI/gendersIcon";
import { ImportModal } from "./ImportModal";
import { type PatientFilters } from "../types";
import { exportToExcel, exportToCSV, type ColumnDefinition } from "../../../utils/exportUtils";
import { type Paciente } from "../types";
import dayjs from "dayjs";

const initialFilters: PatientFilters = {
  estado: "Todos",
  sexo: "Todos",
  diagnostico: "Todos",
  nacimiento: {
    year: "Todos",
    month: "Todos",
    day: "Todos",
  },
};

const patientExportColumns: ColumnDefinition<Paciente>[] = [
  { header: "Nombres", accessor: (p) => p.nombres },
  { header: "Apellidos", accessor: (p) => p.apellidos },
  { header: "Sexo", accessor: (p) => p.sexo || "—" },
  { header: "Fecha Nacimiento", accessor: (p) => p.fecha_nacimiento ? dayjs(p.fecha_nacimiento).format("DD/MM/YYYY") : "—" },
  { header: "Diagnóstico", accessor: (p) => p.diagnostico_nombre || "—" },
  { header: "Representante Legal", accessor: (p) => p.representante_nombre || "—" },
  { header: "Cédula Representante", accessor: (p) => p.representante?.cedula || "—" },
  { header: "Teléfono Contacto", accessor: (p) => p.representante?.telefono_1 || p.representante?.telefono_2 || "—" },
  { header: "Estado", accessor: (p) => p.estado },
];

export function PatientsView() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState<PatientFilters>(initialFilters);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters as unknown as PatientFilters);
    setPage(1);
  };

  const {
    pacientes,
    diagnosticos,
    loading,
    totalCount,
    totalPages,
    handleUpdateStatus,
    handleUpdatePaciente,
    fetchExportData,
    refetch,
  } = usePatients({
    page,
    pageSize,
    searchQuery,
    filters,
  });

  const handleExport = async (format: "excel" | "csv") => {
    try {
      setExporting(true);
      const dataToExport = await fetchExportData();
      const filename = `pacientes_anican_${dayjs().format("YYYY-MM-DD")}`;
      if (format === "excel") {
        exportToExcel(dataToExport, patientExportColumns, filename, "Pacientes");
      } else {
        exportToCSV(dataToExport, patientExportColumns, filename);
      }
    } catch (err) {
      console.error("Error al exportar pacientes:", err);
    } finally {
      setExporting(false);
    }
  };

  const filterConfigs: FilterConfig[] = useMemo(() => {
    const diagsOptions = [
      { value: "Todos", label: "Todos" },
      ...diagnosticos.map((d) => ({ value: d.id, label: d.nombre })),
    ];

    return [
      {
        key: "estado",
        label: "Estado",
        type: "select",
        icon: <IconCheck size={16} stroke={2} />,
        options: [
          { value: "Todos", label: "Todos" },
          { value: "Activo", label: "Activo" },
          { value: "Inactivo", label: "Inactivo" },
          { value: "Fallecido", label: "Fallecido" },
        ],
      },
      {
        key: "sexo",
        label: "Sexo",
        type: "select",
        icon: <GenderIcon />,
        options: [
          { value: "Todos", label: "Todos" },
          { value: "Masculino", label: "Masculino" },
          { value: "Femenino", label: "Femenino" },
        ],
      },
      {
        key: "diagnostico",
        label: "Diagnóstico",
        type: "select",
        icon: <IconStethoscope size={16} stroke={1.5} />,
        options: diagsOptions,
      },
      {
        key: "nacimiento",
        label: "Nacimiento",
        type: "date-parts",
        icon: <IconCalendar size={16} stroke={1.5} />,
        defaultValue: { year: "Todos", month: "Todos", day: "Todos" },
      },
    ];
  }, [diagnosticos]);

  if (loading && pacientes.length === 0) {
    return (
      <Center style={{ height: "70vh" }}>
        <Stack align="center" gap="md">
          <Loader color="orange" size="xl" type="bars" />
          <Text size="sm" c="dimmed">
            Cargando información...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="xl" className="anican-fade-in">
      <Group justify="space-between" align="center">
        <div>
          <Title
            order={1}
            style={{
              letterSpacing: -1,
              color: "var(--anican-azul-oscuro)",
            }}
          >
            Gestión de Pacientes
          </Title>
          <Text c="dimmed">
            Consulta y administra los pacientes registrados en la fundación
          </Text>
        </div>
        <Group gap="sm">
          <ExportButton
            onExport={handleExport}
            loading={exporting}
          />

          <Button
            variant="outline"
            color="orange"
            leftSection={<IconUpload size={16} />}
            onClick={() => setImportModalOpened(true)}
          >
            Importar Excel
          </Button>
          <Button
            leftSection={<IconUsers size={16} />}
            onClick={() => navigate("/registro")}
          >
            Nuevo Registro
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" mb="lg">
          <Group style={{ flexGrow: 1, maxWidth: 350 }}>
            <SearchInput
              placeholder="Buscar por nombre, diagnóstico o representante"
              onSearchChange={handleSearchChange}
              style={{ width: "100%" }}
            />
          </Group>
          <FilterBar
            configs={filterConfigs}
            values={filters}
            initialValues={initialFilters}
            onChange={handleFiltersChange}
          />
        </Group>


        <PacienteTable
          pacientes={pacientes}
          diagnosticos={diagnosticos}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePaciente={handleUpdatePaciente}
        />

        {totalPages > 1 && (
          <Group justify="space-between" mt="md" align="center">
            <Text size="xs" c="dimmed">
              Mostrando {pacientes.length} de {totalCount} pacientes registrados
            </Text>
            <Pagination
              total={totalPages}
              value={page}
              onChange={setPage}
              color="orange"
              size="sm"
              withEdges
            />
          </Group>
        )}
      </Card>

      <ImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        onImportSuccess={refetch}
      />
    </Stack>
  );
}
