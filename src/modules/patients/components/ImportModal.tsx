import React, { useState } from "react";
import {
  Modal,
  Button as MantineButton,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Table,
  Badge,
  Loader,
  SegmentedControl,
  Card,
  Divider,
  ScrollArea,
  Alert,
} from "@mantine/core";
import {
  IconUpload,
  IconDownload,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconUsers,
  IconUserCheck,
  IconExclamationMark,
} from "@tabler/icons-react";
import { Button } from "../../../components/UI/Button";
import { supabase } from "../../../config/supabase";
import * as XLSX from "xlsx";

interface ImportModalProps {
  opened: boolean;
  onClose: () => void;
  onImportSuccess: () => Promise<void> | void;
}

interface ExcelRow {
  cedula_representante?: string | number;
  nombres_representante?: string;
  telefono_1_representante?: string | number;
  telefono_2_representante?: string | number;
  residencia_representante?: string;
  nombres_paciente?: string;
  apellidos_paciente?: string;
  fecha_nacimiento_paciente?: string | number;
  sexo_paciente?: string;
  estado_paciente?: string;
  diagnostico_paciente?: string;
}

interface ParsedRecord {
  index: number;
  isValid: boolean;
  errors: string[];
  rep: {
    cedula: string;
    nombres: string;
    telefono_1: string | null;
    telefono_2: string | null;
    residencia: string | null;
  };
  pac: {
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    sexo: string | null;
    estado: "Activo" | "Inactivo" | "Fallecido";
    diagnostico: string | null;
  };
}

interface RepresentativeConflict {
  cedula: string;
  excelData: ParsedRecord["rep"];
  dbData: {
    id: string;
    nombres: string;
    telefono_1: string | null;
    telefono_2: string | null;
    residencia: string | null;
  };
  resolution: "UPDATE" | "KEEP_EXISTING";
}

interface PatientConflict {
  excelIndex: number;
  excelData: ParsedRecord["pac"];
  repCedula: string;
  repNombres: string;
  dbData: {
    id: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
  };
  resolution: "SKIP" | "DUPLICATE";
}

