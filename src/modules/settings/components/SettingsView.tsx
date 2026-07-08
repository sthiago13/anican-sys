import { useState, useEffect } from "react";
import {
  Stack,
  Title,
  Text,
  Card,
  Divider,
  Group,
  SegmentedControl,
  useMantineColorScheme,
  type MantineColorScheme,
  NumberInput,
  Alert,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconCoins } from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { useRates } from "../../donations/hooks/useRates";
import { useAuth } from "../../auth/hooks/useAuth";

export function SettingsView() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { perfil } = useAuth();
  const { rates, loading: loadingRates, updateTodayRates } = useRates();

  const [tasaVes, setTasaVes] = useState<number | string>("");
  const [tasaCop, setTasaCop] = useState<number | string>("");
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const esAdministrador = perfil?.rol === "Administrador";

  useEffect(() => {
    if (rates) {
      setTasaVes(rates.tasa_ves);
      setTasaCop(rates.tasa_cop);
    }
  }, [rates]);

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esAdministrador) return;
    
    const numVes = Number(tasaVes);
    const numCop = Number(tasaCop);

    if (isNaN(numVes) || numVes <= 0 || isNaN(numCop) || numCop <= 0) {
      setErrorMsg("Las tasas de cambio deben ser mayores que cero.");
      setSuccessMsg(null);
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateTodayRates(numVes, numCop);
      setSuccessMsg("Tasas de cambio actualizadas con éxito para el día de hoy.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al actualizar las tasas de cambio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="xl" className="anican-fade-in">
      <div>
        <Title
          order={1}
          style={{
            letterSpacing: -1,
            color: "var(--anican-azul-oscuro)",
          }}
        >
          Configuración del Sistema
        </Title>
        <Text c="dimmed">
          Ajustes generales del panel administrativo de Anican
        </Text>
      </div>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Stack gap="md">
          <Title order={4} c="var(--anican-azul-oscuro)">
            Preferencias Generales
          </Title>
          <Text size="sm" c="dimmed">
            El sistema está configurado en español. Gestión de pacientes
            pediátricos oncológicos y sus representantes legales.
          </Text>
          <Divider />
          <Group justify="space-between">
            <div>
              <Text fw={600} c="var(--anican-azul-oscuro)">
                Tema del Sistema
              </Text>
              <Text size="xs" c="dimmed">
                Cambiar la apariencia de la interfaz
              </Text>
            </div>
            <SegmentedControl
              value={colorScheme}
              onChange={(value) => setColorScheme(value as MantineColorScheme)}
              data={[
                { label: "Claro", value: "light" },
                { label: "Oscuro", value: "dark" },
                { label: "Sistema", value: "auto" },
              ]}
              color="orange"
            />
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Stack gap="md">
          <Group gap="xs">
            <IconCoins size={20} style={{ color: "var(--anican-naranja)" }} />
            <Title order={4} c="var(--anican-azul-oscuro)">
              Tasas de Cambio de Hoy (VES / COP)
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            Las tasas se sincronizan automáticamente una vez al día con la API de cambio oficial. 
            {esAdministrador 
              ? " Como Administrador, puedes corregir estos valores manualmente si es necesario para los registros de hoy." 
              : " Solo los Administradores pueden modificar manualmente estos valores."}
          </Text>
          <Divider />

          {successMsg && (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light" withCloseButton onClose={() => setSuccessMsg(null)}>
              {successMsg}
            </Alert>
          )}

          {errorMsg && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" withCloseButton onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSaveRates}>
            <Stack gap="md">
              <Group grow>
                <NumberInput
                  label={`Bolívares (${tasaVes} VES = 1 USD)`}
                  placeholder="Ej. 36.50"
                  required
                  min={0.0001}
                  decimalScale={4}
                  disabled={!esAdministrador || loadingRates || saving}
                  value={tasaVes}
                  onChange={(value) => setTasaVes(value)}
                  styles={{
                    label: {
                      fontWeight: 600,
                      color: "var(--anican-azul-oscuro)",
                      marginBottom: 4,
                    },
                    input: { borderRadius: 8 },
                  }}
                />

                <NumberInput
                  label={`Pesos Colombianos (${tasaCop} COP = 1 USD)`}
                  placeholder="Ej. 4000"
                  required
                  min={0.0001}
                  decimalScale={4}
                  disabled={!esAdministrador || loadingRates || saving}
                  value={tasaCop}
                  onChange={(value) => setTasaCop(value)}
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

              {esAdministrador && (
                <Group justify="flex-end" mt="xs">
                  <Button type="submit" loading={saving || loadingRates}>
                    Guardar Tasas
                  </Button>
                </Group>
              )}
            </Stack>
          </form>
        </Stack>
      </Card>
    </Stack>
  );
}

