import { Stack, Title, Text, Card, Divider, Group, SegmentedControl, useMantineColorScheme, type MantineColorScheme } from "@mantine/core";

export function SettingsView() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

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
    </Stack>
  );
}
