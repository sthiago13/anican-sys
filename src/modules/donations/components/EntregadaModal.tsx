import React, { useEffect, useState } from "react";
import {
  Modal,
  Radio,
  Select,
  TextInput,
  NumberInput,
  Textarea,
  Switch,
  Stack,
  Alert,
  Group,
  Divider,
  Text,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconAlertCircle } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { supabase } from "../../../config/supabase";
import { normalizeDateInput, formatLocalDate } from "../../../utils/date";

interface EntregadaModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (
    fecha: string,
    idPaciente: string | null,
    beneficiarioExterno: string | null,
    idAyuda: string,
    metodoEntrega: string,
    cantidad: number,
    montoEquivalente: number,
    conSoporte: boolean,
    observaciones: string,
    moneda: string,
    montoOriginal: number,
    tasaCambio: number
  ) => Promise<void>;
}

interface PacienteSelectOption {
  id: string;
  nombres: string;
  apellidos: string;
}

interface AyudaSelectOption {
  id: string;
  nombre_articulo: string;
  categoria: string;
}

export function EntregadaModal({
  opened,
  onClose,
  onSave,
}: EntregadaModalProps) {
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [destinatarioTipo, setDestinatarioTipo] = useState<string>("paciente");
  const [idPaciente, setIdPaciente] = useState<string | null>(null);
  const [beneficiarioExterno, setBeneficiarioExterno] = useState("");
  const [idAyuda, setIdAyuda] = useState<string | null>(null);
  const [metodoEntrega, setMetodoEntrega] = useState<string | null>("Entrega Física");
  const [cantidad, setCantidad] = useState<number | string>(1);
  const [conSoporte, setConSoporte] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Multimoneda
  const [moneda, setMoneda] = useState<string | null>("USD");
  const [montoOriginal, setMontoOriginal] = useState<number | string>(0);
  const [tasaCambio, setTasaCambio] = useState<number | string>(1);

  // Listas para los Selects
  const [pacientes, setPacientes] = useState<PacienteSelectOption[]>([]);
  const [catalogoAyudas, setCatalogoAyudas] = useState<AyudaSelectOption[]>([]);

  useEffect(() => {
    if (opened) {
      setFecha(new Date());
      setDestinatarioTipo("paciente");
      setIdPaciente(null);
      setBeneficiarioExterno("");
      setIdAyuda(null);
      setMetodoEntrega("Entrega Física");
      setCantidad(1);
      setMontoOriginal(0);
      setTasaCambio(1);
      setMoneda("USD");
      setConSoporte(false);
      setObservaciones("");
      setError(null);

      // Cargar Catálogos relacionales al abrir
      const loadRelations = async () => {
        try {
          // 1. Pacientes
          const { data: pacData } = await supabase
            .from("pacientes")
            .select("id, nombres, apellidos")
            .order("nombres", { ascending: true });

          setPacientes(pacData || []);

          // 2. Ayudas
          const { data: ayuData } = await supabase
            .from("catalogo_ayudas")
            .select("id, nombre_articulo, categoria")
            .order("nombre_articulo", { ascending: true });

          setCatalogoAyudas(ayuData || []);
        } catch (err) {
          console.error("Error al cargar relaciones en el modal:", err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      setError("La fecha es requerida");
      return;
    }
    if (destinatarioTipo === "paciente" && !idPaciente) {
      setError("Debes seleccionar un paciente registrado");
      return;
    }
    if (destinatarioTipo === "externo" && !beneficiarioExterno.trim()) {
      setError("El nombre del beneficiario externo es requerido");
      return;
    }
    if (!idAyuda) {
      setError("Debes seleccionar un artículo del catálogo de ayudas");
      return;
    }
    if (!metodoEntrega) {
      setError("El método de entrega es requerido");
      return;
    }

    const cantNum = Number(cantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      setError("La cantidad debe ser mayor que 0");
      return;
    }

    const origNum = Number(montoOriginal);
    if (isNaN(origNum) || origNum < 0) {
      setError("El monto original no puede ser menor que 0");
      return;
    }

    const tasaNum = Number(tasaCambio);
    if (isNaN(tasaNum) || tasaNum <= 0) {
      setError("La tasa de cambio debe ser mayor que 0");
      return;
    }

    const eqUsd = origNum / tasaNum;

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
        destinatarioTipo === "paciente" ? idPaciente : null,
        destinatarioTipo === "externo" ? beneficiarioExterno : null,
        idAyuda,
        metodoEntrega,
        cantNum,
        eqUsd, // Guardamos el equivalente contable en USD
        conSoporte,
        observaciones,
        moneda || "USD",
        origNum,
        tasaNum
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar la entrega. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const pacienteOptions = pacientes.map((p) => ({
    value: p.id,
    label: `${p.nombres} ${p.apellidos}`,
  }));

  const ayudaOptions = catalogoAyudas.map((a) => ({
    value: a.id,
    label: `[${a.categoria}] ${a.nombre_articulo}`,
  }));

  // Calcular equivalencia en USD para previsualización
  const numOrig = Number(montoOriginal) || 0;
  const numTasa = Number(tasaCambio) || 1;
  const equivalenciaUsdCalculada = numOrig / numTasa;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Registrar Donación Entregada (Egreso)"
      centered
      radius="md"
      size="md"
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
            label="Fecha de la Entrega"
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

          <Radio.Group
            label="Destinatario de la Ayuda"
            required
            value={destinatarioTipo}
            onChange={setDestinatarioTipo}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 8,
              },
            }}
          >
            <Group gap="xl">
              <Radio value="paciente" label="Paciente Oncológico" />
              <Radio value="externo" label="Entidad / Beneficiario Externo" />
            </Group>
          </Radio.Group>

          {destinatarioTipo === "paciente" ? (
            <Select
              label="Paciente Beneficiario"
              placeholder="Buscar paciente por nombre..."
              required
              searchable
              data={pacienteOptions}
              value={idPaciente}
              onChange={setIdPaciente}
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
              label="Nombre del Beneficiario Externo"
              placeholder="Ej. Hospital de Niños J.M. de los Ríos"
              required
              value={beneficiarioExterno}
              onChange={(e) => setBeneficiarioExterno(e.target.value)}
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

          <Divider my="xs" />

          <Select
            label="Artículo / Ayuda del Catálogo"
            placeholder="Seleccionar artículo"
            required
            searchable
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

          <Select
            label="Método de Entrega"
            placeholder="Seleccionar método"
            required
            data={[
              { value: "Entrega Física", label: "Entrega Física en Sede" },
              { value: "Transferencia Directa", label: "Transferencia Directa de Fondos" },
              { value: "Pago a Proveedor", label: "Pago Directo a Farmacia / Proveedor de Servicio" },
              { value: "Otros", label: "Otros" },
            ]}
            value={metodoEntrega}
            onChange={setMetodoEntrega}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
                marginBottom: 4,
              },
              input: { borderRadius: 8 },
            }}
          />

          <Group grow>
            <NumberInput
              label="Cantidad"
              required
              min={1}
              value={cantidad}
              onChange={setCantidad}
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

          <Group grow>
            <NumberInput
              label="Monto a Entregar (Original)"
              placeholder="Ej. 100"
              required
              min={0}
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
          </Group>

          {moneda !== "USD" && (
            <Text size="xs" c="dimmed" fw={600} ta="right" mt={-6}>
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

          <Switch
            label="¿Cuenta con soporte físico? (Factura, recibo, constancia firmada)"
            checked={conSoporte}
            onChange={(e) => setConSoporte(e.currentTarget.checked)}
            styles={{
              label: {
                fontWeight: 600,
                color: "var(--anican-azul-oscuro)",
              },
            }}
          />

          <Textarea
            label="Observaciones"
            placeholder="Aclaratorias, dosificación, concepto o número de factura..."
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
              Registrar Egreso
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
