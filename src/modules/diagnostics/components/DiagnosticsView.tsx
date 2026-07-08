import { useState } from "react";
import { Stack, Title, Text, Card, Group, Table, ActionIcon, Center, Loader, Tooltip } from "@mantine/core";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { SearchInput } from "../../../components/UI/SearchInput";
import { useDiagnostics } from "../hooks/useDiagnostics";
import { DiagnosticoModal } from "./DiagnosticoModal";
import { ConfirmModal } from "../../../components/UI/ConfirmModal";
import { type Diagnostico } from "../../patients/types";

export function DiagnosticsView() {
  const {
    diagnosticos,
    loading,
    handleSaveDiagnostico,
    handleDeleteDiagnostico,
  } = useDiagnostics();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedDiag, setSelectedDiag] = useState<Diagnostico | null>(null);

  const filteredDiagnosticos = diagnosticos.filter((d) =>
    d.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.descripcion || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (diag: Diagnostico) => {
    setSelectedDiag(diag);
    setModalOpened(true);
  };

  const handleAddNew = () => {
    setSelectedDiag(null);
    setModalOpened(true);
  };

  const handleDeleteClick = (diag: Diagnostico) => {
    setSelectedDiag(diag);
    setDeleteModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedDiag) {
      try {
        await handleDeleteDiagnostico(selectedDiag.id);
        setDeleteModalOpened(false);
        setSelectedDiag(null);
      } catch (err) {
        alert("No se pudo eliminar el diagnóstico. Es posible que esté asociado a pacientes existentes.");
      }
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
            Catálogo de Diagnósticos
          </Title>
          <Text c="dimmed">
            Administra los tipos de diagnóstico del sistema Anican
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAddNew}
        >
          Nuevo Diagnóstico
        </Button>
      </Group>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" mb="lg">
          <Group style={{ flexGrow: 1, maxWidth: 350 }}>
            <SearchInput
              placeholder="Buscar por nombre o descripción..."
              onSearchChange={setSearchQuery}
              style={{ width: "100%" }}
            />
          </Group>
        </Group>

        {loading && diagnosticos.length === 0 ? (
          <Center style={{ height: "40vh" }}>
            <Loader color="orange" size="xl" type="bars" />
          </Center>
        ) : (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre del Diagnóstico</Table.Th>
                <Table.Th>Descripción</Table.Th>
                <Table.Th style={{ width: 100, textAlign: "right" }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredDiagnosticos.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text ta="center" py="xl" c="dimmed">
                      {searchQuery ? "No se encontraron diagnósticos que coincidan con la búsqueda." : "No hay diagnósticos registrados."}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredDiagnosticos.map((diag) => (
                  <Table.Tr key={diag.id}>
                    <Table.Td>
                      <Text size="sm" fw={600} c="var(--anican-azul-oscuro)">
                        {diag.nombre}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {diag.descripcion || "—"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Editar diagnóstico" position="top" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleEdit(diag)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar diagnóstico" position="top" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteClick(diag)}
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

      <DiagnosticoModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        diagnostico={selectedDiag}
        onSave={handleSaveDiagnostico}
      />

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Diagnóstico"
        message="¿Estás seguro de que deseas eliminar este diagnóstico? Esta acción no se puede deshacer y fallará si hay pacientes asociados a él."
        confirmLabel="Eliminar"
        confirmColor="red"
      />
    </Stack>
  );
}
