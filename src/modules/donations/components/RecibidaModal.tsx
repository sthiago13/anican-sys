import React, { useEffect, useState } from "react";
import { Modal, TextInput, Select, Textarea, Stack, Alert, Group, Switch, NumberInput, Text, Divider } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconAlertCircle } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { supabase } from "../../../config/supabase";
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
    montoEquivalenteUsd: number | null,
    idAyuda: string | null
  ) => Promise<void>;
}

interface AyudaSelectOption {
  id: string;
  nombre_articulo: string;
  categoria: string;
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

  // Catálogo de Ayudas
  const [idAyuda, setIdAyuda] = useState<string | null>(null);
  const [catalogoAyudas, setCatalogoAyudas] = useState<AyudaSelectOption[]>([]);

  // Valoración Financiera
  const [esMonetario, setEsMonetario] = useState(true);
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
      setEsMonetario(true);
      setMoneda("USD");
      setMontoOriginal("");
      setTasaCambio(1);
      setIdAyuda(null);
      setError(null);

      // Cargar Catálogo de Ayudas al abrir
      const loadRelations = async () => {
        try {
          const { data } = await supabase
            .from("catalogo_ayudas")
            .select("id, nombre_articulo, categoria")
            .order("nombre_articulo", { ascending: true });
          setCatalogoAyudas(data || []);
        } catch (err) {
          console.error("Error al cargar ayudas en modal de ingresos:", err);
        }
      };

      void loadRelations();
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

  // Si cambia el método de ingreso a "En Especie", sugerimos desactivar o adecuar la valoración
  useEffect(() => {
    if (metodoIngreso === "En Especie") {
      setEsMonetario(false);
    } else {
      setEsMonetario(true);
    }
  }, [metodoIngreso]);

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
    if (!montoOCantidad.trim()) {
      setError("El detalle de la donación (qué se recibió) es requerido");
      return;
    }

    let finalMontoOriginal: number | null = null;
    let finalTasaCambio: number | null = null;
    let finalMontoEquivalenteUsd: number | null = null;

    if (esMonetario) {
      const origNum = Number(montoOriginal);
      const tasaNum = Number(tasaCambio);

      if (isNaN(origNum) || origNum <= 0) {
        setError("El monto de valoración contable debe ser mayor que 0");
        return;
      }
      if (isNaN(tasaNum) || tasaNum <= 0) {
        setError("La tasa de cambio debe ser mayor que 0");
        return;
      }

      finalMontoOriginal = origNum;
      finalTasaCambio = tasaNum;
      finalMontoEquivalenteUsd = origNum / tasaNum;
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
        montoOCantidad.trim(),
        observaciones,
        esMonetario ? (moneda || "USD") : "USD",
        finalMontoOriginal,
        finalTasaCambio,
        finalMontoEquivalenteUsd,
        idAyuda
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar la donación. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const ayudaOptions = catalogoAyudas.map((a) => ({
    value: a.id,
    label: `[${a.categoria}] ${a.nombre_articulo}`,
  }));

  // Calcular equivalencia en USD para previsualización en vivo
  const numOrig = Number(montoOriginal) || 0;
  const numTasa = Number(tasaCambio) || 1;
  const equivalenciaUsdCalculada = numOrig / numTasa;

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

          <Select
            label="Categoría / Artículo del Catálogo (Opcional)"
            placeholder="Asociar a un artículo del catálogo"
            searchable
            clearable
            data={ayudaOptions}
            value={idAyuda}
            onChange={setIdAyuda}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 4,
              },
              input: { borderRadius: 8 },
            }}
          />

          <Divider my="xs" />

          <TextInput
            label="Detalle / Descripción de la Donación"
            placeholder="Ej. 10 cajas de Ensure, 5 botes de Medicamento, Aporte monetario"
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

          <Switch
            label="¿Deseas registrar una valoración financiera/equivalente de esta donación?"
            checked={esMonetario}
            onChange={(e) => setEsMonetario(e.currentTarget.checked)}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
              },
            }}
          />

          {esMonetario && (
            <Stack gap="xs">
              <Group grow>
                <NumberInput
                  label="Monto Estimado / Donado"
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

              {moneda !== "USD" ? (
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
              ) : (
                <TextInput
                  label="Valor Contable (USD)"
                  value={`$ ${numOrig.toFixed(2)} USD`}
                  disabled
                  styles={{
                    label: {
                      fontWeight: 600,
                      color: "var(--anican-azul-oscuro)",
                      marginBottom: 4,
                    },
                    input: { borderRadius: 8, backgroundColor: "var(--anican-bg)" },
                  }}
                />
              )}

              {moneda !== "USD" && (
                <Text size="xs" c="dimmed" fw={600} ta="right" mt={-2}>
                  Equivalente contable:{" "}
                  <strong style={{ color: "green" }}>
                    $ {equivalenciaUsdCalculada.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD
                  </strong>
                </Text>
              )}
            </Stack>
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
