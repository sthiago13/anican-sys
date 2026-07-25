import React, { useState } from "react";
import { Table, Badge, Group, Text, Tooltip } from "@mantine/core";
import { IconPencil, IconActivity } from "@tabler/icons-react";
import { IconButton } from "../../../components/UI/IconButton";
import { RepresentanteInfoModal } from "./RepresentanteInfoModal";
import { EditPatientModal } from "./EditPatientModal";
import { type Paciente, type Representante, type Diagnostico } from "../types";
import { formatDate } from "../../../utils/date";
import { FilterDropdown } from "../../../components/UI/FilterDropdown";

export interface PacienteTableProps {
  pacientes: Paciente[];
  representantes?: Representante[];
  diagnosticos: Diagnostico[];
  onUpdateStatus?: (id: string, estado: Paciente["estado"]) => void;
  onUpdatePaciente?: (
    pacienteId: string,
    pacienteData: {
      nombres: string;
      apellidos: string;
      fecha_nacimiento: string;
      id_diagnostico?: string;
      sexo?: string;
      estado: Paciente["estado"];
    },
    representanteId: string,
    representanteData: {
      cedula: string;
      nombres: string;
      telefono_1?: string;
      telefono_2?: string;
      residencia?: string;
    },
  ) => Promise<void>;
}

export const PacienteTable: React.FC<PacienteTableProps> = ({
  pacientes,
  diagnosticos,
  onUpdateStatus,
  onUpdatePaciente,
}) => {
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(
    null,
  );
  const [selectedRepInfo, setSelectedRepInfo] = useState<Representante | null>(
    null,
  );
  const [modalOpened, setModalOpened] = useState(false);

  const handleEditPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setEditModalOpened(true);
  };

  const selectedRepresentante = selectedPaciente?.representante || null;

  const getStatusColor = (estado: Paciente["estado"]) => {
    switch (estado) {
      case "Activo":
        return "teal";
      case "Fallecido":
        return "gray";
      case "Inactivo":
        return "orange";
      default:
        return "gray";
    }
  };

  const rows = pacientes.map((paciente) => {
    const rep = paciente.representante;

    return (
      <Table.Tr key={paciente.id}>
        <Table.Td>
          <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
            {paciente.nombres} {paciente.apellidos}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{paciente.diagnostico_nombre || "—"}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed">
            {paciente.sexo || "—"}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed">
            {formatDate(paciente.fecha_nacimiento)}
          </Text>
        </Table.Td>
        <Table.Td>
          <Badge
            color={getStatusColor(paciente.estado)}
            variant="light"
            radius="sm"
          >
            {paciente.estado}
          </Badge>
        </Table.Td>
        <Table.Td>
          {rep ? (
            <Badge
              variant="light"
              color="orange"
              size="sm"
              radius="sm"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRepInfo(rep);
                setModalOpened(true);
              }}
            >
              {paciente.representante_nombre}
            </Badge>
          ) : (
            <Text size="sm" c="dimmed">
              {paciente.representante_nombre || "—"}
            </Text>
          )}
        </Table.Td>
        <Table.Td>
          <Group gap={8} justify="flex-end">
            <Tooltip label="Editar Paciente">
              <div>
                <IconButton
                  icon={<IconPencil size={16} stroke={1.5} />}
                  color="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPaciente(paciente);
                  }}
                />
              </div>
            </Tooltip>
            <Tooltip label="Cambiar Estado">
              <div>
                <FilterDropdown
                  icon={<IconActivity size={16} stroke={1.5} />}
                  buttonType={IconButton}
                  label="Estado"
                  options={[
                    { value: "Activo", label: "Activo" },
                    { value: "Inactivo", label: "Inactivo" },
                    { value: "Fallecido", label: "Fallecido" },
                  ]}
                  selectedValue={paciente.estado}
                  onSelect={(value) =>
                    onUpdateStatus &&
                    onUpdateStatus(paciente.id, value as Paciente["estado"])
                  }
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
            <Table.Th style={{ width: "20%" }}>Paciente</Table.Th>
            <Table.Th style={{ width: "18%" }}>Diagnóstico</Table.Th>
            <Table.Th style={{ width: "8%" }}>Sexo</Table.Th>
            <Table.Th style={{ width: "12%" }}>Fecha Nac.</Table.Th>
            <Table.Th style={{ width: "12%" }}>Estado</Table.Th>
            <Table.Th style={{ width: "18%" }}>Representante</Table.Th>
            <Table.Th style={{ width: "12%", textAlign: "right" }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text ta="center" py="xl" c="dimmed">
                  No se encontraron pacientes que coincidan con la búsqueda.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
      <EditPatientModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedPaciente(null);
        }}
        paciente={selectedPaciente}
        representante={selectedRepresentante}
        diagnosticos={diagnosticos}
        onSave={onUpdatePaciente || (async () => {})}
      />
      <RepresentanteInfoModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        representante={selectedRepInfo}
      />
    </div>
  );
};
