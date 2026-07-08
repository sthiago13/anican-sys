import React, { useEffect, useState } from "react";
import { Modal, TextInput, Select, Stack, Alert, Group } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { type Ayuda } from "../types";

interface AyudaModalProps {
  opened: boolean;
  onClose: () => void;
  ayuda: Ayuda | null;
  onSave: (id: string | null, nombreArticulo: string, categoria: string) => Promise<void>;
}

export function AyudaModal({
  opened,
  onClose,
  ayuda,
  onSave,
}: AyudaModalProps) {
  const [nombreArticulo, setNombreArticulo] = useState("");
  const [categoria, setCategoria] = useState<string | null>("Medicamento");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ayuda) {
      setNombreArticulo(ayuda.nombre_articulo || "");
      setCategoria(ayuda.categoria || "Medicamento");
    } else {
      setNombreArticulo("");
      setCategoria("Medicamento");
    }
    setError(null);
  }, [ayuda, opened]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreArticulo.trim()) {
      setError("El nombre del artículo de ayuda es obligatorio");
      return;
    }
    if (!categoria) {
      setError("La categoría es obligatoria");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave(ayuda ? ayuda.id : null, nombreArticulo, categoria);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err.message?.includes("unique")
          ? "Ya existe un artículo con este nombre en el catálogo."
          : "Error al guardar el artículo. Por favor, intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={ayuda ? "Editar Artículo de Ayuda" : "Nuevo Artículo de Ayuda"}
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
            label="Nombre del Artículo / Ayuda"
            placeholder="Ej. Leucogen 300mcg, Jeringas, Ayuda Monetaria Directa"
            required
            value={nombreArticulo}
            onChange={(e) => setNombreArticulo(e.target.value)}
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
            label="Categoría"
            placeholder="Seleccionar categoría"
            required
            data={[
              { value: "Medicamento", label: "Medicamento" },
              { value: "Insumo", label: "Insumo" },
              { value: "Servicio", label: "Servicio" },
              { value: "Económico", label: "Económico (Ayuda Monetaria/Financiamiento)" },
              { value: "Otros", label: "Otros (Alimentos, Vestimenta, etc.)" },
            ]}
            value={categoria}
            onChange={setCategoria}
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
