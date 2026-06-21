import React from 'react';
import { Table, Badge, Group, Text, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { IconButton } from '../UI/IconButton';

// Interface alineada a la tabla `pacientes` de Supabase
export interface Paciente {
  id: string;
  id_representante?: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  diagnostico?: string;
  sexo?: string;
  estado: 'Activo' | 'Fallecido' | 'Inactivo';
  created_at?: string;
  // Joined data from representante (optional, for display)
  representante_nombre?: string;
}

// Interface alineada a la tabla `representantes` de Supabase
export interface Representante {
  id: string;
  cedula: string;
  nombres: string;
  telefono_1?: string;
  telefono_2?: string;
  residencia?: string;
  created_at?: string;
}

export interface PacienteTableProps {
  pacientes: Paciente[];
  searchQuery: string;
  filterStatus: string;
  onEditPaciente?: (paciente: Paciente) => void;
  onDeletePaciente?: (id: string) => void;
}

export const PacienteTable: React.FC<PacienteTableProps> = ({
  pacientes,
  searchQuery,
  filterStatus,
  onEditPaciente,
  onDeletePaciente,
}) => {
  // Filter based on search query and status
  const filteredPacientes = pacientes.filter((paciente) => {
    const fullName = `${paciente.nombres} ${paciente.apellidos}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (paciente.diagnostico || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'Todos' || paciente.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const rows = filteredPacientes.map((paciente) => (
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
        <Text size="sm" c="dimmed">
          {paciente.representante_nombre || '—'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={8}>
          <Tooltip label="Editar Paciente">
            <div>
              <IconButton
                icon={<IconPencil size={16} stroke={1.5} />}
                color="blue"
                onClick={() => onEditPaciente && onEditPaciente(paciente)}
              />
            </div>
          </Tooltip>
          <Tooltip label="Eliminar Paciente">
            <div>
              <IconButton
                icon={<IconTrash size={16} stroke={1.5} />}
                color="red"
                onClick={() => onDeletePaciente && onDeletePaciente(paciente.id)}
              />
            </div>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

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
    </div>
  );
};
