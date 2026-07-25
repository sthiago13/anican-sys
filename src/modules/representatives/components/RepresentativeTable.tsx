import React, { useState } from "react";
import { Table, Group, Text, Tooltip, Badge } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { IconButton } from "../../../components/UI/IconButton";
import { ConfirmModal } from "../../../components/UI/ConfirmModal";
import { PacienteInfoModal } from "./PatientInfoModal";
import { type Representante } from "../types";
import { type Paciente } from "../../patients/types";

export interface RepresentativeTableProps {
  representantes: Representante[];
  onEdit: (rep: Representante) => void;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export const RepresentativeTable: React.FC<RepresentativeTableProps> = ({
  representantes,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [selectedPacienteInfo, setSelectedPacienteInfo] =
    useState<Paciente | null>(null);
  const [pacienteModalOpened, setPacienteModalOpened] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (repId: string) => {
    setSelectedRepId(repId);
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

  const rows = representantes.map((rep) => {
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
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPacienteInfo(paciente as Paciente);
                    setPacienteModalOpened(true);
                  }}
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
          <Group gap={8} justify="flex-end">
            <Tooltip label="Editar Representante">
              <div>
                <IconButton
                  icon={<IconPencil size={16} stroke={1.5} />}
                  color="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(rep);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(rep.id);
                  }}
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
    <div className="anican-table-container">
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: "15%" }}>Cédula</Table.Th>
            <Table.Th style={{ width: "22%" }}>Nombre Completo</Table.Th>
            <Table.Th style={{ width: "18%" }}>Teléfonos</Table.Th>
            <Table.Th style={{ width: "18%" }}>Residencia</Table.Th>
            <Table.Th style={{ width: "15%" }}>Pacientes Asociados</Table.Th>
            <Table.Th style={{ width: "12%", textAlign: "right" }}>
              Acciones
            </Table.Th>
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

      <PacienteInfoModal
        opened={pacienteModalOpened}
        onClose={() => setPacienteModalOpened(false)}
        paciente={selectedPacienteInfo}
      />
    </div>
  );
};
