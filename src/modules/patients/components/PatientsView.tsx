import { useState } from "react";
import { Stack, Group, Title, Text, Card, Center, Loader } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/UI/Button";
import { SearchInput } from "../../../components/UI/SearchInput";
import { FilterDropdown } from "../../../components/UI/FilterDropdown";
import { PacienteTable } from "./PatientTable";
import { usePatients } from "../hooks/usePatients";

export function PatientsView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const { pacientes, representantes, loading, handleDeletePaciente } = usePatients();

  const filterOptions = [
    { value: "Todos", label: "Todos" },
    { value: "Activo", label: "Activo" },
    { value: "Inactivo", label: "Inactivo" },
    { value: "Fallecido", label: "Fallecido" },
  ];

  const handleEditPaciente = () => {
    navigate("/registro");
  };

  if (loading) {
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
          <Group style={{ flexGrow: 1, maxWidth: 400 }}>
            <SearchInput
              placeholder="Buscar por nombre, diagnóstico..."
              onSearchChange={setSearchQuery}
              style={{ width: "100%" }}
            />
          </Group>
          <FilterDropdown
            label="Estado"
            options={filterOptions}
            selectedValue={filterStatus}
            onSelect={setFilterStatus}
          />
        </Group>

        <PacienteTable
          pacientes={pacientes}
          representantes={representantes}
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          onEditPaciente={handleEditPaciente}
          onDeletePaciente={handleDeletePaciente}
        />
      </Card>
    </Stack>
  );
}
