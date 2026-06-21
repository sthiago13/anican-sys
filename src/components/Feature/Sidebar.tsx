import React from 'react';
import { Stack, NavLink, Text, Group, Box, Title, Divider } from '@mantine/core';
import {
  IconDashboard,
  IconUsers,
  IconHeartHandshake,
  IconSettings,
  IconUserPlus,
} from '@tabler/icons-react';

const RibbonIcon = ({ size = 22, color = '#ffffff' }: { size?: number; color?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 9 10 12.5 12 16M12 2C14.5 2 16.5 4 16.5 6.5C16.5 9 14 12.5 12 16M12 16C11.5 17 9 21.5 6 22M12 16C12.5 17 15 21.5 18 22"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const menuItems = [
    { value: 'dashboard', label: 'Panel de Control', icon: <IconDashboard size={18} stroke={1.5} /> },
    { value: 'pacientes', label: 'Pacientes', icon: <IconUsers size={18} stroke={1.5} /> },
    { value: 'registro', label: 'Nuevo Registro', icon: <IconUserPlus size={18} stroke={1.5} /> },
    { value: 'donaciones', label: 'Donaciones', icon: <IconHeartHandshake size={18} stroke={1.5} /> },
    { value: 'configuracion', label: 'Configuración', icon: <IconSettings size={18} stroke={1.5} /> },
  ];

  return (
    <Box
      style={{
        width: 260,
        height: '100vh',
        borderRight: '1px solid var(--anican-border)',
        backgroundColor: 'var(--anican-bg-card)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand Header — Identidad Institucional */}
      <Group p="lg" gap="sm">
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--anican-naranja), var(--anican-amarillo))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RibbonIcon size={22} color="#ffffff" />
        </Box>
        <div>
          <Title
            order={3}
            style={{
              fontFamily: 'var(--font-sans)',
              letterSpacing: -0.5,
              color: 'var(--anican-azul-oscuro)',
              fontSize: 18,
            }}
          >
            Anican
          </Title>
          <Text size="xs" c="dimmed" fw={500} style={{ lineHeight: 1.2 }}>
            Fundación Cáncer Infantil
          </Text>
        </div>
      </Group>

      <Divider mb="md" color="var(--anican-border)" />

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

      <Divider color="var(--anican-border)" />

      {/* User Footer */}
      <Group p="md" gap="sm">
        <Box
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--anican-azul-claro-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--anican-azul-oscuro)',
          }}
        >
          AN
        </Box>
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={700} c="var(--anican-azul-oscuro)">
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
