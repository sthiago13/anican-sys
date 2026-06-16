import React, { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Title,
  Text,
  Button,
  Overlay,
  Flex,
  Box,
  Stack,
  Group,
  Alert,
} from '@mantine/core';
import { IconLock, IconMail, IconAlertCircle } from '@tabler/icons-react';
import loginHero from '../../assets/login_hero.png';

export interface LoginProps {
  onLoginSuccess: () => void;
}

const GoldRibbonIcon = ({ size = 28 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 9 10 12.5 12 16M12 2C14.5 2 16.5 4 16.5 6.5C16.5 9 14 12.5 12 16M12 16C11.5 17 9 21.5 6 22M12 16C12.5 17 15 21.5 18 22"
      stroke="#ffc22f"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tus credenciales.');
      return;
    }

    setLoading(true);

    // Mock authentication: accepts any credentials for demo purposes
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 1000);
  };

  return (
    <Box
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f3f5',
        padding: 20,
      }}
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        style={{
          width: '100%',
          maxWidth: 960,
          minHeight: 560,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Panel Izquierdo: Formulario */}
        <Paper
          shadow="xl"
          p={{ base: 32, sm: 48 }}
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            // Responsive border radius removal on mobile
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <Stack gap="lg">
            {/* Logo/Icono de cáncer infantil en Amarillo (#ffc22f) */}
            <Group gap="xs" align="center">
              <GoldRibbonIcon size={32} />
              <Box>
                <Text size="xs" fw={700} c="#ffc22f" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Cáncer Infantil
                </Text>
                <Text size="xs" c="dimmed" fw={500}>
                  Unidos por la esperanza
                </Text>
              </Box>
            </Group>

            <div>
              <Title
                order={2}
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: -0.5,
                  color: '#2D0C57',
                }}
              >
                Iniciar sesión
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Ingresa al sistema de gestión de la fundación Anican.
              </Text>
            </div>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Error"
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Correo electrónico"
                  placeholder="ejemplo@anican.org"
                  required
                  leftSection={<IconMail size={16} stroke={1.5} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  styles={{
                    label: { fontWeight: 600, marginBottom: 4, color: '#2D0C57' },
                    input: { borderRadius: 8 },
                  }}
                />

                <PasswordInput
                  label="Contraseña"
                  placeholder="Tu contraseña segura"
                  required
                  leftSection={<IconLock size={16} stroke={1.5} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  styles={{
                    label: { fontWeight: 600, marginBottom: 4, color: '#2D0C57' },
                    input: { borderRadius: 8 },
                  }}
                />

                <Button
                  type="submit"
                  loading={loading}
                  style={{
                    backgroundColor: '#f58b05',
                    height: 48,
                    borderRadius: 10,
                    fontSize: 16,
                    fontWeight: 600,
                    marginTop: 10,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(245, 139, 5, 0.2)',
                  }}
                >
                  Entrar
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>

        {/* Panel Derecho: Identidad */}
        <Paper
          shadow="xl"
          radius={0}
          style={{
            flex: 1,
            position: 'relative',
            backgroundImage: `url(${loginHero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            minHeight: 260,
          }}
        >
          {/* Overlay oscuro (opacidad 0.4) para legibilidad */}
          <Overlay color="#000000" opacity={0.4} zIndex={1} />

          {/* Contenido centrado sobre el Overlay */}
          <Stack
            gap="xs"
            align="center"
            style={{
              zIndex: 2,
              textAlign: 'center',
            }}
          >
            {/* Logo 'Anican' centrado en azul claro (#7fbbdd) con opacidad */}
            <Title
              order={1}
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 900,
                fontSize: 64,
                letterSpacing: -1.5,
                color: '#7fbbdd',
                textShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              Anican
            </Title>
            <Text
              size="md"
              fw={600}
              c="#ffffff"
              style={{
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              Apoyo y Esperanza
            </Text>
            <Box
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#ffc22f',
                borderRadius: 2,
                marginTop: 8,
              }}
            />
          </Stack>
        </Paper>
      </Flex>
    </Box>
  );
};
