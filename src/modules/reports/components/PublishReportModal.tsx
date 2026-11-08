import React, { useState, useEffect } from "react";
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  SegmentedControl,
  TextInput,
  Textarea,
  FileInput,
  Card,
  Badge,
  Alert,
  Loader,
  Center,
  Divider,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconWorldUpload,
  IconFileText,
  IconExternalLink,
  IconCheck,
  IconAlertCircle,
  IconTrash,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useLandingReports } from "../hooks/useLandingReports";
import { type LandingReportTarget } from "../types";

interface PublishReportModalProps {
  opened: boolean;
  onClose: () => void;
  defaultPeriodText?: string;
  esAdministrador?: boolean;
}

export const PublishReportModal: React.FC<PublishReportModalProps> = ({
  opened,
  onClose,
  defaultPeriodText,
  esAdministrador = true,
}) => {
  const {
    reportsData,
    loading,
    submitting,
    error: hookError,
    setError: setHookError,
    fetchReports,
    publishReport,
    removeReport,
  } = useLandingReports();

  const [targetDoc, setTargetDoc] = useState<LandingReportTarget>("doc1");
  const [title, setTitle] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Al abrir el modal o cambiar el target, cargar datos frescos
  useEffect(() => {
    let isMounted = true;
    if (!opened) return;

    void fetchReports()
      .then((data) => {
        if (!isMounted || !data) return;
        const active = data[targetDoc];
        if (active) {
          setTitle(active.title);
          setDesc(active.desc);
        }
      })
      .catch(() => {
        // Error ya manejado por el hook
      });

    return () => {
      isMounted = false;
    };
  }, [opened, targetDoc, fetchReports]);

  const handleTargetChange = (val: string) => {
    const newTarget = val as LandingReportTarget;
    setTargetDoc(newTarget);
    setSelectedFile(null);
    setLocalError(null);
    setHookError(null);
    setSuccessMsg(null);

    if (reportsData) {
      const active = reportsData[newTarget];
      setTitle(active.title);
      setDesc(active.desc);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setLocalError(null);
    setHookError(null);
    setSuccessMsg(null);
    onClose();
  };

  const handlePublish = async () => {
    if (!esAdministrador) {
      setLocalError("Solo los administradores tienen permisos para publicar contenidos en la landing page.");
      return;
    }

    setLocalError(null);
    setHookError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setLocalError("El título del reporte en la landing no puede estar vacío.");
      return;
    }
    if (!desc.trim()) {
      setLocalError("La descripción del reporte no puede estar vacía.");
      return;
    }

    const currentItem = reportsData ? reportsData[targetDoc] : null;
    const hasExistingFile = Boolean(currentItem?.fileUrl);

    if (!hasExistingFile && !selectedFile) {
      setLocalError("Debes seleccionar un archivo PDF para publicar este reporte por primera vez.");
      return;
    }

    try {
      await publishReport({
        docId: targetDoc,
        title: title.trim(),
        desc: desc.trim(),
        file: selectedFile,
      });

      setSuccessMsg(
        selectedFile
          ? `¡Reporte y archivo "${selectedFile.name}" publicados exitosamente en la landing page!`
          : "¡Información del reporte actualizada con éxito en la landing page!"
      );
      setSelectedFile(null);
    } catch {
      // Error manejado en el hook
    }
  };

  const handleRemoveFile = async () => {
    if (!esAdministrador) {
      setLocalError("Solo los administradores tienen permisos para desvincular archivos.");
      return;
    }

    if (!window.confirm("¿Seguro que deseas desvincular el PDF publicado para este espacio?")) {
      return;
    }

    try {
      setLocalError(null);
      setHookError(null);
      await removeReport(targetDoc);
      setSuccessMsg("El archivo ha sido desvinculado de la landing page.");
    } catch {
      // Error manejado en el hook
    }
  };

  const currentItem = reportsData ? reportsData[targetDoc] : null;
  const activeError = localError || hookError;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconWorldUpload size={22} style={{ color: "var(--anican-naranja)" }} />
          <Text fw={700} size="lg" style={{ color: "var(--anican-azul-oscuro)" }}>
            Publicar Reportes en la Web (Landing Page)
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Sincroniza los informes oficiales que se ofrecen para descarga pública en la sección de
          transparencia de la landing page de ANICAN.
        </Text>

        {/* Selector de destino */}
        <div>
          <Text size="xs" fw={700} mb={4} c="dimmed">
            ESPACIO EN LA LANDING PAGE
          </Text>
          <SegmentedControl
            fullWidth
            value={targetDoc}
            onChange={handleTargetChange}
            data={[
              { label: "📄 Informe de Gestión (doc1)", value: "doc1" },
              { label: "📊 Balance Contable Anual (doc2)", value: "doc2" },
            ]}
            color="orange"
          />
        </div>

        {/* Estado actual adaptado para modo claro y oscuro usando variables semánticas */}
        {loading ? (
          <Center p="xl">
            <Loader size="sm" color="orange" />
          </Center>
        ) : (
          <Card
            withBorder
            radius="md"
            p="sm"
            style={{
              backgroundColor: "var(--anican-bg-card)",
              borderColor: "var(--anican-border)",
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <div>
                <Group gap="xs" mb={2}>
                  <Text size="xs" fw={700} c="dimmed">
                    DOCUMENTO PUBLICADO ACTUALMENTE
                  </Text>
                  {currentItem?.filename ? (
                    <Badge color="teal" size="sm" variant="light">
                      Publicado
                    </Badge>
                  ) : (
                    <Badge color="gray" size="sm" variant="light">
                      Sin archivo
                    </Badge>
                  )}
                </Group>
                <Text
                  size="sm"
                  fw={600}
                  style={{ wordBreak: "break-all", color: "var(--anican-text)" }}
                >
                  {currentItem?.filename || "No hay archivo PDF asignado"}
                </Text>
              </div>

              {currentItem?.fileUrl && (
                <Group gap="xs">
                  <Tooltip label="Ver documento publicado en nueva pestaña">
                    <Button
                      component="a"
                      href={currentItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      variant="light"
                      color="blue"
                      leftSection={<IconExternalLink size={14} />}
                    >
                      Ver PDF
                    </Button>
                  </Tooltip>
                  {esAdministrador && (
                    <Tooltip label="Desvincular archivo de la landing">
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="sm"
                        onClick={handleRemoveFile}
                        loading={submitting}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              )}
            </Group>
          </Card>
        )}

        {/* Alertas de error y éxito */}
        {activeError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            withCloseButton
            onClose={() => {
              setLocalError(null);
              setHookError(null);
            }}
          >
            {activeError}
          </Alert>
        )}

        {successMsg && (
          <Alert
            icon={<IconCheck size={16} />}
            color="teal"
            variant="light"
            withCloseButton
            onClose={() => setSuccessMsg(null)}
          >
            {successMsg}
          </Alert>
        )}

        <Divider label="Datos a publicar o actualizar" labelPosition="center" />

        {/* Campos de formulario */}
        <TextInput
          label="Título visible en la Landing"
          placeholder="Ej: Informe de Gestión 2025"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
          disabled={!esAdministrador || submitting}
        />

        <Textarea
          label="Descripción explicativa"
          placeholder="Breve resumen de las actividades o finanzas que describe el documento..."
          value={desc}
          onChange={(e) => setDesc(e.currentTarget.value)}
          minRows={2}
          required
          disabled={!esAdministrador || submitting}
        />

        {/* Input de archivo PDF */}
        <FileInput
          label="Cargar nuevo archivo PDF"
          description="Selecciona un archivo PDF (máx. 15 MB). Puedes subir un PDF oficial firmado o el generado al imprimir esta vista."
          placeholder={
            currentItem?.filename
              ? `Reemplazar "${currentItem.filename}"`
              : "Seleccionar documento PDF..."
          }
          value={selectedFile}
          onChange={setSelectedFile}
          accept="application/pdf"
          leftSection={<IconFileText size={18} />}
          clearable
          disabled={!esAdministrador || submitting}
        />

        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md">
          <Text size="xs">
            <b>Nota institucional:</b> Si la fundación cuenta con un Balance Contable auditado,
            firmado o sellado por un contador, puedes adjuntarlo aquí directamente para certificar la
            transparencia pública de ANICAN.
            {defaultPeriodText ? ` Período actual en pantalla: ${defaultPeriodText}.` : ""}
          </Text>
        </Alert>

        {!esAdministrador && (
          <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light" radius="md">
            <Text size="xs">
              Tu rol actual es de solo lectura. Únicamente los administradores pueden publicar o
              desvincular reportes en la landing page.
            </Text>
          </Alert>
        )}

        {/* Botones de acción */}
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={submitting}>
            Cerrar
          </Button>
          <Button
            color="orange"
            leftSection={<IconWorldUpload size={18} />}
            onClick={handlePublish}
            loading={submitting}
            disabled={!esAdministrador}
          >
            {selectedFile ? "Publicar Documento en la Web" : "Guardar Cambios de Texto"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
