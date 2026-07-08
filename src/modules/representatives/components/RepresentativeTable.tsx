import React, { useState } from "react";
import { Table, Group, Text, Tooltip, Badge, Pill } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { IconButton } from "../../../components/UI/IconButton";
import { ConfirmModal } from "../../../components/UI/ConfirmModal";
import { type Representante } from "../types";

export interface RepresentativeTableProps {
  representantes: Representante[];
  searchQuery: string;
  onEdit: (rep: Representante) => void;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export const RepresentativeTable: React.FC<RepresentativeTableProps> = ({
  representantes,
  searchQuery,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtrado de representantes según la consulta de búsqueda (Cédula o Nombres)
  const filteredRepresentantes = representantes.filter((rep) => {
    const cedulaMatch = rep.cedula.toLowerCase().includes(searchQuery.toLowerCase());
    const nombresMatch = rep.nombres.toLowerCase().includes(searchQuery.toLowerCase());
    return cedulaMatch || nombresMatch;
  });

  const handleDeleteClick = (id: string) => {
    setSelectedRepId(id);
    setDeleteModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRepId) return;
    setDeleting(true);
    try {
      await onDelete(selectedRepId);
      setDeleteModalOpened(false);
      setSelectedRepId(null);
    } catch (err) {
      console.error("Error al eliminar representante:", err);
    } finally {
      setDeleting(false);
    }
  };

  const rows = filteredRepresentantes.map((rep) => {
    const tienePacientes = rep.pacientes && rep.pacientes.length > 0;

    return (
      <Table.Tr key={rep.id}>
        <Table.Td>
          <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
            {rep.cedula}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text fw={500} size="sm">
            {rep.nombres}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">
            {rep.telefono_1 || "—"}
            {rep.telefono_2 ? ` / ${rep.telefono_2}` : ""}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed" style={{ maxWidth: 250 }} truncate>
            {rep.residencia || "—"}
          </Text>
        </Table.Td>
        <Table.Td>
          {tienePacientes ? (
            <Group gap={4} wrap="wrap">
              {rep.pacientes?.map((paciente) => (
                <Badge
                  key={paciente.id}
                  variant="light"
                  color="orange"
                  size="sm"
                  radius="sm"
                >
                  {paciente.nombres} {paciente.apellidos}
                </Badge>
              ))}
            </Group>
          ) : (
            <Text size="xs" c="dimmed" fs="italic">
              Sin pacientes asociados
            </Text>
          )}
        </Table.Td>
        <Table.Td>
          <Group gap={8}>
            <Tooltip label="Editar Representante">
              <div>
                <IconButton
                  icon={<IconPencil size={16} stroke={1.5} />}
                  color="blue"
                  onClick={() => onEdit(rep)}
                  disabled={loading}
                />
              </div>
            </Tooltip>
            <Tooltip
              label={
                tienePacientes
                  ? "No se puede eliminar un representante con pacientes a cargo"
                  : "Eliminar Representante"
              }
            >
              <div>
                <IconButton
                  icon={<IconTrash size={16} stroke={1.5} />}
                  color="red"
                  onClick={() => handleDeleteClick(rep.id)}
                  disabled={tienePacientes || loading}
                />
              </div>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Cédula</Table.Th>
            <Table.Th>Nombre Completo</Table.Th>
            <Table.Th>Teléfonos</Table.Th>
            <Table.Th>Residencia</Table.Th>
            <Table.Th>Pacientes Asociados</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text ta="center" py="xl" c="dimmed">
                  No se encontraron representantes registrados.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedRepId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Representante"
        message="¿Estás seguro de que deseas eliminar este representante? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        confirmColor="red"
        loading={deleting}
      />
    </div>
  );
};
