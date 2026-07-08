import { useState } from "react";
import { Stack, Title, Text, Card, Group, Table, ActionIcon, Center, Loader, Badge, Tooltip, Select } from "@mantine/core";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { SearchInput } from "../../../components/UI/SearchInput";
import { useAyudas } from "../hooks/useAyudas";
import { AyudaModal } from "./AyudaModal";
import { ConfirmModal } from "../../../components/UI/ConfirmModal";
import { type Ayuda } from "../types";

export function AyudasView() {
  const {
    ayudas,
    loading,
    handleSaveAyuda,
    handleDeleteAyuda,
  } = useAyudas();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedAyuda, setSelectedAyuda] = useState<Ayuda | null>(null);

  const filteredAyudas = ayudas.filter((a) => {
    const matchesSearch = a.nombre_articulo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || a.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (ayuda: Ayuda) => {
    setSelectedAyuda(ayuda);
    setModalOpened(true);
  };

  const handleAddNew = () => {
    setSelectedAyuda(null);
    setModalOpened(true);
  };

  const handleDeleteClick = (ayuda: Ayuda) => {
    setSelectedAyuda(ayuda);
    setDeleteModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedAyuda) {
      try {
        await handleDeleteAyuda(selectedAyuda.id);
        setDeleteModalOpened(false);
        setSelectedAyuda(null);
      } catch (err) {
        alert(
          "No se puede eliminar el artículo. Es muy probable que ya esté registrado y enlazado en el historial de Donaciones Entregadas."
        );
      }
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "Medicamento":
        return "orange";
      case "Insumo":
        return "teal";
      case "Servicio":
        return "grape";
      case "Económico":
        return "green";
      default:
        return "gray";
    }
  };

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
            Catálogo de Ayudas
          </Title>
          <Text c="dimmed">
            Administra los medicamentos, insumos, servicios y apoyos económicos de la fundación
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAddNew}
        >
          Nuevo Artículo
        </Button>
      </Group>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" mb="lg">
          <Group style={{ flexGrow: 1, maxWidth: 350 }}>
            <SearchInput
              placeholder="Buscar por nombre de artículo..."
              onSearchChange={setSearchQuery}
              style={{ width: "100%" }}
            />
          </Group>
          <Group>
            <Select
              placeholder="Filtrar por Categoría"
              data={["Todos", "Medicamento", "Insumo", "Servicio", "Económico", "Otros"]}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val || "Todos")}
              style={{ width: 200 }}
              styles={{
                input: { borderRadius: 8 },
              }}
            />
          </Group>
        </Group>

        {loading && ayudas.length === 0 ? (
          <Center style={{ height: "40vh" }}>
            <Loader color="orange" size="xl" type="bars" />
          </Center>
        ) : (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre del Artículo / Ayuda</Table.Th>
                <Table.Th>Categoría</Table.Th>
                <Table.Th style={{ width: 100, textAlign: "right" }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAyudas.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text ta="center" py="xl" c="dimmed">
                      {searchQuery || selectedCategory !== "Todos"
                        ? "No se encontraron artículos que coincidan con los filtros."
                        : "No hay artículos registrados en el catálogo."}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredAyudas.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>
                      <Text size="sm" fw={600} c="var(--anican-azul-oscuro)">
                        {a.nombre_articulo}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getCategoryBadgeColor(a.categoria)} variant="light">
                        {a.categoria}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Editar artículo" position="top" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleEdit(a)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar artículo" position="top" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteClick(a)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <AyudaModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        ayuda={selectedAyuda}
        onSave={handleSaveAyuda}
      />

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Artículo del Catálogo"
        message="¿Estás seguro de que deseas eliminar este artículo de ayuda? Esta acción no se puede deshacer y fallará si el artículo ya se encuentra registrado en alguna donación entregada."
        confirmLabel="Eliminar"
        confirmColor="red"
      />
    </Stack>
  );
}
