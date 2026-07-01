import React from "react";
import { Modal, Group, ThemeIcon, Text, Stack, Divider, Box } from "@mantine/core";
import { IconUser, IconId, IconPhone, IconMapPin } from "@tabler/icons-react";
import type { Representante } from "../types";

interface RepresentanteInfoModalProps {
  opened: boolean;
  onClose: () => void;
  representante: Representante | null;
}

export const RepresentanteInfoModal: React.FC<RepresentanteInfoModalProps> = ({
  opened,
  onClose,
  representante,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="orange" size="md" radius="md">
            <IconUser size={18} />
          </ThemeIcon>
          <Text fw={700} size="lg" c="var(--anican-azul-oscuro)">
            Ficha del Representante Legal
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
      {representante && (
        <Stack gap="md" py="xs">
          <Text size="sm" c="dimmed">
            Información de contacto y residencia registrada del tutor legal.
          </Text>

          <Divider color="var(--anican-border)" />

          <Group gap="md" align="flex-start" wrap="nowrap">
            <ThemeIcon variant="light" color="blue" size="lg" radius="md">
              <IconUser size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed" fw={500}>
                Nombres Completos
              </Text>
              <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                {representante.nombres}
              </Text>
            </Box>
          </Group>

          <Group gap="md" align="flex-start" wrap="nowrap">
            <ThemeIcon variant="light" color="blue" size="lg" radius="md">
              <IconId size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed" fw={500}>
                Cédula de Identidad
              </Text>
              <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                {representante.cedula}
              </Text>
            </Box>
          </Group>

          <Group gap="md" align="flex-start" wrap="nowrap">
            <ThemeIcon variant="light" color="teal" size="lg" radius="md">
              <IconPhone size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed" fw={500}>
                Teléfono Principal
              </Text>
              <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                {representante.telefono_1 || "—"}
              </Text>
            </Box>
          </Group>

          {representante.telefono_2 && (
            <Group gap="md" align="flex-start" wrap="nowrap">
              <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                <IconPhone size={20} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed" fw={500}>
                  Teléfono Secundario
                </Text>
                <Text fw={600} size="md" c="var(--anican-azul-oscuro)">
                  {representante.telefono_2}
                </Text>
              </Box>
            </Group>
          )}

          <Group gap="md" align="flex-start" wrap="nowrap">
            <ThemeIcon variant="light" color="orange" size="lg" radius="md">
              <IconMapPin size={20} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" fw={500}>
                Dirección de Residencia
              </Text>
              <Text size="sm" c="var(--anican-azul-oscuro)" style={{ lineHeight: 1.4 }}>
                {representante.residencia || "No registrada"}
              </Text>
            </Box>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};
