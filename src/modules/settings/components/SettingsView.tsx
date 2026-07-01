import { Stack, Title, Text, Card, Divider, Group } from "@mantine/core";
import { Button } from "../../../components/UI/Button";

export function SettingsView() {
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
            <Button variant="outline" color="gray" disabled>
              Tema Claro (Predeterminado)
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
