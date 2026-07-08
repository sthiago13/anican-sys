import { useState, useMemo } from "react";
import {
  Stack,
  Group,
  Title,
  Text,
  Card,
  Center,
  Loader,
  Popover,
  Select,
  SimpleGrid,
} from "@mantine/core";
import {
  IconUsers,
  IconCalendar,
  IconChevronDown,
  IconFilter,
  IconCheck,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/UI/Button";
import { SearchInput } from "../../../components/UI/SearchInput";
import { FilterDropdown } from "../../../components/UI/FilterDropdown";
import { PacienteTable } from "./PatientTable";
import { usePatients } from "../hooks/usePatients";
import { IconButton } from "../../../components/UI/IconButton";
import GenderIcon from "../../../components/UI/gendersIcon";

export function PatientsView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterSexo, setFilterSexo] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);

  const [filterYear, setFilterYear] = useState("Todos");
  const [filterMonth, setFilterMonth] = useState("Todos");
  const [filterDay, setFilterDay] = useState("Todos");

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

  const getDateFilterLabel = () => {
    if (
      filterYear === "Todos" &&
      filterMonth === "Todos" &&
      filterDay === "Todos"
    ) {
      return "Todos";
    }
    const parts = [];
    if (filterDay !== "Todos") parts.push(filterDay);
    if (filterMonth !== "Todos") {
      const monthObj = months.find((m) => m.value === filterMonth);
      parts.push(monthObj ? monthObj.label.slice(0, 3) : filterMonth);
    }
    if (filterYear !== "Todos") parts.push(filterYear);
    return parts.join("/");
  };

  const {
    pacientes,
    representantes,
    diagnosticos,
    loading,
    handleUpdateStatus,
    handleUpdatePaciente,
  } = usePatients();

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (!pacientes || pacientes.length === 0) {
      return ["Todos", String(currentYear)];
    }

    let minYear = currentYear;
    let maxYear = currentYear;

    pacientes.forEach((pac) => {
      if (pac.fecha_nacimiento) {
        const year = parseInt(pac.fecha_nacimiento.split("-")[0], 10);
        if (!isNaN(year)) {
          if (year < minYear) minYear = year;
          if (year > maxYear) maxYear = year;
        }
      }
    });

    const yearsList = ["Todos"];
    for (let y = maxYear; y >= minYear; y--) {
      yearsList.push(String(y));
    }
    return yearsList;
  }, [pacientes]);

  const filterOptions = [
    { value: "Todos", label: "Todos" },
    { value: "Activo", label: "Activo" },
    { value: "Inactivo", label: "Inactivo" },
    { value: "Fallecido", label: "Fallecido" },
  ];

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
        <Button
          leftSection={<IconUsers size={16} />}
          onClick={() => navigate("/registro")}
        >
          Nuevo Registro
        </Button>
      </Group>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" mb="lg">
          <Group style={{ flexGrow: 1, maxWidth: 350 }}>
            <SearchInput
              placeholder="Buscar por nombre, diagnóstico o representante"
              onSearchChange={setSearchQuery}
              style={{ width: "100%" }}
            />
          </Group>
          <Group gap="xs" wrap="nowrap" align="center">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                maxWidth: showFilters ? "600px" : "0px",
                opacity: showFilters ? 1 : 0,
                transition:
                  "max-width 0.3s ease, opacity 0.25s ease, gap 0.3s ease",
                whiteSpace: "nowrap",
                gap: showFilters ? "8px" : "0px",
              }}
            >
              <FilterDropdown
                label="Estado"
                options={filterOptions}
                icon={<IconCheck size={16} stroke={2} />}
                selectedValue={filterStatus}
                onSelect={setFilterStatus}
              />
              <FilterDropdown
                label="Sexo"
                icon={<GenderIcon />}
                options={[
                  { value: "Todos", label: "Todos" },
                  { value: "Masculino", label: "Masculino" },
                  { value: "Femenino", label: "Femenino" },
                ]}
                selectedValue={filterSexo}
                onSelect={setFilterSexo}
              />

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
                    leftSection={<IconCalendar size={16} stroke={1.5} />}
                    rightSection={<IconChevronDown size={14} stroke={1.5} />}
                    styles={{
                      root: {
                        fontWeight: 500,
                      },
                    }}
                  >
                    <Group gap={4} wrap="nowrap">
                      <span>Nacimiento:</span>
                      <span style={{ fontWeight: 600 }}>
                        {getDateFilterLabel()}
                      </span>
                    </Group>
                  </Button>
                </Popover.Target>
                <Popover.Dropdown p="md">
                  <Stack gap="sm">
                    <Text size="xs" fw={600} c="var(--anican-azul-oscuro)">
                      Filtrar por Fecha de Nacimiento
                    </Text>
                    <SimpleGrid cols={3} spacing="xs">
                      <Select
                        label="Año"
                        placeholder="Año"
                        data={years}
                        value={filterYear}
                        onChange={(val) => setFilterYear(val || "Todos")}
                        size="xs"
                        comboboxProps={{ shadow: "md" }}
                      />
                      <Select
                        label="Mes"
                        placeholder="Mes"
                        data={months}
                        value={filterMonth}
                        onChange={(val) => setFilterMonth(val || "Todos")}
                        size="xs"
                        comboboxProps={{ shadow: "md" }}
                      />
                      <Select
                        label="Día"
                        placeholder="Día"
                        data={days}
                        value={filterDay}
                        onChange={(val) => setFilterDay(val || "Todos")}
                        size="xs"
                        comboboxProps={{ shadow: "md" }}
                      />
                    </SimpleGrid>
                    {(filterYear !== "Todos" ||
                      filterMonth !== "Todos" ||
                      filterDay !== "Todos") && (
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={() => {
                          setFilterYear("Todos");
                          setFilterMonth("Todos");
                          setFilterDay("Todos");
                        }}
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
            </div>

            <IconButton
              variant={showFilters ? "filled" : "outline"}
              color="orange"
              radius="xl"
              icon={<IconFilter size={16} stroke={1.5} />}
              size="xl"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Ocultar" : "Filtros"}
              {!showFilters &&
                (filterStatus !== "Todos" ||
                  filterSexo !== "Todos" ||
                  filterYear !== "Todos" ||
                  filterMonth !== "Todos" ||
                  filterDay !== "Todos") && (
                  <span style={{ marginLeft: 6, fontWeight: 700 }}>
                    (
                    {
                      [
                        filterStatus !== "Todos",
                        filterSexo !== "Todos",
                        filterYear !== "Todos" ||
                          filterMonth !== "Todos" ||
                          filterDay !== "Todos",
                      ].filter(Boolean).length
                    }
                    )
                  </span>
                )}
            </IconButton>
          </Group>
        </Group>

        <PacienteTable
          pacientes={pacientes}
          representantes={representantes}
          diagnosticos={diagnosticos}
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          filterSexo={filterSexo}
          filterYear={filterYear}
          filterMonth={filterMonth}
          filterDay={filterDay}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePaciente={handleUpdatePaciente}
        />
      </Card>
    </Stack>
  );
}
