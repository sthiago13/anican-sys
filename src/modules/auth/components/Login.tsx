import React, { useState } from "react";
import {
  Paper,
  TextInput,
  PasswordInput,
  Title,
  Text,
  Button,
  Flex,
  Box,
  Stack,
  Group,
  Alert,
} from "@mantine/core";
import { IconLock, IconMail, IconAlertCircle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../config/supabase";
import { useBranding } from "../../settings/hooks/useBranding";

const GoldRibbonIcon = ({ size = 32 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 9 10 12.5 12 16M12 2C14.5 2 16.5 4 16.5 6.5C16.5 9 14 12.5 12 16M12 16C11.5 17 9 21.5 6 22M12 16C12.5 17 15 21.5 18 22"
      stroke="var(--anican-amarillo)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Por favor, ingresa tus credenciales.");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        setError(
          authError.message ||
            "Error al iniciar sesión. Verifica tus credenciales.",
        );
        return;
      }

      navigate("/");
    } catch (err) {
      setError("Ocurrió un error inesperado al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--anican-bg-login)",
        padding: 20,
      }}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        style={{
          width: "100%",
          maxWidth: 960,
          minHeight: 540,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "var(--anican-shadow-lg)",
        }}
      >
        {/* Formulario de Login */}
        <Paper
          p={{ base: 32, sm: 48 }}
          style={{
            flex: 1,
            backgroundColor: "var(--anican-bg-card)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Stack gap="lg">
            <Group gap="sm" align="center">
              {branding.logo_url ? (
                <Box
                  style={{
                    width: 44,
                    height: 44,
                    background: "transparent",
                    borderRadius: 10,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={branding.logo_url}
                    alt={branding.nombre_fundacion}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              ) : (
                <GoldRibbonIcon size={36} />
              )}
              <Box>
                <Text
                  size="xs"
                  fw={800}
                  c="var(--anican-naranja)"
                  tt="uppercase"
                  style={{ letterSpacing: "0.06em" }}
                >
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
                  fontFamily: "var(--font-sans)",
                  fontWeight: 800,
                  fontSize: 26,
                  letterSpacing: -0.5,
                  color: "var(--anican-azul-oscuro)",
                }}
              >
                Iniciar sesión
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Ingresa al sistema de gestión de{" "}
                {branding.nombre_fundacion || "Fundación Anican"}.
              </Text>
            </div>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Error de acceso"
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
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
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
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />

                <Button
                  type="submit"
                  loading={loading}
                  style={{
                    backgroundColor: "var(--anican-naranja)",
                    height: 48,
                    borderRadius: 10,
                    fontSize: 16,
                    fontWeight: 600,
                    marginTop: 10,
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 14px var(--anican-naranja-light)",
                  }}
                >
                  Entrar al Panel
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>

        {/* Hero Banner Corporativo / Branding Institucional */}
        <Paper
          radius={0}
          style={{
            flex: 1,
            position: "relative",
            background:
              "linear-gradient(135deg, var(--anican-azul-bg) 0%, color-mix(in srgb, var(--anican-azul-bg), black 15%) 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            minHeight: 280,
            color: "#ffffff",
          }}
        >
          <Stack
            gap="md"
            align="center"
            style={{ textAlign: "center", maxWidth: 360 }}
          >
            {branding.logo_url ? (
              <Box
                style={{
                  width: 144,
                  height: 144,
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <img
                  src={branding.logo_url}
                  alt={branding.nombre_fundacion}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>
            ) : (
              <GoldRibbonIcon size={64} />
            )}

            <div>
              <Title
                order={1}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 900,
                  fontSize: 34,
                  letterSpacing: -1,
                  color: "#ffffff",
                }}
              >
                {branding.nombre_fundacion || "Fundación Anican"}
              </Title>
              {branding.rif && (
                <Text
                  size="xs"
                  style={{ color: "var(--anican-azul-claro)", opacity: 0.9 }}
                  fw={600}
                  mt={2}
                >
                  R.I.F. {branding.rif}
                </Text>
              )}
            </div>

            <Text
              size="sm"
              fw={500}
              style={{
                color: "rgba(255, 255, 255, 0.85)",
                lineHeight: 1.5,
              }}
            >
              Sistema integral de gestión de pacientes oncopedímetricos,
              representantes y donaciones.
            </Text>

            <Box
              style={{
                width: 48,
                height: 4,
                backgroundColor: "var(--anican-amarillo)",
                borderRadius: 2,
                marginTop: 4,
              }}
            />
          </Stack>
        </Paper>
      </Flex>
    </Box>
  );
};
