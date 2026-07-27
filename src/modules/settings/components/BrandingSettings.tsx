import React, { useState, useEffect } from 'react';
import {
  Card,
  Paper,
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Textarea,
  Divider,
  Alert,
  FileButton,
  Avatar,
  Badge,
} from '@mantine/core';
import {
  IconBuilding,
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconPhoto,
} from '@tabler/icons-react';
import { Button } from '../../../components/UI/Button';
import { useBranding } from '../hooks/useBranding';
import { useAuth } from '../../auth/hooks/useAuth';

export const BrandingSettings: React.FC = () => {
  const { branding, loading, updateBranding, uploadImage } = useBranding();
  const { perfil } = useAuth();

  const [nombreFundacion, setNombreFundacion] = useState('');
  const [rif, setRif] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefono2, setTelefono2] = useState('');
  const [direccion, setDireccion] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const esAdministrador = perfil?.rol === 'Administrador';

  useEffect(() => {
    if (branding) {
      setNombreFundacion(branding.nombre_fundacion || '');
      setRif(branding.rif || '');
      setCorreo(branding.correo || '');
      setTelefono(branding.telefono || '');
      setTelefono2(branding.telefono_2 || '');
      setDireccion(branding.direccion || '');
    }
  }, [branding]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esAdministrador) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateBranding({
        nombre_fundacion: nombreFundacion.trim(),
        rif: rif.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        telefono_2: telefono2.trim(),
        direccion: direccion.trim(),
      });
      setSuccessMsg('Información institucional de la fundación actualizada con éxito.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los datos institucionales.');
    } finally {
      setSaving(false);
    }
  };

  const validateFile = (file: File, type: 'logo' | 'favicon') => {
    const maxBytes = 3 * 1024 * 1024; // 3 MB
    if (file.size > maxBytes) {
      throw new Error('El archivo excede el tamaño máximo permitido de 3 MB.');
    }

    const allowedTypes =
      type === 'logo'
        ? ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg']
        : ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        type === 'logo'
          ? 'Formato no válido. Se recomienda subir imágenes en formato PNG o SVG con fondo transparente.'
          : 'Formato no válido para favicon. Utilice PNG, ICO o SVG.'
      );
    }
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file || !esAdministrador) return;
    setUploadingLogo(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      validateFile(file, 'logo');
      await uploadImage(file, 'logo');
      setSuccessMsg('Logotipo institucional actualizado exitosamente.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir el logotipo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file: File | null) => {
    if (!file || !esAdministrador) return;
    setUploadingFavicon(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      validateFile(file, 'favicon');
      await uploadImage(file, 'favicon');
      setSuccessMsg('Favicon de la aplicación actualizado exitosamente.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir el favicon.');
    } finally {
      setUploadingFavicon(false);
    }
  };

  return (
    <Card withBorder radius="md" p="lg" shadow="xs">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconBuilding size={22} style={{ color: 'var(--anican-naranja)' }} />
            <Title order={4} c="var(--anican-azul-oscuro)">
              Identidad Institucional (Branding)
            </Title>
          </Group>
          {!esAdministrador && (
            <Badge color="blue" variant="light">
              Modo Lectura
            </Badge>
          )}
        </Group>

        <Text size="sm" c="dimmed">
          Administra el nombre de la fundación, datos de contacto, RIF y logotipos oficiales que se muestran en el panel, Login y membretes de reportes.
        </Text>

        <Divider color="var(--anican-border)" />

        {successMsg && (
          <Alert
            icon={<IconCheck size={16} />}
            color="green"
            variant="light"
            withCloseButton
            onClose={() => setSuccessMsg(null)}
          >
            {successMsg}
          </Alert>
        )}

        {errorMsg && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            withCloseButton
            onClose={() => setErrorMsg(null)}
          >
            {errorMsg}
          </Alert>
        )}

        {/* Sección de Recursos Gráficos (Logotipo & Favicon) */}
        <Group gap="xl" wrap="wrap" align="flex-start" mt="xs">
          {/* Carga de Logotipo */}
          <Paper withBorder p="sm" radius="md" style={{ flex: 1, minWidth: 260 }}>
            <Stack gap="xs" align="center">
              <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
                Logotipo Oficial
              </Text>

              <div
                style={{
                  width: 140,
                  height: 90,
                  borderRadius: 10,
                  border: '1px dashed var(--anican-border)',
                  backgroundColor: 'var(--anican-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: 8,
                }}
              >
                {branding.logo_url ? (
                  <img
                    src={branding.logo_url}
                    alt="Logo Fundación"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Stack gap={2} align="center">
                    <IconPhoto size={28} style={{ color: 'var(--anican-text-muted)' }} />
                    <Text size="xs" c="dimmed">
                      Sin logotipo
                    </Text>
                  </Stack>
                )}
              </div>

              {esAdministrador && (
                <>
                  <FileButton onChange={handleLogoUpload} accept="image/png,image/svg+xml,image/webp,image/jpeg">
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        size="xs"
                        leftSection={<IconUpload size={14} />}
                        loading={uploadingLogo}
                      >
                        Subir Logotipo
                      </Button>
                    )}
                  </FileButton>
                  <Text size="xs" c="dimmed" style={{ textAlign: 'center' }}>
                    Recomendado: PNG o SVG con fondo transparente (Máx. 3MB)
                  </Text>
                </>
              )}
            </Stack>
          </Paper>

          {/* Carga de Favicon */}
          <Paper withBorder p="sm" radius="md" style={{ flex: 1, minWidth: 260 }}>
            <Stack gap="xs" align="center">
              <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
                Favicon del Navegador
              </Text>

              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 10,
                  border: '1px dashed var(--anican-border)',
                  backgroundColor: 'var(--anican-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: 6,
                }}
              >
                {branding.favicon_url ? (
                  <img
                    src={branding.favicon_url}
                    alt="Favicon"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Avatar radius="md" size="md" color="orange">
                    AN
                  </Avatar>
                )}
              </div>

              {esAdministrador && (
                <>
                  <FileButton onChange={handleFaviconUpload} accept="image/png,image/x-icon,image/svg+xml">
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        size="xs"
                        leftSection={<IconUpload size={14} />}
                        loading={uploadingFavicon}
                      >
                        Subir Favicon
                      </Button>
                    )}
                  </FileButton>
                  <Text size="xs" c="dimmed" style={{ textAlign: 'center' }}>
                    Formato: PNG, ICO o SVG (Máx. 3MB)
                  </Text>
                </>
              )}
            </Stack>
          </Paper>
        </Group>

        <Divider color="var(--anican-border)" mt="sm" />

        {/* Formulario de Metadatos Institucionales */}
        <form onSubmit={handleSaveInfo}>
          <Stack gap="md">
            <Group grow wrap="wrap">
              <TextInput
                label="Nombre de la Fundación"
                placeholder="Ej. Fundación Anican"
                required
                disabled={!esAdministrador || loading || saving}
                value={nombreFundacion}
                onChange={(e) => setNombreFundacion(e.target.value)}
                styles={{
                  label: { fontWeight: 600, color: 'var(--anican-azul-oscuro)', marginBottom: 4 },
                  input: { borderRadius: 8 },
                }}
              />

              <TextInput
                label="R.I.F. / Identificación Fiscal"
                placeholder="Ej. J-12345678-9"
                disabled={!esAdministrador || loading || saving}
                value={rif}
                onChange={(e) => setRif(e.target.value)}
                styles={{
                  label: { fontWeight: 600, color: 'var(--anican-azul-oscuro)', marginBottom: 4 },
                  input: { borderRadius: 8 },
                }}
              />
            </Group>

            <TextInput
              label="Correo Institucional"
              placeholder="contacto@anican.org"
              type="email"
              disabled={!esAdministrador || loading || saving}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              styles={{
                label: { fontWeight: 600, color: 'var(--anican-azul-oscuro)', marginBottom: 4 },
                input: { borderRadius: 8 },
              }}
            />

            <Group grow wrap="wrap">
              <TextInput
                label="Teléfono Principal (1)"
                placeholder="Ej. +58 414-1234567"
                disabled={!esAdministrador || loading || saving}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                styles={{
                  label: { fontWeight: 600, color: 'var(--anican-azul-oscuro)', marginBottom: 4 },
                  input: { borderRadius: 8 },
                }}
              />

              <TextInput
                label="Teléfono Secundario (2)"
                placeholder="Ej. +58 412-7654321"
                disabled={!esAdministrador || loading || saving}
                value={telefono2}
                onChange={(e) => setTelefono2(e.target.value)}
                styles={{
                  label: { fontWeight: 600, color: 'var(--anican-azul-oscuro)', marginBottom: 4 },
                  input: { borderRadius: 8 },
                }}
              />
            </Group>

            <Textarea
              label="Dirección Física"
              placeholder="Dirección fiscal o sede principal de la fundación..."
              rows={2}
              disabled={!esAdministrador || loading || saving}
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              styles={{
                label: { fontWeight: 600, color: 'var(--anican-azul-oscuro)', marginBottom: 4 },
                input: { borderRadius: 8 },
              }}
            />

            {esAdministrador && (
              <Group justify="flex-end" mt="xs">
                <Button type="submit" loading={saving || loading}>
                  Guardar Cambios de Branding
                </Button>
              </Group>
            )}
          </Stack>
        </form>
      </Stack>
    </Card>
  );
};
