import { useState } from "react";
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
import { IconAddressBook, IconUpload, IconUsers } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { ExportButton } from "../../../components/UI/ExportButton";
import { SearchInput } from "../../../components/UI/SearchInput";
import { RepresentativeTable } from "./RepresentativeTable";
import { RepresentativeModal } from "./RepresentativeModal";
import { useRepresentatives } from "../hooks/useRepresentatives";
import { type Representante, type RepresentativeFilters } from "../types";
import { ImportModal } from "../../patients/components/ImportModal";
import { FilterBar } from "../../../components/UI/FilterSystem/FilterBar";
import { type FilterConfig } from "../../../components/UI/FilterSystem/types";
import { exportToExcel, exportToCSV, type ColumnDefinition } from "../../../utils/exportUtils";
import dayjs from "dayjs";

const filterConfigs: FilterConfig[] = [
  {
    key: "asociacion",
    label: "Pacientes a cargo",
    type: "select",
    icon: <IconUsers size={16} stroke={1.5} />,
    options: [
      { value: "Todos", label: "Todos" },
      { value: "Con Pacientes", label: "Con Pacientes" },
      { value: "Sin Pacientes", label: "Sin Pacientes" },
    ],
  },
];

const initialFilters: RepresentativeFilters = {
  asociacion: "Todos",
};

const repExportColumns: ColumnDefinition<Representante>[] = [
  { header: "Cédula", accessor: (r) => r.cedula },
  { header: "Nombres y Apellidos", accessor: (r) => r.nombres },
  { header: "Teléfono 1", accessor: (r) => r.telefono_1 || "—" },
  { header: "Teléfono 2", accessor: (r) => r.telefono_2 || "—" },
  { header: "Residencia", accessor: (r) => r.residencia || "—" },
  { header: "Cant. Pacientes", accessor: (r) => r.pacientes ? r.pacientes.length : 0 },
  { header: "Pacientes a Cargo", accessor: (r) => r.pacientes && r.pacientes.length > 0 ? r.pacientes.map((p) => `${p.nombres} ${p.apellidos}`).join("; ") : "Sin pacientes" },
];

export function RepresentativesView() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedRep, setSelectedRep] = useState<Representante | null>(null);
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState<RepresentativeFilters>(initialFilters);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters as unknown as RepresentativeFilters);
    setPage(1);
  };

  const {
    representantes,
    loading,
    totalCount,
    totalPages,
    handleCreateRepresentative,
    handleUpdateRepresentative,
    handleDeleteRepresentative,
    fetchExportData,
    refetch,
  } = useRepresentatives({
    page,
    pageSize,
    searchQuery,
    filters,
  });

  const handleExport = async (format: "excel" | "csv") => {
    try {
      setExporting(true);
      const dataToExport = await fetchExportData();
      const filename = `representantes_anican_${dayjs().format("YYYY-MM-DD")}`;
      if (format === "excel") {
        exportToExcel(dataToExport, repExportColumns, filename, "Representantes");
      } else {
        exportToCSV(dataToExport, repExportColumns, filename);
      }
    } catch (err) {
      console.error("Error al exportar representantes:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleEdit = (rep: Representante) => {
    setSelectedRep(rep);
    setModalOpened(true);
  };

  const handleCreateNew = () => {
    setSelectedRep(null);
    setModalOpened(true);
  };

  const handleSave = async (
    repData: Omit<Representante, "id" | "created_at" | "pacientes">,
  ) => {
    if (selectedRep) {
      await handleUpdateRepresentative(selectedRep.id, repData);
    } else {
      await handleCreateRepresentative(repData);
    }
  };

  if (loading && representantes.length === 0) {
    return (
      <Center style={{ height: "70vh" }}>
        <Stack align="center" gap="md">
          <Loader color="orange" size="xl" type="bars" />
          <Text size="sm" c="dimmed">
            Cargando directorio de representantes...
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
            Directorio de Representantes
          </Title>
          <Text c="dimmed">
            Consulta, busca y administra a los tutores legales de los pacientes
            pediátricos
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
            leftSection={<IconAddressBook size={16} />}
            onClick={handleCreateNew}
          >
            Nuevo Representante
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" mb="lg">
          <Group style={{ flexGrow: 1, maxWidth: 350 }}>
            <SearchInput
              placeholder="Buscar por cédula o nombre..."
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

        <RepresentativeTable
          representantes={representantes}
          onEdit={handleEdit}
          onDelete={handleDeleteRepresentative}
          loading={loading}
        />

        {totalPages > 1 && (
          <Group justify="space-between" mt="md" align="center">
            <Text size="xs" c="dimmed">
              Mostrando {representantes.length} de {totalCount} representantes
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

      <RepresentativeModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedRep(null);
        }}
        onSave={handleSave}
        representante={selectedRep}
      />

      <ImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        onImportSuccess={refetch}
      />
    </Stack>
  );
}
