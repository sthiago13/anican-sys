import React, { useState } from 'react';
import { Table, Badge, Group, Text, Tooltip, Anchor } from '@mantine/core';
import {
  IconPencil,
  IconActivity,
} from '@tabler/icons-react';
import { IconButton } from '../../../components/UI/IconButton';
import { RepresentanteInfoModal } from './RepresentanteInfoModal';
import { EditPatientModal } from './EditPatientModal';
import { type Paciente, type Representante } from '../types';
import { formatDate } from '../../../utils/date';
import { FilterDropdown } from '../../../components/UI/FilterDropdown';

export interface PacienteTableProps {
  pacientes: Paciente[];
  representantes: Representante[];
  searchQuery: string;
  filterStatus: string;
  onUpdateStatus?: (id: string, estado: Paciente['estado']) => void;
  onUpdatePaciente?: (
    pacienteId: string,
    pacienteData: {
      nombres: string;
      apellidos: string;
      fecha_nacimiento: string;
      diagnostico?: string;
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
    }
  ) => Promise<void>;
}

export const PacienteTable: React.FC<PacienteTableProps> = ({
  pacientes,
  representantes,
  searchQuery,
  filterStatus,
  onUpdateStatus,
  onUpdatePaciente
}) => {
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [selectedRepInfo, setSelectedRepInfo] = useState<Representante | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const filteredPacientes = pacientes.filter((paciente) => {
    const fullName = `${paciente.nombres} ${paciente.apellidos}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (paciente.diagnostico || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'Todos' || paciente.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleEditPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setEditModalOpened(true);
  };

  const selectedRepresentante = selectedPaciente
    ? representantes.find((r) => r.id === selectedPaciente.id_representante) || null
    : null;

  const getStatusColor = (estado: Paciente['estado']) => {
    switch (estado) {
      case 'Activo':
        return 'teal';
      case 'Fallecido':
        return 'gray';
      case 'Inactivo':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const rows = filteredPacientes.map((paciente) => {
    const rep = representantes.find((r) => r.id === paciente.id_representante);

    return (
      <Table.Tr key={paciente.id}>
        <Table.Td>
          <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
            {paciente.nombres} {paciente.apellidos}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{paciente.diagnostico || '—'}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed">{paciente.sexo || '—'}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed">{formatDate(paciente.fecha_nacimiento)}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color={getStatusColor(paciente.estado)} variant="light" radius="sm">
            {paciente.estado}
          </Badge>
        </Table.Td>
        <Table.Td>
          {rep ? (
            <Anchor
              component="button"
              size="sm"
              fw={600}
              color="orange"
              onClick={() => {
                setSelectedRepInfo(rep);
                setModalOpened(true);
              }}
              style={{
                textAlign: 'left',
                textDecoration: 'none',
              }}
            >
              {paciente.representante_nombre}
            </Anchor>
          ) : (
            <Text size="sm" c="dimmed">
              {paciente.representante_nombre || '—'}
            </Text>
          )}
        </Table.Td>
      <Table.Td>
        <Group gap={8}>
          <Tooltip label="Editar Paciente">
            <div>
              <IconButton
                icon={<IconPencil size={16} stroke={1.5} />}
                color="blue"
                onClick={() => handleEditPaciente(paciente)}
              />
            </div>
          </Tooltip>
          <Tooltip label="Cambiar Estado">
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
              onSelect={(value) => onUpdateStatus && onUpdateStatus(paciente.id, value as Paciente['estado'])}  
            />
           
          </Tooltip>
        </Group>
      </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Paciente</Table.Th>
            <Table.Th>Diagnóstico</Table.Th>
            <Table.Th>Sexo</Table.Th>
            <Table.Th>Fecha Nac.</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Representante</Table.Th>
            <Table.Th>Acciones</Table.Th>
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
