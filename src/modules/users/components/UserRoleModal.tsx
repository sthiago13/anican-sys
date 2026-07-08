import React, { useEffect, useState } from "react";
import { Modal, Select, Stack, Text, Group } from "@mantine/core";
import { Button } from "../../../components/UI/Button";
import { type Perfil } from "../../auth/hooks/useAuth";

interface UserRoleModalProps {
  opened: boolean;
  onClose: () => void;
  usuario: Perfil | null;
  onSave: (userId: string, nuevoRol: string) => Promise<void>;
}

export function UserRoleModal({
  opened,
  onClose,
  usuario,
  onSave,
}: UserRoleModalProps) {
  const [rol, setRol] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setRol(usuario.rol);
    } else {
      setRol(null);
    }
  }, [usuario, opened]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !rol) return;
    setLoading(true);
    try {
      await onSave(usuario.id, rol);
      onClose();
    } catch (err) {
      alert("Error al actualizar el rol del usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Cambiar Rol de Usuario"
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
          <Text size="sm">
            Modifica el rol de <strong>{usuario?.nombres}</strong>. Esto cambiará sus permisos de acceso globales dentro del sistema.
          </Text>

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
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
