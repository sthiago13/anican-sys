import React, { useEffect, useState } from "react";
import { Modal, TextInput, Textarea, Stack, Alert, Group } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { type Diagnostico } from "../../patients/types";

interface DiagnosticoModalProps {
  opened: boolean;
  onClose: () => void;
  diagnostico: Diagnostico | null;
  onSave: (id: string | null, nombre: string, descripcion: string) => Promise<void>;
}

export function DiagnosticoModal({
  opened,
  onClose,
  diagnostico,
  onSave,
}: DiagnosticoModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (diagnostico) {
      setNombre(diagnostico.nombre || "");
      setDescripcion(diagnostico.descripcion || "");
    } else {
      setNombre("");
      setDescripcion("");
    }
    setError(null);
  }, [diagnostico, opened]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre del diagnóstico es obligatorio");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave(diagnostico ? diagnostico.id : null, nombre, descripcion);
      onClose();
    } catch (err: any) {
      setError(
        err.message?.includes("unique")
          ? "Ya existe un diagnóstico con este nombre."
          : "Error al guardar el diagnóstico. Por favor, intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={diagnostico ? "Editar Diagnóstico" : "Nuevo Diagnóstico"}
      centered
      radius="md"
      styles={{
        title: {
          fontWeight: 700,
          color: "var(--anican-azul-oscuro)",
          fontFamily: "var(--font-sans)",
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
            label="Nombre del Diagnóstico"
            placeholder="Ej. Leucemia Linfoblástica Aguda"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 4,
              },
              input: { borderRadius: 8 },
            }}
          />

          <Textarea
            label="Descripción / Observaciones"
            placeholder="Detalles sobre este diagnóstico..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            minRows={3}
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
              Guardar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
