import React from 'react';
import { Table, Badge, Group, Text, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { IconButton } from '../UI/IconButton';

export interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  status: 'Activo' | 'En Tratamiento' | 'Adoptado';
  lastDonationDate?: string;
  admissionDate: string;
}

export interface PatientTableProps {
  patients: Patient[];
  searchQuery: string;
  filterStatus: string;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (id: string) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  searchQuery,
  filterStatus,
  onEditPatient,
  onDeletePatient,
}) => {
  // Filter patients based on query and status filter
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.species.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'Todos' || patient.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'Activo':
        return 'teal';
      case 'En Tratamiento':
        return 'orange';
      case 'Adoptado':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const rows = filteredPatients.map((patient) => (
    <Table.Tr key={patient.id}>
      <Table.Td>
        <Text fw={600} size="sm">
          {patient.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{patient.species}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {patient.breed}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(patient.status)} variant="light" radius="sm">
          {patient.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {patient.admissionDate}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {patient.lastDonationDate ? `$${patient.lastDonationDate}` : 'N/A'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={8}>
          <Tooltip label="Editar Paciente">
            <div>
              <IconButton
                icon={<IconPencil size={16} stroke={1.5} />}
                color="blue"
                onClick={() => onEditPatient && onEditPatient(patient)}
              />
            </div>
          </Tooltip>
          <Tooltip label="Eliminar Paciente">
            <div>
              <IconButton
                icon={<IconTrash size={16} stroke={1.5} />}
                color="red"
                onClick={() => onDeletePatient && onDeletePatient(patient.id)}
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
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Especie</Table.Th>
            <Table.Th>Raza</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Fecha Ingreso</Table.Th>
            <Table.Th>Última Donación</Table.Th>
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
