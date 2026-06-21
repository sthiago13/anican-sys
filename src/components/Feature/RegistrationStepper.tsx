import React, { useState } from 'react';
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
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconUser,
  IconStethoscope,
  IconCheck,
  IconAlertCircle,
  IconId,
  IconPhone,
  IconHome,
  IconCalendar,
} from '@tabler/icons-react';
import { Button } from '../UI/Button';
import type { Representante, Paciente } from './PatientTable';

import '@mantine/dates/styles.css';

export interface RegistrationStepperProps {
  onRegistrationComplete: (representante: Omit<Representante, 'id' | 'created_at'>, paciente: Omit<Paciente, 'id' | 'id_representante' | 'created_at'>) => void;
}

export const RegistrationStepper: React.FC<RegistrationStepperProps> = ({
  onRegistrationComplete,
}) => {
  const [active, setActive] = useState(0);
  const [success, setSuccess] = useState(false);

  // Paso 1: Representante (alineado a tabla `representantes`)
  const [cedula, setCedula] = useState('');
  const [repNombres, setRepNombres] = useState('');
  const [telefono1, setTelefono1] = useState('');
  const [telefono2, setTelefono2] = useState('');
  const [residencia, setResidencia] = useState('');

  // Paso 2: Paciente (alineado a tabla `pacientes`)
  const [pacNombres, setPacNombres] = useState('');
  const [pacApellidos, setPacApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [sexo, setSexo] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>('Activo');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!cedula.trim()) newErrors.cedula = 'La cédula es obligatoria';
    if (!repNombres.trim()) newErrors.repNombres = 'El nombre es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!pacNombres.trim()) newErrors.pacNombres = 'Los nombres son obligatorios';
    if (!pacApellidos.trim()) newErrors.pacApellidos = 'Los apellidos son obligatorios';
    if (!fechaNacimiento) newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
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

  const handleSubmit = () => {
    const representanteData: Omit<Representante, 'id' | 'created_at'> = {
      cedula: cedula.trim(),
      nombres: repNombres.trim(),
      telefono_1: telefono1.trim() || undefined,
      telefono_2: telefono2.trim() || undefined,
      residencia: residencia.trim() || undefined,
    };

    const pacienteData: Omit<Paciente, 'id' | 'id_representante' | 'created_at'> = {
      nombres: pacNombres.trim(),
      apellidos: pacApellidos.trim(),
      fecha_nacimiento: fechaNacimiento ? fechaNacimiento.toISOString().split('T')[0] : '',
      diagnostico: diagnostico.trim() || undefined,
      sexo: sexo || undefined,
      estado: (estado as Paciente['estado']) || 'Activo',
    };

    onRegistrationComplete(representanteData, pacienteData);
    setSuccess(true);

    // Reset form after delay
    setTimeout(() => {
      setActive(0);
      setSuccess(false);
      setCedula('');
      setRepNombres('');
      setTelefono1('');
      setTelefono2('');
      setResidencia('');
      setPacNombres('');
      setPacApellidos('');
      setFechaNacimiento(null);
      setDiagnostico('');
      setSexo(null);
      setEstado('Activo');
    }, 3000);
  };

  if (success) {
    return (
      <Card
        withBorder
        radius="md"
        p="xl"
        shadow="sm"
        style={{ maxWidth: 600, margin: '0 auto' }}
        className="anican-fade-in"
      >
        <Stack align="center" gap="md" py="xl">
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38a169, #48bb78)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCheck size={32} color="#fff" stroke={2.5} />
          </Box>
          <Title order={3} c="var(--anican-azul-oscuro)">
            ¡Registro Exitoso!
          </Title>
          <Text c="dimmed" ta="center">
            El representante y el paciente han sido registrados correctamente en el sistema.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="xl" className="anican-fade-in">
      <div>
        <Title order={1} style={{ letterSpacing: -1, color: 'var(--anican-azul-oscuro)' }}>
          Nuevo Registro
        </Title>
        <Text c="dimmed">
          Registra un representante y su paciente en el sistema Anican
        </Text>
      </div>

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
          {/* =============================================
              PASO 1: Datos del Representante
              ============================================= */}
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
                Ingresa los datos del padre, madre o tutor legal del paciente. Estos datos son
                requeridos para el registro.
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
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
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
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
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
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
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
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
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
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
                      input: { borderRadius: 8 },
                    }}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Stepper.Step>

          {/* =============================================
              PASO 2: Datos del Paciente
              ============================================= */}
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
                Ingresa los datos del niño o niña. Este paciente se vinculará automáticamente al
                representante registrado en el paso anterior.
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
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
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
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
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
                    //revisar
                    onChange={(date) => {
                      setFechaNacimiento(date ? new Date(date) : null);
                    }}
                    maxDate={new Date()}
                    error={errors.fechaNacimiento}
                    styles={{
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
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
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
                      input: { borderRadius: 8 },
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Sexo"
                    placeholder="Seleccionar"
                    data={[
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Femenino', label: 'Femenino' },
                    ]}
                    value={sexo}
                    onChange={(value) => setSexo(value)}
                    styles={{
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
                      input: { borderRadius: 8 },
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Estado"
                    placeholder="Seleccionar"
                    data={[
                      { value: 'Activo', label: 'Activo' },
                      { value: 'Inactivo', label: 'Inactivo' },
                      { value: 'Fallecido', label: 'Fallecido' },
                    ]}
                    value={estado}
                    onChange={(value) => setEstado(value)}
                    styles={{
                      label: { fontWeight: 600, marginBottom: 4, color: 'var(--anican-azul-oscuro)' },
                      input: { borderRadius: 8 },
                    }}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Stepper.Step>

          {/* =============================================
              PASO 3: Confirmación / Resumen
              ============================================= */}
          <Stepper.Completed>
            <Stack gap="md" mt="xl">
              <Alert
                icon={<IconCheck size={16} />}
                color="teal"
                variant="light"
                title="Resumen del Registro"
              >
                Verifica que los datos sean correctos antes de confirmar el registro.
              </Alert>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder radius="md" p="md" shadow="xs">
                    <Title order={5} c="var(--anican-azul-oscuro)" mb="sm">
                      Representante
                    </Title>
                    <Divider mb="sm" />
                    <Stack gap={6}>
                      <Group gap="xs">
                        <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 80 }}>Cédula:</Text>
                        <Text size="sm">{cedula}</Text>
                      </Group>
                      <Group gap="xs">
                        <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 80 }}>Nombres:</Text>
                        <Text size="sm">{repNombres}</Text>
                      </Group>
                      {telefono1 && (
                        <Group gap="xs">
                          <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 80 }}>Teléfono 1:</Text>
                          <Text size="sm">{telefono1}</Text>
                        </Group>
                      )}
                      {telefono2 && (
                        <Group gap="xs">
                          <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 80 }}>Teléfono 2:</Text>
                          <Text size="sm">{telefono2}</Text>
                        </Group>
                      )}
                      {residencia && (
                        <Group gap="xs">
                          <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 80 }}>Residencia:</Text>
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
                        <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 100 }}>Nombres:</Text>
                        <Text size="sm">{pacNombres} {pacApellidos}</Text>
                      </Group>
                      <Group gap="xs">
                        <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 100 }}>Fecha Nac.:</Text>
                        <Text size="sm">{fechaNacimiento?.toLocaleDateString('es-VE') || '—'}</Text>
                      </Group>
                      {diagnostico && (
                        <Group gap="xs">
                          <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 100 }}>Diagnóstico:</Text>
                          <Text size="sm">{diagnostico}</Text>
                        </Group>
                      )}
                      <Group gap="xs">
                        <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 100 }}>Sexo:</Text>
                        <Text size="sm">{sexo || '—'}</Text>
                      </Group>
                      <Group gap="xs">
                        <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 100 }}>Estado:</Text>
                        <Text size="sm">{estado || 'Activo'}</Text>
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            </Stack>
          </Stepper.Completed>
        </Stepper>

        <Divider my="xl" />

        {/* Navigation Buttons */}
        <Group justify="space-between">
          <Button
            variant="outline"
            color="gray"
            onClick={handleBack}
            disabled={active === 0}
          >
            Anterior
          </Button>

          {active < 2 ? (
            <Button onClick={handleNext}>
              Siguiente
            </Button>
          ) : (
            <Button
              color="teal"
              leftSection={<IconCheck size={16} />}
              onClick={handleSubmit}
            >
              Confirmar Registro
            </Button>
          )}
        </Group>
      </Card>
    </Stack>
  );
};
