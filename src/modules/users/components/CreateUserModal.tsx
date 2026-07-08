import React, { useEffect, useState } from "react";
import { Modal, TextInput, PasswordInput, Select, Stack, Alert, Group } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";

interface CreateUserModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (
    nombres: string,
    email: string,
    password: string,
    rol: "Administrador" | "Voluntario"
  ) => Promise<void>;
}

export function CreateUserModal({
  opened,
  onClose,
  onSave,
}: CreateUserModalProps) {
  const [nombres, setNombres] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string | null>("Voluntario");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened) {
      setNombres("");
      setEmail("");
      setPassword("");
      setRol("Voluntario");
      setError(null);
    }
  }, [opened]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres.trim() || !email.trim() || !password.trim() || !rol) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave(
        nombres,
        email,
        password,
        rol as "Administrador" | "Voluntario"
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Error al crear el usuario. Intenta de nuevo.";
      if (
        errMsg.toLowerCase().includes("email address") &&
        errMsg.toLowerCase().includes("invalid")
      ) {
        errMsg =
          "El correo electrónico es inválido o su dominio no cuenta con un servidor de correos verificado en Supabase (ej. utiliza un dominio real como @gmail.com).";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nuevo Usuario / Voluntario"
      centered
      radius="md"
      styles={{
        title: {
          fontWeight: 700,
          color: "var(--anican-azul-oscuro)",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <TextInput
            label="Nombre Completo"
            placeholder="Ej. Juan Pérez"
            required
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 4,
              },
              input: { borderRadius: 8 },
            }}
          />

          <TextInput
            label="Correo Electrónico"
            placeholder="juan.perez@anican.org"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 4,
              },
              input: { borderRadius: 8 },
            }}
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 4,
              },
              input: { borderRadius: 8 },
            }}
          />

          <Select
            label="Rol del Usuario"
            placeholder="Seleccionar rol"
            required
            data={[
              { value: "Administrador", label: "Administrador" },
              { value: "Voluntario", label: "Voluntario" },
            ]}
            value={rol}
            onChange={setRol}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 4,
              },
              input: { borderRadius: 8 },
            }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Crear Usuario
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
