import React, { useState, useEffect } from "react";
import {
  Modal,
  Tabs,
  TextInput,
  Textarea,
  Select,
  Group,
  Stack,
  Grid,
  Alert,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconUser,
  IconId,
  IconPhone,
  IconHome,
  IconCalendar,
  IconStethoscope,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import type { Paciente, Representante, Diagnostico } from "../types";
import { formatLocalDate, normalizeDateInput } from "../../../utils/date";

import "@mantine/dates/styles.css";

interface EditPatientModalProps {
  opened: boolean;
  onClose: () => void;
  paciente: Paciente | null;
  representante: Representante | null;
  diagnosticos: Diagnostico[];
  onSave: (
    pacienteId: string,
    pacienteData: {
      nombres: string;
      apellidos: string;
      fecha_nacimiento: string;
      id_diagnostico?: string;
      sexo?: string;
      estado: Paciente["estado"];
    },
    representanteId: string,
    representanteData: {
      cedula: string;
      nombres: string;
      telefono_1?: string;
      telefono_2?: string;
      residencia?: string;
    },
  ) => Promise<void>;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  opened,
  onClose,
  paciente,
  representante,
  diagnosticos,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>("paciente");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Representante
  const [cedula, setCedula] = useState("");
  const [repNombres, setRepNombres] = useState("");
  const [telefono1, setTelefono1] = useState("");
  const [telefono2, setTelefono2] = useState("");
  const [residencia, setResidencia] = useState("");

  // Paciente
  const [pacNombres, setPacNombres] = useState("");
  const [pacApellidos, setPacApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [sexo, setSexo] = useState<string | null>(null);
  const [estado, setEstado] = useState<Paciente["estado"]>("Activo");

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (paciente) {
      setPacNombres(paciente.nombres || "");
      setPacApellidos(paciente.apellidos || "");
      if (paciente.fecha_nacimiento) {
        const [year, month, day] = paciente.fecha_nacimiento.split("-").map(Number);
        setFechaNacimiento(new Date(year, month - 1, day, 12, 0, 0, 0));
      } else {
        setFechaNacimiento(null);
      }
      setDiagnostico(paciente.id_diagnostico || "");
      setSexo(paciente.sexo || null);
      setEstado(paciente.estado || "Activo");
    }
    if (representante) {
      setCedula(representante.cedula || "");
      setRepNombres(representante.nombres || "");
      setTelefono1(representante.telefono_1 || "");
      setTelefono2(representante.telefono_2 || "");
      setResidencia(representante.residencia || "");
    }
    setErrors({});
    setError(null);
    setActiveTab("paciente");
  }, [paciente, representante, opened]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Representante validation
    if (!cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
    if (!repNombres.trim())
      newErrors.repNombres = "El nombre del representante es obligatorio";

    // Paciente validation
    if (!pacNombres.trim())
      newErrors.pacNombres = "Los nombres son obligatorios";
    if (!pacApellidos.trim())
      newErrors.pacApellidos = "Los apellidos son obligatorios";
    if (!fechaNacimiento)
      newErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (
        newErrors.pacNombres ||
        newErrors.pacApellidos ||
        newErrors.fechaNacimiento
      ) {
        setActiveTab("paciente");
      } else {
        setActiveTab("representante");
      }
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate() || !paciente || !representante) return;
    setLoading(true);
    setError(null);
    try {
      const fechaNacStr = fechaNacimiento
        ? formatLocalDate(fechaNacimiento)
        : "";

      await onSave(
        paciente.id,
        {
          nombres: pacNombres,
          apellidos: pacApellidos,
          fecha_nacimiento: fechaNacStr,
          id_diagnostico: diagnostico || undefined,
          sexo: sexo || undefined,
          estado,
        },
        representante.id,
        {
          cedula,
          nombres: repNombres,
          telefono_1: telefono1,
          telefono_2: telefono2,
          residencia,
        },
      );
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al guardar los cambios.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Editar Expediente de Paciente"
      size="lg"
      centered
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      transitionProps={{ transition: "fade", duration: 200 }}
    >
      <Stack gap="md">
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error al Guardar"
            color="red"
            variant="light"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={setActiveTab} color="orange">
          <Tabs.List>
            <Tabs.Tab
              value="paciente"
              leftSection={<IconStethoscope size={16} />}
            >
              Paciente
            </Tabs.Tab>
            <Tabs.Tab
              value="representante"
              leftSection={<IconUser size={16} />}
            >
              Representante
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="paciente" pt="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Nombres"
                  placeholder="Carlos Andrés"
                  required
                  value={pacNombres}
                  onChange={(e) => setPacNombres(e.target.value)}
                  error={errors.pacNombres}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Apellidos"
                  placeholder="García López"
                  required
                  value={pacApellidos}
                  onChange={(e) => setPacApellidos(e.target.value)}
                  error={errors.pacApellidos}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateInput
                  label="Fecha de Nacimiento"
                  placeholder="Selecciona una fecha"
                  required
                  leftSection={<IconCalendar size={16} stroke={1.5} />}
                  value={fechaNacimiento}
                  onChange={(date) => setFechaNacimiento(normalizeDateInput(date))}
                  maxDate={new Date()}
                  error={errors.fechaNacimiento}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Diagnóstico"
                  placeholder="Seleccionar diagnóstico"
                  value={diagnostico}
                  onChange={(val) => setDiagnostico(val || "")}
                  data={diagnosticos.map((d) => ({ value: d.id, label: d.nombre }))}
                  searchable
                  clearable
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Sexo"
                  placeholder="Seleccionar"
                  data={[
                    { value: "Masculino", label: "Masculino" },
                    { value: "Femenino", label: "Femenino" },
                  ]}
                  value={sexo}
                  onChange={(value) => setSexo(value)}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Estado"
                  placeholder="Seleccionar"
                  data={[
                    { value: "Activo", label: "Activo" },
                    { value: "Inactivo", label: "Inactivo" },
                    { value: "Fallecido", label: "Fallecido" },
                  ]}
                  value={estado}
                  onChange={(value) => setEstado(value as Paciente["estado"])}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="representante" pt="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Cédula de Identidad"
                  placeholder="V-12345678"
                  required
                  leftSection={<IconId size={16} stroke={1.5} />}
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  error={errors.cedula}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Nombres Completos"
                  placeholder="María García"
                  required
                  leftSection={<IconUser size={16} stroke={1.5} />}
                  value={repNombres}
                  onChange={(e) => setRepNombres(e.target.value)}
                  error={errors.repNombres}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Teléfono Principal"
                  placeholder="+58 412-1234567"
                  leftSection={<IconPhone size={16} stroke={1.5} />}
                  value={telefono1}
                  onChange={(e) => setTelefono1(e.target.value)}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Teléfono Secundario"
                  placeholder="+58 424-7654321"
                  leftSection={<IconPhone size={16} stroke={1.5} />}
                  value={telefono2}
                  onChange={(e) => setTelefono2(e.target.value)}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Residencia"
                  placeholder="Dirección completa del representante"
                  leftSection={<IconHome size={16} stroke={1.5} />}
                  value={residencia}
                  onChange={(e) => setResidencia(e.target.value)}
                  minRows={2}
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--anican-azul-oscuro)",
                    },
                    input: { borderRadius: 8 },
                  }}
                />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="md">
          <Button
            variant="outline"
            color="gray"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={loading}>
            Guardar Cambios
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
