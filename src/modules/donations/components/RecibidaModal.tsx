import React, { useEffect, useState } from "react";
import { Modal, TextInput, Select, Textarea, Stack, Alert, Group, Switch, NumberInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconAlertCircle } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { normalizeDateInput, formatLocalDate } from "../../../utils/date";

interface RecibidaModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (
    fecha: string,
    entidadDonante: string,
    metodoIngreso: string,
    montoOCantidad: string,
    observaciones: string,
    moneda: string,
    montoOriginal: number | null,
    tasaCambio: number | null,
    montoEquivalenteUsd: number | null
  ) => Promise<void>;
}

export function RecibidaModal({
  opened,
  onClose,
  onSave,
}: RecibidaModalProps) {
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [entidadDonante, setEntidadDonante] = useState("");
  const [metodoIngreso, setMetodoIngreso] = useState<string | null>("Transferencia");
  const [montoOCantidad, setMontoOCantidad] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Multimoneda
  const [esMonetario, setEsMonetario] = useState(false);
  const [moneda, setMoneda] = useState<string | null>("USD");
  const [montoOriginal, setMontoOriginal] = useState<number | string>("");
  const [tasaCambio, setTasaCambio] = useState<number | string>(1);

  useEffect(() => {
    if (opened) {
      setFecha(new Date());
      setEntidadDonante("");
      setMetodoIngreso("Transferencia");
      setMontoOCantidad("");
      setObservaciones("");
      setEsMonetario(false);
      setMoneda("USD");
      setMontoOriginal("");
      setTasaCambio(1);
      setError(null);
    }
  }, [opened]);

  // Sincronizar tasa de cambio según la moneda elegida
  useEffect(() => {
    if (moneda === "USD") {
      setTasaCambio(1);
    } else if (moneda === "VES") {
      setTasaCambio(40); // Tasa estimada inicial editable
    } else if (moneda === "COP") {
      setTasaCambio(4000); // Tasa estimada inicial editable
    }
  }, [moneda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      setError("La fecha es requerida");
      return;
    }
    if (!entidadDonante.trim()) {
      setError("La entidad donante es requerida");
      return;
    }
    if (!metodoIngreso) {
      setError("El método de ingreso es requerido");
      return;
    }

    let finalMontoOCantidad = montoOCantidad;
    let finalMontoOriginal: number | null = null;
    let finalTasaCambio: number | null = null;
    let finalMontoEquivalenteUsd: number | null = null;

    if (esMonetario) {
      const origNum = Number(montoOriginal);
      const tasaNum = Number(tasaCambio);

      if (isNaN(origNum) || origNum <= 0) {
        setError("El monto de la donación debe ser mayor que 0");
        return;
      }
      if (isNaN(tasaNum) || tasaNum <= 0) {
        setError("La tasa de cambio debe ser mayor que 0");
        return;
      }

      finalMontoOriginal = origNum;
      finalTasaCambio = tasaNum;
      finalMontoEquivalenteUsd = origNum / tasaNum;

      // Componer el texto de monto o cantidad automáticamente
      finalMontoOCantidad = `${moneda} ${origNum.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      if (!montoOCantidad.trim()) {
        setError("El detalle de monto o cantidad es requerido");
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      // Normalizar fecha local para evitar desfases de huso horario
      const normalizedDate = normalizeDateInput(fecha);
      if (!normalizedDate) {
        setError("La fecha ingresada no es válida");
        return;
      }
      const fechaString = formatLocalDate(normalizedDate);

      await onSave(
        fechaString,
        entidadDonante,
        metodoIngreso,
        finalMontoOCantidad,
        observaciones,
        esMonetario ? (moneda || "USD") : "USD",
        finalMontoOriginal,
        finalTasaCambio,
        finalMontoEquivalenteUsd
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar la donación. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Registrar Donación Recibida (Ingreso)"
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

          <DateInput
            label="Fecha del Ingreso"
            placeholder="Seleccionar fecha"
            required
            value={fecha}
            onChange={(val: any) => setFecha(val)}
            maxDate={new Date()}
            valueFormat="DD/MM/YYYY"
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
            label="Entidad Donante / Benefactor"
            placeholder="Ej. Farmatodo, Chevron, Particular Anónimo"
            required
            value={entidadDonante}
            onChange={(e) => setEntidadDonante(e.target.value)}
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
            label="Método de Ingreso"
            placeholder="Seleccionar método"
            required
            data={[
              { value: "Transferencia", label: "Transferencia Bancaria" },
              { value: "Efectivo", label: "Efectivo" },
              { value: "Pago Móvil", label: "Pago Móvil" },
              { value: "En Especie", label: "En Especie (Medicamentos, Insumos, etc.)" },
              { value: "Otros", label: "Otros" },
            ]}
            value={metodoIngreso}
            onChange={setMetodoIngreso}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 4,
              },
              input: { borderRadius: 8 },
            }}
          />

          <Switch
            label="¿Es una donación puramente monetaria?"
            checked={esMonetario}
            onChange={(e) => setEsMonetario(e.currentTarget.checked)}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
              },
            }}
          />

          {esMonetario ? (
            <Stack gap="xs">
              <Group grow>
                <NumberInput
                  label="Monto de la Donación"
                  placeholder="Ej. 500"
                  required
                  min={0.01}
                  decimalScale={2}
                  value={montoOriginal}
                  onChange={setMontoOriginal}
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
                  label="Moneda"
                  required
                  data={[
                    { value: "USD", label: "Dólares (USD)" },
                    { value: "VES", label: "Bolívares (VES)" },
                    { value: "COP", label: "Pesos (COP)" },
                  ]}
                  value={moneda}
                  onChange={setMoneda}
                  styles={{
                    label: {
                      fontWeight: 600,
                      color: "var(--anican-azul-oscuro)",
                      marginBottom: 4,
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Group>

              {moneda !== "USD" && (
                <NumberInput
                  label={`Tasa de Cambio (1 USD = ? ${moneda})`}
                  placeholder="Ej. 40.5"
                  required
                  min={0.0001}
                  decimalScale={4}
                  value={tasaCambio}
                  onChange={setTasaCambio}
                  styles={{
                    label: {
                      fontWeight: 600,
                      color: "var(--anican-azul-oscuro)",
                      marginBottom: 4,
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              )}
            </Stack>
          ) : (
            <TextInput
              label="Detalle / Cantidad Recibida"
              placeholder="Ej. 30 cajas de Ensure, 5 cajas de Medicamentos, Ropa variada"
              required
              value={montoOCantidad}
              onChange={(e) => setMontoOCantidad(e.target.value)}
              styles={{
                label: {
                  fontWeight: 600,
                  color: "var(--anican-azul-oscuro)",
                  marginBottom: 4,
                },
                input: { borderRadius: 8 },
              }}
            />
          )}

          <Textarea
            label="Observaciones"
            placeholder="Detalles adicionales, número de referencia bancaria o desglose de insumos..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
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
              Registrar Ingreso
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
