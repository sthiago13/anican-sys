import React from "react";
import {
  Modal,
  Group,
  ThemeIcon,
  Text,
  Stack,
  Divider,
  Box,
  Badge,
} from "@mantine/core";
import {
  IconHeartHandshake,
  IconUser,
  IconStethoscope,
  IconCalendar,
  IconActivity,
} from "@tabler/icons-react";
import type { Paciente } from "../../patients/types";
import { formatDate } from "../../../utils/date";

interface PacienteInfoModalProps {
  opened: boolean;
  onClose: () => void;
  paciente: Paciente | null;
}

export const PacienteInfoModal: React.FC<PacienteInfoModalProps> = ({
  opened,
  onClose,
  paciente,
}) => {
  const getStatusColor = (estado?: Paciente["estado"]) => {
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="orange" size="md" radius="md">
            <IconHeartHandshake size={18} />
          </ThemeIcon>
          <Text fw={700} size="lg" c="var(--anican-azul-oscuro)">
            Ficha Médica del Paciente
          </Text>
        </Group>
      }
      centered
      radius="md"
      size="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      transitionProps={{ transition: "fade", duration: 200 }}
    >
      {paciente && (
        <Stack gap="md" py="xs">
          <Text size="sm" c="dimmed">
            Información del expediente pediátrico oncológico registrado.
          </Text>

          <Divider color="var(--anican-border)" />

          <Group gap="md" align="flex-start" wrap="nowrap">
            <ThemeIcon variant="light" color="blue" size="lg" radius="md">
              <IconUser size={20} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" fw={500}>
                Nombre Completo del Paciente
              </Text>
              <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                {paciente.nombres} {paciente.apellidos}
              </Text>
              <Badge
                color={getStatusColor(paciente.estado)}
                variant="light"
                size="md"
              >
                {paciente.estado}
              </Badge>
            </Box>
          </Group>

          <Group gap="md" align="flex-start" wrap="nowrap">
            <ThemeIcon variant="light" color="orange" size="lg" radius="md">
              <IconStethoscope size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed" fw={500}>
                Diagnóstico Oncológico
              </Text>
              <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                {paciente.diagnostico_nombre || "No especificado"}
              </Text>
            </Box>
          </Group>

          <Group gap="md" align="flex-start" wrap="nowrap">
            <ThemeIcon variant="light" color="teal" size="lg" radius="md">
              <IconCalendar size={20} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" fw={500}>
                Fecha de Nacimiento
              </Text>
              <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                {formatDate(paciente.fecha_nacimiento)}
              </Text>
            </Box>
            {paciente.sexo && (
              <Box>
                <Text size="xs" c="dimmed" fw={500}>
                  Sexo
                </Text>
                <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                  {paciente.sexo}
                </Text>
              </Box>
            )}
          </Group>

          {paciente.representante_nombre && (
            <Group gap="md" align="flex-start" wrap="nowrap">
              <ThemeIcon variant="light" color="indigo" size="lg" radius="md">
                <IconActivity size={20} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed" fw={500}>
                  Tutor / Representante Legal
                </Text>
                <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                  {paciente.representante_nombre}
                </Text>
              </Box>
            </Group>
          )}
        </Stack>
      )}
    </Modal>
  );
};
