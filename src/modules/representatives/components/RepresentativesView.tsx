import { useState } from "react";
import { Stack, Group, Title, Text, Card, Center, Loader } from "@mantine/core";
import { IconAddressBook } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { SearchInput } from "../../../components/UI/SearchInput";
import { RepresentativeTable } from "./RepresentativeTable";
import { RepresentativeModal } from "./RepresentativeModal";
import { useRepresentatives } from "../hooks/useRepresentatives";
import { type Representante } from "../types";

export function RepresentativesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedRep, setSelectedRep] = useState<Representante | null>(null);

  const {
    representantes,
    loading,
    handleCreateRepresentative,
    handleUpdateRepresentative,
    handleDeleteRepresentative,
  } = useRepresentatives();

  const handleEdit = (rep: Representante) => {
    setSelectedRep(rep);
    setModalOpened(true);
  };

  const handleCreateNew = () => {
    setSelectedRep(null);
    setModalOpened(true);
  };

  const handleSave = async (
    repData: Omit<Representante, "id" | "created_at" | "pacientes">
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
            Consulta, busca y administra a los tutores legales de los pacientes pediátricos
          </Text>
        </div>
        <Button
          leftSection={<IconAddressBook size={16} />}
          onClick={handleCreateNew}
        >
          Nuevo Representante
        </Button>
      </Group>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" mb="lg">
          <Group style={{ flexGrow: 1, maxWidth: 350 }}>
            <SearchInput
              placeholder="Buscar por cédula o nombre..."
              onSearchChange={setSearchQuery}
              style={{ width: "100%" }}
            />
          </Group>
        </Group>

        <RepresentativeTable
          representantes={representantes}
          searchQuery={searchQuery}
          onEdit={handleEdit}
          onDelete={handleDeleteRepresentative}
          loading={loading}
        />
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
    </Stack>
  );
}