export const ImportModal: React.FC<ImportModalProps> = ({
  opened,
  onClose,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<"upload" | "preview" | "conflicts" | "loading" | "result">(
    "upload"
  );
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [repConflicts, setRepConflicts] = useState<RepresentativeConflict[]>([]);
  const [pacConflicts, setPacConflicts] = useState<PatientConflict[]>([]);
  const [importSummary, setImportSummary] = useState({
    repsCreados: 0,
    repsActualizados: 0,
    pacsCreados: 0,
    pacsOmitidos: 0,
  });

  const [loadingText, setLoadingText] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const resetState = () => {
    setStep("upload");
    setRecords([]);
    setRepConflicts([]);
    setPacConflicts([]);
    setImportSummary({
      repsCreados: 0,
      repsActualizados: 0,
      pacsCreados: 0,
      pacsOmitidos: 0,
    });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // 1. Descargar Plantilla de Excel
  const handleDownloadTemplate = () => {
    const headers = [
      "cedula_representante",
      "nombres_representante",
      "telefono_1_representante",
      "telefono_2_representante",
      "residencia_representante",
      "nombres_paciente",
      "apellidos_paciente",
      "fecha_nacimiento_paciente",
      "sexo_paciente",
      "estado_paciente",
      "diagnostico_paciente",
    ];

    const sampleData = [
      {
        cedula_representante: "V-12345678",
        nombres_representante: "Pedro Pérez",
        telefono_1_representante: "04121234567",
        telefono_2_representante: "02517654321",
        residencia_representante: "Cabudare, Edo. Lara",
        nombres_paciente: "Juan José",
        apellidos_paciente: "Pérez Gómez",
        fecha_nacimiento_paciente: "2018-05-20",
        sexo_paciente: "Masculino",
        estado_paciente: "Activo",
        diagnostico_paciente: "Leucemia Linfoblástica Aguda (LLA)",
      },
      {
        cedula_representante: "V-87654321",
        nombres_representante: "María Rodríguez",
        telefono_1_representante: "04149876543",
        telefono_2_representante: "",
        residencia_representante: "San Cristóbal, Edo. Táchira",
        nombres_paciente: "Sofía Victoria",
        apellidos_paciente: "Rodríguez",
        fecha_nacimiento_paciente: "2016-11-02",
        sexo_paciente: "Femenino",
        estado_paciente: "Activo",
        diagnostico_paciente: "Retinoblastoma",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla Importación");
    XLSX.writeFile(workbook, "plantilla_importacion_anican.xlsx");
  };

  // Parsear Fecha de Excel o String
  const parseExcelDate = (val: string | number | undefined): string => {
    if (!val) return "";
    
    // Si viene como número de serie de Excel
    if (typeof val === "number") {
      const date = XLSX.SSF.parse_date_code(val);
      const y = date.y;
      const m = String(date.m).padStart(2, "0");
      const d = String(date.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    const strVal = String(val).trim();
    // Validar formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
      return strVal;
    }
    
    // Validar formato DD/MM/YYYY y convertir
    const slashParts = strVal.split("/");
    if (slashParts.length === 3) {
      const [d, m, y] = slashParts;
      if (y.length === 4 && d.length <= 2 && m.length <= 2) {
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
    }

    const hyphenParts = strVal.split("-");
    if (hyphenParts.length === 3) {
      const [d, m, y] = hyphenParts;
      if (y.length === 4 && d.length <= 2 && m.length <= 2) {
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
    }

    return strVal;
  };

  // 2. Procesar el archivo subido
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        if (rawJson.length === 0) {
          alert("El archivo Excel está vacío.");
          return;
        }

        const parsed: ParsedRecord[] = rawJson.map((row, idx) => {
          const errors: string[] = [];
          const cedula = String(row.cedula_representante || "").trim();
          const nombresRep = String(row.nombres_representante || "").trim();
          const nombresPac = String(row.nombres_paciente || "").trim();
          const apellidosPac = String(row.apellidos_paciente || "").trim();
          const rawFechaNac = row.fecha_nacimiento_paciente;
          const fechaNac = parseExcelDate(rawFechaNac);

          if (!cedula) errors.push("Cédula de representante requerida.");
          if (!nombresRep) errors.push("Nombre de representante requerido.");
          if (!nombresPac) errors.push("Nombre del paciente requerido.");
          if (!apellidosPac) errors.push("Apellido del paciente requerido.");
          if (!fechaNac) {
            errors.push("Fecha de nacimiento del paciente requerida.");
          } else if (isNaN(Date.parse(fechaNac))) {
            errors.push(`Fecha de nacimiento inválida: '${fechaNac}'. Use YYYY-MM-DD.`);
          }

          let sexo = String(row.sexo_paciente || "").trim();
          if (sexo) {
            const sexLower = sexo.toLowerCase();
            if (sexLower.startsWith("m")) sexo = "Masculino";
            else if (sexLower.startsWith("f")) sexo = "Femenino";
            else errors.push(`Sexo inválido: '${sexo}'. Debe ser Masculino o Femenino.`);
          } else {
            sexo = "";
          }

          let estado = String(row.estado_paciente || "").trim();
          if (estado) {
            const estLower = estado.toLowerCase();
            if (estLower.startsWith("act")) estado = "Activo";
            else if (estLower.startsWith("inac")) estado = "Inactivo";
            else if (estLower.startsWith("fall")) estado = "Fallecido";
            else {
              errors.push(`Estado inválido: '${estado}'. Debe ser Activo, Inactivo o Fallecido.`);
              estado = "Activo";
            }
          } else {
            estado = "Activo";
          }

          return {
            index: idx + 1,
            isValid: errors.length === 0,
            errors,
            rep: {
              cedula,
              nombres: nombresRep,
              telefono_1: row.telefono_1_representante ? String(row.telefono_1_representante).trim() : null,
              telefono_2: row.telefono_2_representante ? String(row.telefono_2_representante).trim() : null,
              residencia: row.residencia_representante ? String(row.residencia_representante).trim() : null,
            },
            pac: {
              nombres: nombresPac,
              apellidos: apellidosPac,
              fecha_nacimiento: fechaNac,
              sexo: sexo || null,
              estado: estado as ParsedRecord["pac"]["estado"],
              diagnostico: row.diagnostico_paciente ? String(row.diagnostico_paciente).trim() : null,
            },
          };
        });

        setRecords(parsed);
        setStep("preview");
      } catch (err) {
        console.error(err);
        alert("Ocurrió un error leyendo el archivo Excel. Asegúrese de que sea un archivo válido.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. Cruzar datos con Supabase y Buscar Conflictos
  const checkForConflicts = async () => {
    const validRecords = records.filter((r) => r.isValid);
    if (validRecords.length === 0) {
      alert("No hay registros válidos para importar.");
      return;
    }

    setStep("loading");
    setLoadingText("Comprobando registros existentes en la base de datos...");

    try {
      // Obtener listas locales de Supabase
      const { data: dbReps, error: repErr } = await supabase
        .from("representantes")
        .select("id, cedula, nombres, telefono_1, telefono_2, residencia");

      if (repErr) throw repErr;

      const { data: dbPacs, error: pacErr } = await supabase
        .from("pacientes")
        .select("id, nombres, apellidos, fecha_nacimiento, id_representante");

      if (pacErr) throw pacErr;

      const repsMap = new Map<string, typeof dbReps[0]>();
      dbReps?.forEach((r) => repsMap.set(r.cedula, r));

      // Mapear pacientes existentes por tutor + nombre + nacimiento
      const pacsUniqueKeys = new Set<string>();
      dbPacs?.forEach((p) => {
        const key = `${p.id_representante}_${p.nombres.toLowerCase().trim()}_${p.apellidos.toLowerCase().trim()}_${p.fecha_nacimiento}`;
        pacsUniqueKeys.add(key);
      });

      const foundRepConflicts: RepresentativeConflict[] = [];
      const foundPacConflicts: PatientConflict[] = [];

      const processedCedulas = new Set<string>();

      validRecords.forEach((record) => {
        // Chequear colisión de representante
        const repCedula = record.rep.cedula;
        const existingRep = repsMap.get(repCedula);

        if (existingRep && !processedCedulas.has(repCedula)) {
          processedCedulas.add(repCedula);
          // Verificar si hay alguna diferencia real de datos
          const hasDiff =
            existingRep.nombres !== record.rep.nombres ||
            (existingRep.telefono_1 || "") !== (record.rep.telefono_1 || "") ||
            (existingRep.telefono_2 || "") !== (record.rep.telefono_2 || "") ||
            (existingRep.residencia || "") !== (record.rep.residencia || "");

          if (hasDiff) {
            foundRepConflicts.push({
              cedula: repCedula,
              excelData: record.rep,
              dbData: {
                id: existingRep.id,
                nombres: existingRep.nombres,
                telefono_1: existingRep.telefono_1,
                telefono_2: existingRep.telefono_2,
                residencia: existingRep.residencia,
              },
              resolution: "UPDATE",
            });
          }
        }

        // Chequear colisión de paciente si el representante ya existe
        if (existingRep) {
          const pacKey = `${existingRep.id}_${record.pac.nombres.toLowerCase().trim()}_${record.pac.apellidos.toLowerCase().trim()}_${record.pac.fecha_nacimiento}`;
          if (pacsUniqueKeys.has(pacKey)) {
            const pacDbMatch = dbPacs?.find(
              (p) =>
                p.id_representante === existingRep.id &&
                p.nombres.toLowerCase().trim() === record.pac.nombres.toLowerCase().trim() &&
                p.apellidos.toLowerCase().trim() === record.pac.apellidos.toLowerCase().trim() &&
                p.fecha_nacimiento === record.pac.fecha_nacimiento
            );

            foundPacConflicts.push({
              excelIndex: record.index,
              excelData: record.pac,
              repCedula,
              repNombres: record.rep.nombres,
              dbData: {
                id: pacDbMatch?.id || "",
                nombres: pacDbMatch?.nombres || record.pac.nombres,
                apellidos: pacDbMatch?.apellidos || record.pac.apellidos,
                fecha_nacimiento: pacDbMatch?.fecha_nacimiento || record.pac.fecha_nacimiento,
              },
              resolution: "SKIP",
            });
          }
        }
      });

      setRepConflicts(foundRepConflicts);
      setPacConflicts(foundPacConflicts);

      if (foundRepConflicts.length > 0 || foundPacConflicts.length > 0) {
        setStep("conflicts");
      } else {
        // Si no hay conflictos, proceder directamente al guardado
        await executeImport(foundRepConflicts, foundPacConflicts);
      }
    } catch (err) {
      console.error(err);
      alert("Error verificando colisiones de registros en Supabase.");
      setStep("preview");
    }
  };

  // 4. Ejecutar la importación aplicando decisiones de resolución de conflictos
  const executeImport = async (
    activeRepConflicts: RepresentativeConflict[],
    activePacConflicts: PatientConflict[]
  ) => {
    setStep("loading");
    setLoadingText("Guardando diagnósticos nuevos...");

    const validRecords = records.filter((r) => r.isValid);

    try {
      // 1. Obtener y asegurar diagnósticos
      const { data: dbDiags, error: diagErr } = await supabase
        .from("diagnosticos")
        .select("id, nombre");

      if (diagErr) throw diagErr;

      const diagsMap = new Map<string, string>(); // nombre -> id
      dbDiags?.forEach((d) => diagsMap.set(d.nombre.toLowerCase().trim(), d.id));

      // Identificar diagnósticos únicos requeridos
      const uniqueExcelDiags = new Set<string>();
      validRecords.forEach((r) => {
        if (r.pac.diagnostico) uniqueExcelDiags.add(r.pac.diagnostico.trim());
      });

      // Crear diagnósticos que no existen
      for (const diagName of uniqueExcelDiags) {
        const normalized = diagName.toLowerCase().trim();
        if (!diagsMap.has(normalized)) {
          const { data: newDiag, error: insDiagErr } = await supabase
            .from("diagnosticos")
            .insert({ nombre: diagName, descripcion: "Creado automáticamente vía Importador" })
            .select()
            .single();

          if (insDiagErr) throw insDiagErr;
          diagsMap.set(normalized, newDiag.id);
        }
      }

      // 2. Procesar Representantes
      setLoadingText("Procesando representantes legales...");
      const { data: freshReps, error: freshRepsErr } = await supabase
        .from("representantes")
        .select("id, cedula");

      if (freshRepsErr) throw freshRepsErr;

      const repsIdMap = new Map<string, string>(); // cedula -> id
      freshReps?.forEach((r) => repsIdMap.set(r.cedula, r.id));

      const repsConflictMap = new Map<string, RepresentativeConflict["resolution"]>();
      activeRepConflicts.forEach((c) => repsConflictMap.set(c.cedula, c.resolution));

      let repsCreados = 0;
      let repsActualizados = 0;

      // Agrupar filas de representantes únicos en el Excel
      const excelRepsMap = new Map<string, ParsedRecord["rep"]>();
      validRecords.forEach((r) => {
        if (!excelRepsMap.has(r.rep.cedula)) {
          excelRepsMap.set(r.rep.cedula, r.rep);
        }
      });

      for (const [cedula, repData] of excelRepsMap.entries()) {
        const existingId = repsIdMap.get(cedula);

        if (existingId) {
          const resolution = repsConflictMap.get(cedula);
          if (resolution === "UPDATE") {
            const { error: updErr } = await supabase
              .from("representantes")
              .update({
                nombres: repData.nombres,
                telefono_1: repData.telefono_1,
                telefono_2: repData.telefono_2,
                residencia: repData.residencia,
              })
              .eq("id", existingId);

            if (updErr) throw updErr;
            repsActualizados++;
          }
        } else {
          // Crear nuevo representante
          const { data: newRep, error: insRepErr } = await supabase
            .from("representantes")
            .insert({
              cedula: repData.cedula,
              nombres: repData.nombres,
              telefono_1: repData.telefono_1,
              telefono_2: repData.telefono_2,
              residencia: repData.residencia,
            })
            .select()
            .single();

          if (insRepErr) throw insRepErr;
          repsIdMap.set(cedula, newRep.id);
          repsCreados++;
        }
      }

      // 3. Procesar Pacientes
      setLoadingText("Importando pacientes...");
      
      const pacsConflictMap = new Map<number, PatientConflict["resolution"]>();
      activePacConflicts.forEach((c) => pacsConflictMap.set(c.excelIndex, c.resolution));

      let pacsCreados = 0;
      let pacsOmitidos = 0;

      const patientsToInsert = [];

      for (const r of validRecords) {
        const conflictRes = pacsConflictMap.get(r.index);

        if (conflictRes === "SKIP") {
          pacsOmitidos++;
          continue;
        }

        const repId = repsIdMap.get(r.rep.cedula);
        if (!repId) {
          console.warn(`No se encontró ID del representante para cédula ${r.rep.cedula}`);
          continue;
        }

        const diagId = r.pac.diagnostico
          ? diagsMap.get(r.pac.diagnostico.toLowerCase().trim())
          : null;

        patientsToInsert.push({
          id_representante: repId,
          nombres: r.pac.nombres,
          apellidos: r.pac.apellidos,
          fecha_nacimiento: r.pac.fecha_nacimiento,
          sexo: r.pac.sexo,
          estado: r.pac.estado,
          id_diagnostico: diagId || null,
        });
      }

      if (patientsToInsert.length > 0) {
        const { error: insPacErr } = await supabase
          .from("pacientes")
          .insert(patientsToInsert);

        if (insPacErr) throw insPacErr;
        pacsCreados = patientsToInsert.length;
      }

      setImportSummary({
        repsCreados,
        repsActualizados,
        pacsCreados,
        pacsOmitidos,
      });

      setStep("result");
      
      // Llamar al callback de refresco
      if (onImportSuccess) {
        await onImportSuccess();
      }
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar los datos en la base de datos.");
      setStep("preview");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const totalValid = records.filter((r) => r.isValid).length;
  const totalInvalid = records.filter((r) => !r.isValid).length;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="orange" size="md" radius="md">
            <IconUsers size={18} />
          </ThemeIcon>
          <Text fw={700} size="lg" c="var(--anican-azul-oscuro)">
            Importador de Pacientes y Representantes
          </Text>
        </Group>
      }
      centered
      radius="md"
      size={step === "upload" || step === "loading" || step === "result" ? "md" : "xl"}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      transitionProps={{ transition: "fade", duration: 200 }}
    >
      {/* 1. PASO DE CARGA */}
      {step === "upload" && (
        <Stack gap="md" py="xs">
          <Text size="sm" c="dimmed">
            Carga la data histórica de pacientes y sus tutores legales directamente desde una
            hoja de cálculo de Excel.
          </Text>

          <Alert color="orange" icon={<IconAlertCircle size={16} />} radius="md">
            <Text size="xs">
              Para garantizar que los datos se importen de forma correcta, utiliza nuestra
              plantilla oficial. El sistema asociará automáticamente a los pacientes con sus
              representantes por medio de la cédula.
            </Text>
          </Alert>

          <Group justify="center" py="md">
            <MantineButton
              variant="light"
              color="orange"
              leftSection={<IconDownload size={16} />}
              onClick={handleDownloadTemplate}
              radius="md"
            >
              Descargar Plantilla Excel
            </MantineButton>
          </Group>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "var(--anican-naranja)" : "var(--anican-border)"}`,
              borderRadius: 12,
              padding: "40px 20px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: dragOver ? "rgba(247, 103, 7, 0.05)" : "transparent",
              transition: "all 0.2s ease",
            }}
            onClick={() => {
              const fileInput = document.getElementById("excel-file-input");
              fileInput?.click();
            }}
          >
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx, .xls"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <Stack align="center" gap="xs">
              <ThemeIcon variant="subtle" color="orange" size="xl" radius="xl">
                <IconUpload size={24} />
              </ThemeIcon>
              <Text fw={600} size="sm" c="var(--anican-azul-oscuro)">
                Arrastra tu archivo Excel aquí o haz clic para buscar
              </Text>
              <Text size="xs" c="dimmed">
                Soporta archivos .xlsx y .xls
              </Text>
            </Stack>
          </div>

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" onClick={handleClose}>
              Cerrar
            </Button>
          </Group>
        </Stack>
      )}

      {/* 2. PASO DE PREVISUALIZACIÓN */}
      {step === "preview" && (
        <Stack gap="md" py="xs">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Revisa los datos leídos de tu archivo Excel. Corrige los errores en el archivo y
                vuelve a cargarlo si es necesario.
              </Text>
            </div>
            <Group gap="xs">
              <Badge color="green" variant="light" size="lg">
                {totalValid} Válidos
              </Badge>
              {totalInvalid > 0 && (
                <Badge color="red" variant="light" size="lg">
                  {totalInvalid} Con errores
                </Badge>
              )}
            </Group>
          </Group>

          <ScrollArea style={{ height: 350 }} scrollbarSize={8} type="always">
            <Table striped highlightOnHover withTableBorder verticalSpacing="xs">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Estado</th>
                  <th>Cédula Rep.</th>
                  <th>Representante</th>
                  <th>Paciente</th>
                  <th>Nacimiento</th>
                  <th>Diagnóstico</th>
                  <th>Detalles / Errores</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.index}>
                    <td>
                      <Text size="xs" c="dimmed">
                        {r.index}
                      </Text>
                    </td>
                    <td>
                      <Badge color={r.isValid ? "green" : "red"} variant="filled" size="sm">
                        {r.isValid ? "Listo" : "Error"}
                      </Badge>
                    </td>
                    <td>
                      <Text size="xs" fw={500}>
                        {r.rep.cedula}
                      </Text>
                    </td>
                    <td>
                      <Text size="xs">{r.rep.nombres}</Text>
                    </td>
                    <td>
                      <Text size="xs" fw={500}>
                        {r.pac.nombres} {r.pac.apellidos}
                      </Text>
                    </td>
                    <td>
                      <Text size="xs">{r.pac.fecha_nacimiento}</Text>
                    </td>
                    <td>
                      <Text size="xs" truncate style={{ maxWidth: 150 }}>
                        {r.pac.diagnostico || "—"}
                      </Text>
                    </td>
                    <td>
                      {r.isValid ? (
                        <Text size="xs" c="dimmed">
                          Campos correctos.
                        </Text>
                      ) : (
                        <Stack gap={2}>
                          {r.errors.map((err, i) => (
                            <Text key={i} size="xs" c="red" fw={500} style={{ lineHeight: 1.1 }}>
                              • {err}
                            </Text>
                          ))}
                        </Stack>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ScrollArea>

          <Group justify="space-between" mt="md">
            <MantineButton
              variant="subtle"
              color="gray"
              leftSection={<IconRefresh size={16} />}
              onClick={() => setStep("upload")}
            >
              Cargar otro archivo
            </MantineButton>
            <Group gap="xs">
              <Button variant="outline" color="gray" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={checkForConflicts} disabled={totalValid === 0}>
                Siguiente (Verificar Base de Datos)
              </Button>
            </Group>
          </Group>
        </Stack>
      )}

      {/* 3. PASO DE CONCORDANCIA / CONFLICTOS */}
      {step === "conflicts" && (
        <Stack gap="md" py="xs">
          <Text size="sm" c="dimmed">
            Hemos encontrado registros en el Excel que ya existen en el sistema. Toma una decisión
            para cada caso antes de guardar:
          </Text>

          <ScrollArea style={{ height: 400 }} scrollbarSize={8} type="always">
            <Stack gap="lg" pr="xs">
              {/* Conflictos de Representantes */}
              {repConflicts.length > 0 && (
                <div>
                  <Group gap="xs" mb="sm">
                    <ThemeIcon color="blue" size="sm" radius="xl">
                      <IconUserCheck size={14} />
                    </ThemeIcon>
                    <Text fw={700} c="var(--anican-azul-oscuro)">
                      Representantes con Cédula Registrada ({repConflicts.length})
                    </Text>
                  </Group>
                  <Stack gap="sm">
                    {repConflicts.map((c, i) => (
                      <Card withBorder key={c.cedula} p="sm" radius="md">
                        <Group justify="space-between" align="center">
                          <div style={{ flex: 1 }}>
                            <Text size="xs" c="dimmed">
                              Cédula: <strong style={{ color: "black" }}>{c.cedula}</strong>
                            </Text>
                            <Divider my={6} color="var(--anican-border)" />
                            <Table withColumnBorders verticalSpacing={4}>
                              <thead>
                                <tr>
                                  <th>Campo</th>
                                  <th>En el Sistema (BD)</th>
                                  <th>En el Excel</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Nombres</td>
                                  <td>{c.dbData.nombres}</td>
                                  <td
                                    style={{
                                      color:
                                        c.dbData.nombres !== c.excelData.nombres
                                          ? "var(--anican-naranja)"
                                          : "inherit",
                                      fontWeight:
                                        c.dbData.nombres !== c.excelData.nombres ? 600 : "normal",
                                    }}
                                  >
                                    {c.excelData.nombres}
                                  </td>
                                </tr>
                                <tr>
                                  <td>Teléfonos</td>
                                  <td>
                                    {c.dbData.telefono_1 || "—"} / {c.dbData.telefono_2 || "—"}
                                  </td>
                                  <td
                                    style={{
                                      color:
                                        c.dbData.telefono_1 !== c.excelData.telefono_1 ||
                                        c.dbData.telefono_2 !== c.excelData.telefono_2
                                          ? "var(--anican-naranja)"
                                          : "inherit",
                                    }}
                                  >
                                    {c.excelData.telefono_1 || "—"} / {c.excelData.telefono_2 || "—"}
                                  </td>
                                </tr>
                                <tr>
                                  <td>Residencia</td>
                                  <td>{c.dbData.residencia || "—"}</td>
                                  <td
                                    style={{
                                      color:
                                        c.dbData.residencia !== c.excelData.residencia
                                          ? "var(--anican-naranja)"
                                          : "inherit",
                                    }}
                                  >
                                    {c.excelData.residencia || "—"}
                                  </td>
                                </tr>
                              </tbody>
                            </Table>
                          </div>
                          <div style={{ width: 180, marginLeft: 16 }}>
                            <Text size="xs" fw={600} mb={4}>
                              Acción a tomar:
                            </Text>
                            <SegmentedControl
                              color="orange"
                              size="xs"
                              data={[
                                { label: "Actualizar", value: "UPDATE" },
                                { label: "Mantener", value: "KEEP_EXISTING" },
                              ]}
                              value={c.resolution}
                              onChange={(val) => {
                                const newConflicts = [...repConflicts];
                                newConflicts[i].resolution = val as "UPDATE" | "KEEP_EXISTING";
                                setRepConflicts(newConflicts);
                              }}
                            />
                          </div>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </div>
              )}

              {/* Conflictos de Pacientes */}
              {pacConflicts.length > 0 && (
                <div>
                  <Group gap="xs" mb="sm" mt="md">
                    <ThemeIcon color="yellow" size="sm" radius="xl">
                      <IconExclamationMark size={14} />
                    </ThemeIcon>
                    <Text fw={700} c="var(--anican-azul-oscuro)">
                      Pacientes con Datos Coincidentes ({pacConflicts.length})
                    </Text>
                  </Group>
                  <Stack gap="sm">
                    {pacConflicts.map((c, i) => (
                      <Card withBorder key={c.excelIndex} p="sm" radius="md">
                        <Group justify="space-between" align="center">
                          <div style={{ flex: 1 }}>
                            <Text size="xs" fw={700} c="orange">
                              Paciente: {c.excelData.nombres} {c.excelData.apellidos}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Tutor: {c.repNombres} ({c.repCedula}) | Nacimiento:{" "}
                              {c.excelData.fecha_nacimiento}
                            </Text>
                            <Text size="xs" c="red" mt={4} fw={500}>
                              ⚠️ Este paciente ya se encuentra registrado con ese mismo
                              representante y fecha de nacimiento.
                            </Text>
                          </div>
                          <div style={{ width: 220, marginLeft: 16 }}>
                            <Text size="xs" fw={600} mb={4}>
                              Acción a tomar:
                            </Text>
                            <SegmentedControl
                              color="orange"
                              size="xs"
                              data={[
                                { label: "Omitir Importación", value: "SKIP" },
                                { label: "Forzar Duplicado", value: "DUPLICATE" },
                              ]}
                              value={c.resolution}
                              onChange={(val) => {
                                const newConflicts = [...pacConflicts];
                                newConflicts[i].resolution = val as "SKIP" | "DUPLICATE";
                                setPacConflicts(newConflicts);
                              }}
                            />
                          </div>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </div>
              )}
            </Stack>
          </ScrollArea>

          <Group justify="space-between" mt="md">
            <MantineButton variant="subtle" color="gray" onClick={() => setStep("preview")}>
              Volver al Listado
            </MantineButton>
            <Group gap="xs">
              <Button variant="outline" color="gray" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={() => executeImport(repConflicts, pacConflicts)}>
                Confirmar e Importar
              </Button>
            </Group>
          </Group>
        </Stack>
      )}

      {/* 4. CARGANDO Y EJECUTANDO */}
      {step === "loading" && (
        <Stack align="center" gap="md" py="xl">
          <Loader color="orange" size="xl" type="bars" />
          <Text size="sm" fw={500} c="var(--anican-azul-oscuro)">
            {loadingText}
          </Text>
          <Text size="xs" c="dimmed">
            Por favor, no cierres esta ventana.
          </Text>
        </Stack>
      )}

      {/* 5. PASO DE RESULTADO */}
      {step === "result" && (
        <Stack gap="md" py="xs" align="center" style={{ textAlign: "center" }}>
          <ThemeIcon color="green" size="xl" radius="xl" variant="filled">
            <IconCheck size={30} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="lg" c="var(--anican-azul-oscuro)">
              ¡Importación Procesada con Éxito!
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              Los registros válidos del archivo Excel han sido sincronizados con el ERP.
            </Text>
          </div>

          <Card withBorder style={{ width: "100%", maxWidth: 400 }} radius="md" p="md" mt="sm">
            <Stack gap="xs" style={{ textAlign: "left" }}>
              <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: 0.5 }}>
                RESUMEN DE TRANSACCIONES:
              </Text>
              <Divider />
              <Group justify="space-between">
                <Text size="sm">Representantes Registrados:</Text>
                <Badge color="green" size="lg">
                  +{importSummary.repsCreados}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Representantes Actualizados:</Text>
                <Badge color="blue" size="lg">
                  {importSummary.repsActualizados}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Pacientes Importados:</Text>
                <Badge color="green" size="lg">
                  +{importSummary.pacsCreados}
                </Badge>
              </Group>
              {importSummary.pacsOmitidos > 0 && (
                <Group justify="space-between">
                  <Text size="sm">Pacientes Omitidos (Duplicados):</Text>
                  <Badge color="red" size="lg">
                    {importSummary.pacsOmitidos}
                  </Badge>
                </Group>
              )}
            </Stack>
          </Card>

          <Group justify="center" mt="md" style={{ width: "100%" }}>
            <Button onClick={handleClose} style={{ width: 150 }}>
              Cerrar
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};
