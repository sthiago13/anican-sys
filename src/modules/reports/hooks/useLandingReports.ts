import { useState, useCallback } from "react";
import { supabase } from "../../../config/supabase";
import {
  type LandingReportItem,
  type LandingReportTarget,
  type PublishReportParams,
} from "../types";

const DEFAULT_TARGETS: Record<
  LandingReportTarget,
  { label: string; defaultTitle: string; defaultDesc: string }
> = {
  doc1: {
    label: "Informe de Gestión",
    defaultTitle: "Informe de Gestión",
    defaultDesc:
      "Resumen detallado de las actividades realizadas, insumos entregados y pacientes beneficiados.",
  },
  doc2: {
    label: "Balance Contable Anual",
    defaultTitle: "Balance Contable Anual",
    defaultDesc:
      "Detalle financiero certificado de los ingresos por donaciones y su respectiva ejecución presupuestaria.",
  },
};

export function useLandingReports() {
  const [reportsData, setReportsData] = useState<Record<
    LandingReportTarget,
    LandingReportItem
  > | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getStr = (val: unknown, fallback: string): string => {
    return typeof val === "string" && val.trim() !== "" ? val : fallback;
  };

  const getNullableStr = (val: unknown): string | null => {
    return typeof val === "string" && val.trim() !== "" ? val : null;
  };

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: row, error: fetchErr } = await supabase
        .from("landing_content")
        .select("data")
        .eq("key", "main_content")
        .maybeSingle();

      if (fetchErr) {
        throw new Error(fetchErr.message || "Error al conectar con la base de datos de la landing.");
      }

      const content = (row?.data || {}) as Record<string, unknown>;

      const mapped: Record<LandingReportTarget, LandingReportItem> = {
        doc1: {
          id: "doc1",
          label: DEFAULT_TARGETS.doc1.label,
          defaultTitle: DEFAULT_TARGETS.doc1.defaultTitle,
          defaultDesc: DEFAULT_TARGETS.doc1.defaultDesc,
          title: getStr(content["doc1-title"], DEFAULT_TARGETS.doc1.defaultTitle),
          desc: getStr(content["doc1-desc"], DEFAULT_TARGETS.doc1.defaultDesc),
          filename: getNullableStr(content["material-doc1-filename"]),
          fileUrl: getNullableStr(content["material-doc1-file"]),
        },
        doc2: {
          id: "doc2",
          label: DEFAULT_TARGETS.doc2.label,
          defaultTitle: DEFAULT_TARGETS.doc2.defaultTitle,
          defaultDesc: DEFAULT_TARGETS.doc2.defaultDesc,
          title: getStr(content["doc2-title"], DEFAULT_TARGETS.doc2.defaultTitle),
          desc: getStr(content["doc2-desc"], DEFAULT_TARGETS.doc2.defaultDesc),
          filename: getNullableStr(content["material-doc2-filename"]),
          fileUrl: getNullableStr(content["material-doc2-file"]),
        },
      };

      setReportsData(mapped);
      return mapped;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al cargar la información actual de la landing page.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishReport = async (params: PublishReportParams): Promise<void> => {
    const { docId, title, desc, file } = params;

    try {
      setSubmitting(true);
      setError(null);

      let publicUrl: string | null = null;
      let cleanFilename: string | null = null;

      if (file) {
        // Validar que sea PDF
        const isPdf =
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
          throw new Error("El archivo seleccionado debe ser un documento PDF (.pdf).");
        }

        // Validar tamaño máximo (15 MB)
        const maxSizeBytes = 15 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          throw new Error("El archivo supera el tamaño máximo permitido de 15 MB.");
        }

        // Subir a bucket público landing-media
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `materials/reportes/${docId}_${Date.now()}_${sanitizedName}`;

        const { error: uploadErr } = await supabase.storage
          .from("landing-media")
          .upload(storagePath, file, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadErr) {
          throw new Error(`Error al subir el archivo a Supabase Storage: ${uploadErr.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("landing-media")
          .getPublicUrl(storagePath);

        publicUrl = urlData.publicUrl;
        cleanFilename = file.name;
      }

      // Obtener snapshot actual de landing_content
      const { data: row, error: fetchErr } = await supabase
        .from("landing_content")
        .select("data")
        .eq("key", "main_content")
        .maybeSingle();

      if (fetchErr) {
        throw new Error(`No se pudo leer el contenido de la landing: ${fetchErr.message}`);
      }

      const currentContent: Record<string, unknown> = {
        ...((row?.data as Record<string, unknown>) || {}),
      };

      currentContent[`${docId}-title`] = title.trim();
      currentContent[`${docId}-desc`] = desc.trim();

      if (publicUrl && cleanFilename) {
        currentContent[`material-${docId}-filename`] = cleanFilename;
        currentContent[`material-${docId}-file`] = publicUrl;
      }

      const { error: upsertErr } = await supabase.from("landing_content").upsert({
        key: "main_content",
        data: currentContent,
        updated_at: new Date().toISOString(),
      });

      if (upsertErr) {
        throw new Error(`No se pudo actualizar el registro en la landing: ${upsertErr.message}`);
      }

      await fetchReports();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al publicar el reporte en la landing.";
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const removeReport = async (docId: LandingReportTarget): Promise<void> => {
    try {
      setSubmitting(true);
      setError(null);

      const { data: row, error: fetchErr } = await supabase
        .from("landing_content")
        .select("data")
        .eq("key", "main_content")
        .maybeSingle();

      if (fetchErr) {
        throw new Error(`No se pudo leer el contenido: ${fetchErr.message}`);
      }

      const currentContent: Record<string, unknown> = {
        ...((row?.data as Record<string, unknown>) || {}),
      };

      delete currentContent[`material-${docId}-filename`];
      delete currentContent[`material-${docId}-file`];

      const { error: upsertErr } = await supabase.from("landing_content").upsert({
        key: "main_content",
        data: currentContent,
        updated_at: new Date().toISOString(),
      });

      if (upsertErr) {
        throw new Error(`No se pudo desvincular el archivo: ${upsertErr.message}`);
      }

      await fetchReports();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "No se pudo desvincular el archivo.";
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    reportsData,
    loading,
    submitting,
    error,
    setError,
    fetchReports,
    publishReport,
    removeReport,
  };
}

