import React, { useState, useEffect } from "react";
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
  Checkbox,
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
import { type Representante, type Diagnostico } from "../types";
import { supabase } from "../../../config/supabase";
import { formatLocalDate, normalizeDateInput } from "../../../utils/date";
import { RepresentativeModal } from "../../representatives/components/RepresentativeModal";

import "@mantine/dates/styles.css";

export const RegistrationStepper: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Catálogo de diagnósticos y representantes
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [representantesList, setRepresentantesList] = useState<Representante[]>([]);

  useEffect(() => {
    const fetchDiagnosticos = async () => {
      const { data, error } = await supabase
        .from("diagnosticos")
        .select("*")
        .order("nombre", { ascending: true });
      if (!error && data) {
        setDiagnosticos(data as Diagnostico[]);
      }
    };
    const fetchRepresentantes = async () => {
      const { data, error } = await supabase
        .from("representantes")
        .select("*")
        .order("nombres", { ascending: true });
      if (!error && data) {
        setRepresentantesList(data as Representante[]);
      }
    };
    void fetchDiagnosticos();
    void fetchRepresentantes();
  }, []);

  // Paso 1: Representante
  const [cedula, setCedula] = useState("");
  const [repNombres, setRepNombres] = useState("");
  const [telefono1, setTelefono1] = useState("");
  const [telefono2, setTelefono2] = useState("");
  const [residencia, setResidencia] = useState("");

  // Estado para asociar representante existente
  const [isExistingRepresentative, setIsExistingRepresentative] = useState(false);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [editModalOpened, setEditModalOpened] = useState(false);

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
    if (isExistingRepresentative) {
      if (!selectedRepId) {
        newErrors.selectedRepId = "Debe seleccionar un representante registrado";
      }
    } else {
      if (!cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
      if (!repNombres.trim()) newErrors.repNombres = "El nombre es obligatorio";
    }
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

    let finalRepId = selectedRepId;
    let insertedRep: Representante | null = null;

    try {
      // 1. Si no es un representante existente, lo creamos
      if (!isExistingRepresentative) {
        const representanteData = {
          cedula: cedula.trim(),
          nombres: repNombres.trim(),
          telefono_1: telefono1.trim() || null,
          telefono_2: telefono2.trim() || null,
          residencia: residencia.trim() || null,
        };

        const { data: repData, error: repError } = await supabase
          .from("representantes")
          .insert([representanteData])
          .select()
          .single();

        if (repError) {
          throw new Error(
            `Error al registrar el representante: ${repError.message}`,
          );
        }

        if (!repData) {
          throw new Error(
            "No se recibió la confirmación del representante registrado.",
          );
        }

        insertedRep = repData as Representante;
        finalRepId = insertedRep.id;
      }

      if (!finalRepId) {
        throw new Error("No se ha definido un representante válido para el paciente.");
      }

      // 2. Registramos el paciente vinculándolo al representante
      const fechaNacStr = fechaNacimiento
        ? formatLocalDate(fechaNacimiento)
        : "";
      const pacienteData = {
        nombres: pacNombres.trim(),
        apellidos: pacApellidos.trim(),
        fecha_nacimiento: fechaNacStr,
        id_diagnostico: diagnostico || null,
        sexo: sexo || null,
        estado: estado || "Activo",
        id_representante: finalRepId,
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
        throw new Error(
          "No se recibió la confirmación del paciente registrado.",
        );
      }
      setSuccess(true);

      setTimeout(() => {
        navigate("/pacientes");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error en el proceso de registro:", err);

      // Si creamos un representante en este intento, lo limpiamos para no dejar huérfanos
      if (!isExistingRepresentative && insertedRep && insertedRep.id) {
        try {
          await supabase
            .from("representantes")
            .delete()
            .eq("id", insertedRep.id);
        } catch (cleanupErr) {
          console.error(
            "Error al limpiar el representante huérfano:",
            cleanupErr,
          );
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
            El representante y el paciente han sido registrados correctamente en
            el sistema. Redirigiendo...
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

              <Checkbox
                label="¿El representante ya está registrado en el sistema?"
                checked={isExistingRepresentative}
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  setIsExistingRepresentative(checked);
                  setSelectedRepId(null);
                  setCedula("");
                  setRepNombres("");
                  setTelefono1("");
                  setTelefono2("");
                  setResidencia("");
                  setErrors({});
                }}
                styles={{
                  label: {
                    fontWeight: 600,
                    color: "var(--anican-azul-oscuro)",
                  },
                }}
              />

              {isExistingRepresentative && (
                <Stack gap="xs">
                  <Select
                    label="Buscar Representante Registrado"
                    placeholder="Escribe la cédula o el nombre del representante"
                    data={representantesList.map((r) => ({
                      value: r.id,
                      label: `${r.cedula} - ${r.nombres}`,
                    }))}
                    value={selectedRepId}
                    onChange={(val) => {
                      setSelectedRepId(val);
                      const rep = representantesList.find((r) => r.id === val);
                      if (rep) {
                        setCedula(rep.cedula || "");
                        setRepNombres(rep.nombres || "");
                        setTelefono1(rep.telefono_1 || "");
                        setTelefono2(rep.telefono_2 || "");
                        setResidencia(rep.residencia || "");
                      } else {
                        setCedula("");
                        setRepNombres("");
                        setTelefono1("");
                        setTelefono2("");
                        setResidencia("");
                      }
                      setErrors({});
                    }}
                    searchable
                    clearable
                    error={errors.selectedRepId}
                    nothingFoundMessage="No se encontraron representantes con ese criterio"
                    styles={{
                      label: {
                        fontWeight: 600,
                        marginBottom: 4,
                        color: "var(--anican-azul-oscuro)",
                      },
                      input: { borderRadius: 8 },
                    }}
                  />
                  {selectedRepId && (
                    <Group justify="flex-end">
                      <Button
                        variant="subtle"
                        size="xs"
                        color="orange"
                        onClick={() => setEditModalOpened(true)}
                        styles={{
                          root: {
                            height: 28,
                            padding: "0 8px",
                          },
                        }}
                      >
                        Editar datos de este representante
                      </Button>
                    </Group>
                  )}
                </Stack>
              )}

              {(!isExistingRepresentative || selectedRepId) && (
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
                      disabled={isExistingRepresentative}
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
                      disabled={isExistingRepresentative}
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
                      disabled={isExistingRepresentative}
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
                      disabled={isExistingRepresentative}
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
                      disabled={isExistingRepresentative}
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
              )}
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
                          <Text size="sm">
                            {diagnosticos.find((d) => d.id === diagnostico)?.nombre || "—"}
                          </Text>
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

      <RepresentativeModal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        onSave={async (repData) => {
          if (!selectedRepId) return;
          const { error } = await supabase
            .from("representantes")
            .update({
              cedula: repData.cedula,
              nombres: repData.nombres,
              telefono_1: repData.telefono_1 || null,
              telefono_2: repData.telefono_2 || null,
              residencia: repData.residencia || null,
            })
            .eq("id", selectedRepId);
          if (error) throw error;

          // Actualizar el estado local representantesList
          setRepresentantesList((prev) =>
            prev.map((r) =>
              r.id === selectedRepId
                ? { ...r, ...repData }
                : r
            )
          );

          // Actualizar los campos visuales en el stepper
          setCedula(repData.cedula);
          setRepNombres(repData.nombres);
          setTelefono1(repData.telefono_1 || "");
          setTelefono2(repData.telefono_2 || "");
          setResidencia(repData.residencia || "");
        }}
        representante={
          representantesList.find((r) => r.id === selectedRepId) || null
        }
      />
    </Stack>
  );
};
