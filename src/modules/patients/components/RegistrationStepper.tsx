import React, { useState } from "react";
import {
  Stepper,
  TextInput,
  Textarea,
  Select,
  Group,
  Stack,
  Title,
  Text,
  Card,
  Alert,
  Box,
  Divider,
  Grid,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconUser,
  IconStethoscope,
  IconCheck,
  IconAlertCircle,
  IconId,
  IconPhone,
  IconHome,
  IconCalendar,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/UI/Button";
import type { Representante } from "./PatientTable";
import { supabase } from "../../../config/supabase";

import "@mantine/dates/styles.css";

export const RegistrationStepper: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Paso 1: Representante
  const [cedula, setCedula] = useState("");
  const [repNombres, setRepNombres] = useState("");
  const [telefono1, setTelefono1] = useState("");
  const [telefono2, setTelefono2] = useState("");
  const [residencia, setResidencia] = useState("");

  // Paso 2: Paciente
  const [pacNombres, setPacNombres] = useState("");
  const [pacApellidos, setPacApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [sexo, setSexo] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>("Activo");

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
    if (!repNombres.trim()) newErrors.repNombres = "El nombre es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!pacNombres.trim())
      newErrors.pacNombres = "Los nombres son obligatorios";
    if (!pacApellidos.trim())
      newErrors.pacApellidos = "Los apellidos son obligatorios";
    if (!fechaNacimiento)
      newErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (active === 0 && validateStep1()) {
      setActive(1);
      setErrors({});
    } else if (active === 1 && validateStep2()) {
      setActive(2);
      setErrors({});
    }
  };

  const handleBack = () => {
    setActive((prev) => Math.max(0, prev - 1));
    setErrors({});
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setLoading(true);

    const representanteData = {
      cedula: cedula.trim(),
      nombres: repNombres.trim(),
      telefono_1: telefono1.trim() || null,
      telefono_2: telefono2.trim() || null,
      residencia: residencia.trim() || null,
    };

    let insertedRep: Representante | null = null;

    try {
      const { data: repData, error: repError } = await supabase
        .from("representantes")
        .insert([representanteData])
        .select()
        .single();

      if (repError) {
        throw new Error(`Error al registrar el representante: ${repError.message}`);
      }

      if (!repData) {
        throw new Error("No se recibió la confirmación del representante registrado.");
      }

      insertedRep = repData as Representante;

      const fechaNacStr = fechaNacimiento ? fechaNacimiento.toISOString().split("T")[0] : "";
      const pacienteData = {
        nombres: pacNombres.trim(),
        apellidos: pacApellidos.trim(),
        fecha_nacimiento: fechaNacStr,
        diagnostico: diagnostico.trim() || null,
        sexo: sexo || null,
        estado: estado || "Activo",
        id_representante: insertedRep.id,
      };

      const { data: pacData, error: pacError } = await supabase
        .from("pacientes")
        .insert([pacienteData])
        .select()
        .single();

      if (pacError) {
        throw pacError;
      }

      if (!pacData) {
        throw new Error("No se recibió la confirmación del paciente registrado.");
      }
      setSuccess(true);

      setTimeout(() => {
        navigate("/pacientes");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error en el proceso de registro:", err);

      if (insertedRep && insertedRep.id) {
        try {
          await supabase.from("representantes").delete().eq("id", insertedRep.id);
        } catch (cleanupErr) {
          console.error("Error al limpiar el representante huérfano:", cleanupErr);
        }
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al guardar los datos.";
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card
        withBorder
        radius="md"
        p="xl"
        shadow="sm"
        style={{ maxWidth: 600, margin: "0 auto" }}
        className="anican-fade-in"
      >
        <Stack align="center" gap="md" py="xl">
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #38a169, #48bb78)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCheck size={32} color="#fff" stroke={2.5} />
          </Box>
          <Title order={3} c="var(--anican-azul-oscuro)">
            ¡Registro Exitoso!
          </Title>
          <Text c="dimmed" ta="center">
            El representante y el paciente han sido registrados correctamente en el sistema.
            Redirigiendo...
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="xl" className="anican-fade-in">
      <div>
        <Title
          order={1}
          style={{ letterSpacing: -1, color: "var(--anican-azul-oscuro)" }}
        >
          Nuevo Registro
        </Title>
        <Text c="dimmed">
          Registra un representante y su paciente en el sistema Anican
        </Text>
      </div>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error en el Registro"
          color="red"
          variant="light"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Card withBorder radius="md" p="xl" shadow="sm">
        <Stepper
          active={active}
          color="orange"
          className="anican-stepper"
          styles={{
            stepLabel: { fontWeight: 600 },
            stepDescription: { fontSize: 12 },
          }}
        >
          <Stepper.Step
            label="Representante"
            description="Datos del tutor legal"
            icon={<IconUser size={18} />}
          >
            <Stack gap="md" mt="xl">
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="blue"
                variant="light"
                title="Datos del Representante"
              >
                Ingresa los datos del padre, madre o tutor legal del paciente.
                Estos datos son requeridos para el registro.
              </Alert>

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
            </Stack>
          </Stepper.Step>

          <Stepper.Step
            label="Paciente"
            description="Datos del niño(a)"
            icon={<IconStethoscope size={18} />}
          >
            <Stack gap="md" mt="xl">
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="orange"
                variant="light"
                title="Datos del Paciente"
              >
                Ingresa los datos del niño o niña. Este paciente se vinculará
                automáticamente al representante registrado en el paso anterior.
              </Alert>

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
                    onChange={(date) => {
                      setFechaNacimiento(date ? new Date(date) : null);
                    }}
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
                  <TextInput
                    label="Diagnóstico"
                    placeholder="Ej. Leucemia Linfoblástica Aguda"
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
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
                    onChange={(value) => setEstado(value)}
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
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Stack gap="md" mt="xl">
              <Alert
                icon={<IconCheck size={16} />}
                color="teal"
                variant="light"
                title="Resumen del Registro"
              >
                Verifica que los datos sean correctos antes de confirmar el
                registro.
              </Alert>

              {submitError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  variant="light"
                  title="Error de Registro"
                >
                  {submitError}
                </Alert>
              )}

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder radius="md" p="md" shadow="xs">
                    <Title order={5} c="var(--anican-azul-oscuro)" mb="sm">
                      Representante
                    </Title>
                    <Divider mb="sm" />
                    <Stack gap={6}>
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={600}
                          c="dimmed"
                          style={{ minWidth: 80 }}
                        >
                          Cédula:
                        </Text>
                        <Text size="sm">{cedula}</Text>
                      </Group>
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={600}
                          c="dimmed"
                          style={{ minWidth: 80 }}
                        >
                          Nombres:
                        </Text>
                        <Text size="sm">{repNombres}</Text>
                      </Group>
                      {telefono1 && (
                        <Group gap="xs">
                          <Text
                            size="sm"
                            fw={600}
                            c="dimmed"
                            style={{ minWidth: 80 }}
                          >
                            Teléfono 1:
                          </Text>
                          <Text size="sm">{telefono1}</Text>
                        </Group>
                      )}
                      {telefono2 && (
                        <Group gap="xs">
                          <Text
                            size="sm"
                            fw={600}
                            c="dimmed"
                            style={{ minWidth: 80 }}
                          >
                            Teléfono 2:
                          </Text>
                          <Text size="sm">{telefono2}</Text>
                        </Group>
                      )}
                      {residencia && (
                        <Group gap="xs">
                          <Text
                            size="sm"
                            fw={600}
                            c="dimmed"
                            style={{ minWidth: 80 }}
                          >
                            Residencia:
                          </Text>
                          <Text size="sm">{residencia}</Text>
                        </Group>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder radius="md" p="md" shadow="xs">
                    <Title order={5} c="var(--anican-azul-oscuro)" mb="sm">
                      Paciente
                    </Title>
                    <Divider mb="sm" />
                    <Stack gap={6}>
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={600}
                          c="dimmed"
                          style={{ minWidth: 100 }}
                        >
                          Nombres:
                        </Text>
                        <Text size="sm">
                          {pacNombres} {pacApellidos}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={600}
                          c="dimmed"
                          style={{ minWidth: 100 }}
                        >
                          Fecha Nac.:
                        </Text>
                        <Text size="sm">
                          {fechaNacimiento?.toLocaleDateString("es-VE") || "—"}
                        </Text>
                      </Group>
                      {diagnostico && (
                        <Group gap="xs">
                          <Text
                            size="sm"
                            fw={600}
                            c="dimmed"
                            style={{ minWidth: 100 }}
                          >
                            Diagnóstico:
                          </Text>
                          <Text size="sm">{diagnostico}</Text>
                        </Group>
                      )}
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={600}
                          c="dimmed"
                          style={{ minWidth: 100 }}
                        >
                          Sexo:
                        </Text>
                        <Text size="sm">{sexo || "—"}</Text>
                      </Group>
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={600}
                          c="dimmed"
                          style={{ minWidth: 100 }}
                        >
                          Estado:
                        </Text>
                        <Text size="sm">{estado || "Activo"}</Text>
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            </Stack>
          </Stepper.Completed>
        </Stepper>

        <Divider my="xl" />

        <Group justify="space-between">
          <Button
            variant="outline"
            color="gray"
            onClick={handleBack}
            disabled={active === 0 || loading}
          >
            Anterior
          </Button>

          {active < 2 ? (
            <Button onClick={handleNext} disabled={loading}>
              Siguiente
            </Button>
          ) : (
            <Button
              color="teal"
              leftSection={!loading && <IconCheck size={16} />}
              onClick={handleSubmit}
              loading={loading}
            >
              Confirmar Registro
            </Button>
          )}
        </Group>
      </Card>
    </Stack>
  );
};
