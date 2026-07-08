import React, { useState, useEffect } from "react";
import { Modal, Group, Stack, TextInput, Textarea, ThemeIcon, Text } from "@mantine/core";
import { IconUser, IconId, IconPhone, IconMapPin } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { type Representante } from "../types";

interface RepresentativeModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (repData: Omit<Representante, "id" | "created_at" | "pacientes">) => Promise<void>;
  representante: Representante | null;
}

export const RepresentativeModal: React.FC<RepresentativeModalProps> = ({
  opened,
  onClose,
  onSave,
  representante,
}) => {
  const [cedula, setCedula] = useState("");
  const [nombres, setNombres] = useState("");
  const [telefono1, setTelefono1] = useState("");
  const [telefono2, setTelefono2] = useState("");
  const [residencia, setResidencia] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Inicializar el formulario si cambia el representante (para edición)
  useEffect(() => {
    if (representante) {
      setCedula(representante.cedula || "");
      setNombres(representante.nombres || "");
      setTelefono1(representante.telefono_1 || "");
      setTelefono2(representante.telefono_2 || "");
      setResidencia(representante.residencia || "");
    } else {
      setCedula("");
      setNombres("");
      setTelefono1("");
      setTelefono2("");
      setResidencia("");
    }
    setErrors({});
  }, [representante, opened]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!cedula.trim()) {
      newErrors.cedula = "La cédula es obligatoria";
    }
    if (!nombres.trim()) {
      newErrors.nombres = "El nombre completo es obligatorio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave({
        cedula: cedula.trim(),
        nombres: nombres.trim(),
        telefono_1: telefono1.trim() || undefined,
        telefono_2: telefono2.trim() || undefined,
        residencia: residencia.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "Ocurrió un error al guardar el representante.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!representante;

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
            {isEdit ? "Editar Representante" : "Nuevo Representante"}
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
      <form onSubmit={handleSubmit}>
        <Stack gap="md" py="xs">
          <Text size="sm" c="dimmed">
            {isEdit
              ? "Modifica la información del tutor legal. Estos cambios se aplicarán a todos los pacientes vinculados."
              : "Ingresa los datos para registrar un nuevo representante legal en el sistema."}
          </Text>

          <TextInput
            label="Cédula de Identidad"
            placeholder="Ej: 12345678"
            required
            leftSection={<IconId size={16} stroke={1.5} />}
            value={cedula}
            onChange={(e) => setCedula(e.currentTarget.value)}
            error={errors.cedula}
            disabled={loading}
          />

          <TextInput
            label="Nombres Completos"
            placeholder="Ej: María Pérez"
            required
            leftSection={<IconUser size={16} stroke={1.5} />}
            value={nombres}
            onChange={(e) => setNombres(e.currentTarget.value)}
            error={errors.nombres}
            disabled={loading}
          />

          <Group grow>
            <TextInput
              label="Teléfono Principal"
              placeholder="Ej: 04141234567"
              leftSection={<IconPhone size={16} stroke={1.5} />}
              value={telefono1}
              onChange={(e) => setTelefono1(e.currentTarget.value)}
              disabled={loading}
            />
            <TextInput
              label="Teléfono Secundario"
              placeholder="Ej: 02129876543"
              leftSection={<IconPhone size={16} stroke={1.5} />}
              value={telefono2}
              onChange={(e) => setTelefono2(e.currentTarget.value)}
              disabled={loading}
            />
          </Group>

          <Textarea
            label="Dirección de Residencia"
            placeholder="Ej: Calle Principal, Casa #10, Sector Centro"
            leftSection={<IconMapPin size={16} stroke={1.5} style={{ marginTop: 8 }} />}
            value={residencia}
            onChange={(e) => setResidencia(e.currentTarget.value)}
            disabled={loading}
            autosize
            minRows={2}
          />

          {errors.submit && (
            <Text color="red" size="sm" fw={500}>
              {errors.submit}
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Guardar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
