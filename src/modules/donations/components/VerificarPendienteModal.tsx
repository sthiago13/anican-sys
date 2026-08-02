import React, { useState } from "react";
import {
  Modal,
  Grid,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Textarea,
  Paper,
  Divider,
  Alert,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconAlertCircle,
  IconCash,
  IconBuildingBank,
  IconCalendar,
  IconUser,
  IconFileText,
} from "@tabler/icons-react";
import { type DonacionPendiente } from "../types";

interface VerificarPendienteModalProps {
  opened: boolean;
  onClose: () => void;
  donacion: DonacionPendiente | null;
  onAprobar: (id: string) => Promise<void>;
  onRechazar: (id: string, motivo?: string) => Promise<void>;
}

export const VerificarPendienteModal: React.FC<VerificarPendienteModalProps> = ({
  opened,
  onClose,
  donacion,
  onAprobar,
  onRechazar,
}) => {
  const [loadingAprobar, setLoadingAprobar] = useState(false);
  const [loadingRechazar, setLoadingRechazar] = useState(false);
  const [showRechazarInput, setShowRechazarInput] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!donacion) return null;

  const handleModalClose = () => {
    setShowRechazarInput(false);
    setMotivoRechazo("");
    setErrorMessage(null);
    onClose();
  };

  const handleAprobarSubmit = async () => {
    try {
      setErrorMessage(null);
      setLoadingAprobar(true);
      await onAprobar(donacion.id);
      handleModalClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "No se pudo aprobar la donación.");
    } finally {
      setLoadingAprobar(false);
    }
  };

  const handleRechazarSubmit = async () => {
    try {
      setErrorMessage(null);
      setLoadingRechazar(true);
      await onRechazar(donacion.id, motivoRechazo);
      handleModalClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "No se pudo procesar el rechazo.");
    } finally {
      setLoadingRechazar(false);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Aprobado":
        return "teal";
      case "Rechazado":
        return "red";
      default:
        return "orange";
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      title={
        <Group justify="space-between" style={{ width: "100%" }}>
          <Group gap="xs">
            <IconBuildingBank size={24} style={{ color: "var(--anican-azul-oscuro)" }} />
            <Text fw={700} size="lg" style={{ color: "var(--anican-text)" }}>
              Verificación de Donación (Landing Page)
            </Text>
          </Group>
          <Badge color={getEstadoBadgeColor(donacion.estado)} variant="light" size="lg">
            {donacion.estado}
          </Badge>
        </Group>
      }
      size="xl"
      centered
      radius="md"
    >
      <Stack gap="md">
        {errorMessage && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="md">
            {errorMessage}
          </Alert>
        )}

        <Paper p="md" radius="sm" withBorder style={{ backgroundColor: "var(--anican-bg-card)" }}>
          <Grid>
            {/* Columna 1: Información del Donante y Transacción */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Group gap="xs">
                  <IconUser size={18} style={{ opacity: 0.7 }} />
                  <Text fw={600} size="sm" c="dimmed">Donante:</Text>
                  <Text fw={700} size="sm">{donacion.entidad_donante}</Text>
                </Group>

                <Group gap="xs">
                  <IconCalendar size={18} style={{ opacity: 0.7 }} />
                  <Text fw={600} size="sm" c="dimmed">Fecha de Registro:</Text>
                  <Text size="sm">{donacion.fecha}</Text>
                </Group>

                <Group gap="xs">
                  <IconCash size={18} style={{ opacity: 0.7 }} />
                  <Text fw={600} size="sm" c="dimmed">Método de Ingreso:</Text>
                  <Text size="sm">{donacion.metodo_ingreso || "Sin especificar"}</Text>
                </Group>

                {donacion.referencia && (
                  <Group gap="xs">
                    <IconFileText size={18} style={{ opacity: 0.7 }} />
                    <Text fw={600} size="sm" c="dimmed">Referencia:</Text>
                    <Text size="sm" fw={600}>{donacion.referencia}</Text>
                  </Group>
                )}
              </Stack>
            </Grid.Col>

            {/* Columna 2: Importe y Equivalencias */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Group gap="xs">
                  <Text fw={600} size="sm" c="dimmed">Monto u Objeto:</Text>
                  <Text fw={700} size="sm">{donacion.monto_o_cantidad}</Text>
                </Group>

                <Group gap="xs">
                  <Text fw={600} size="sm" c="dimmed">Moneda Original:</Text>
                  <Badge variant="outline" color="blue">
                    {donacion.moneda || "USD"}
                  </Badge>
                  {donacion.monto_original != null && (
                    <Text size="sm" fw={600}>
                      {donacion.monto_original.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </Text>
                  )}
                </Group>

                {donacion.tasa_cambio != null && donacion.moneda !== "USD" && (
                  <Group gap="xs">
                    <Text fw={600} size="sm" c="dimmed">Tasa Aplicada:</Text>
                    <Text size="sm">{donacion.tasa_cambio} {donacion.moneda}/USD</Text>
                  </Group>
                )}

                {donacion.monto_equivalente_usd != null && (
                  <Group gap="xs">
                    <Text fw={600} size="sm" c="dimmed">Equivalente USD:</Text>
                    <Text fw={800} size="md" c="teal">
                      ${donacion.monto_equivalente_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                    </Text>
                  </Group>
                )}

                {donacion.catalogo_ayudas && (
                  <Group gap="xs">
                    <Text fw={600} size="sm" c="dimmed">Categoría Ayuda:</Text>
                    <Badge variant="dot">{donacion.catalogo_ayudas.nombre_articulo}</Badge>
                  </Group>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {donacion.observaciones && (
          <Paper p="xs" radius="sm" withBorder style={{ backgroundColor: "var(--anican-bg)" }}>
            <Text fw={600} size="xs" c="dimmed" mb={2}>Observaciones / Detalle:</Text>
            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{donacion.observaciones}</Text>
          </Paper>
        )}

        <Divider />

        {/* Sección de acciones si está en estado Pendiente */}
        {donacion.estado === "Pendiente" ? (
          <Stack gap="xs">
            {showRechazarInput && (
              <Textarea
                placeholder="Indique la razón o motivo del rechazo (opcional)"
                label="Motivo del Rechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.currentTarget.value)}
                rows={2}
                autosize
              />
            )}

            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={handleModalClose} disabled={loadingAprobar || loadingRechazar}>
                Cancelar
              </Button>

              {!showRechazarInput ? (
                <Button
                  color="red"
                  variant="light"
                  leftSection={<IconX size={16} />}
                  onClick={() => setShowRechazarInput(true)}
                  disabled={loadingAprobar}
                >
                  Rechazar Donación
                </Button>
              ) : (
                <Button
                  color="red"
                  leftSection={<IconAlertTriangle size={16} />}
                  onClick={handleRechazarSubmit}
                  loading={loadingRechazar}
                >
                  Confirmar Rechazo
                </Button>
              )}

              <Button
                color="teal"
                leftSection={<IconCheck size={16} />}
                onClick={handleAprobarSubmit}
                loading={loadingAprobar}
              >
                Aprobar e Ingresar
              </Button>
            </Group>
          </Stack>
        ) : (
          <Group justify="flex-end">
            <Button variant="default" onClick={handleModalClose}>
              Cerrar
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};
