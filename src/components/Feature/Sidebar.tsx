import React from 'react';
import { Stack, NavLink, Text, Group, Box, Title, Divider } from '@mantine/core';
import {
  IconDashboard,
  IconUsers,
  IconHeartHandshake,
  IconSettings,
  IconDog,
} from '@tabler/icons-react';

export interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const menuItems = [
    { value: 'dashboard', label: 'Panel de Control', icon: <IconDashboard size={18} stroke={1.5} /> },
    { value: 'pacientes', label: 'Pacientes (Mascotas)', icon: <IconUsers size={18} stroke={1.5} /> },
    { value: 'donaciones', label: 'Donaciones', icon: <IconHeartHandshake size={18} stroke={1.5} /> },
    { value: 'configuracion', label: 'Configuración', icon: <IconSettings size={18} stroke={1.5} /> },
  ];

  return (
    <Box
      style={{
        width: 260,
        height: '100vh',
        borderRight: '1px solid var(--mantine-color-gray-3)',
        backgroundColor: 'var(--mantine-color-white)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand Header */}
      <Group p="lg" gap="xs">
        <IconDog size={28} stroke={1.5} color="var(--mantine-color-orange-filled)" />
        <div>
          <Title order={3} style={{ fontFamily: 'var(--sans)', letterSpacing: -0.5 }}>
            Anican
          </Title>
          <Text size="xs" c="dimmed" fw={500}>
            Sistema de Gestión
          </Text>
        </div>
      </Group>

      <Divider mb="md" />

      {/* Navigation Items */}
      <Stack gap={4} p="md" style={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.value}
            active={activeView === item.value}
            label={item.label}
            leftSection={item.icon}
            onClick={() => onViewChange(item.value)}
            color="orange"
            variant="light"
            styles={{
              root: {
                borderRadius: 8,
                fontWeight: activeView === item.value ? 600 : 500,
                transition: 'all 0.15s ease',
              },
            }}
          />
        ))}
      </Stack>

      <Divider />

      {/* User Footer info */}
      <Group p="md" gap="sm">
        <Box
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            backgroundColor: 'var(--mantine-color-orange-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'var(--mantine-color-orange-9)',
          }}
        >
          AN
        </Box>
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={700}>
            Admin Anican
          </Text>
          <Text size="xs" c="dimmed">
            admin@anican.org
          </Text>
        </div>
      </Group>
    </Box>
  );
};
