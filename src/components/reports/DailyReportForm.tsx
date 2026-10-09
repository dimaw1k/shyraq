"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileText, ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ReportQuestion = {
  id: string;
  question: string;
  field_key: string;
  field_type: string;
  required: boolean;
  sort_order: number;
};

type ReportFileSlot = "MORNING_MEET" | "PLAN" | "SCREEN_TIME" | "PROCESS";
type ReportFileSelection = Partial<Record<ReportFileSlot, File>>;

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const FILE_SLOTS: Array<{ key: ReportFileSlot; label: string; hint: string }> = [
  { key: "MORNING_MEET", label: "Google Meet қатысуы", hint: "Қатысқаныңды растайтын скриншот" },
  { key: "PLAN", label: "Күндік жоспар", hint: "Жоспарыңның фотосы немесе файлы" },
  { key: "SCREEN_TIME", label: "Экран уақыты", hint: "Screen Time статистикасының скриншоты" },
  { key: "PROCESS", label: "Жұмыс барысы", hint: "Тапсырманы орындау барысындағы дәлел" },
];

const input = "mt-2 w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-medium text-[#172235] outline-none transition focus:border-[#FF6F2C] focus:bg-white focus:ring-4 focus:ring-[#FF6F2C]/10";

function getMimeType(file: File) {
  if (ALLOWED_MIME_TYPES.has(file.type)) return file.type;
  const extension = file.name.toLowerCase().split(".").pop();
  const byExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return extension ? byExtension[extension] ?? "" : "";
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

export function DailyReportForm({ marathonDay }: { marathonDay?: number }) {
  const today = useMemo(() => {
    const date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }, []);

  const [form, setForm] = useState({
    reportDate: today,
    studyMinutes: "",
    completedTaskCount: "",
    reflection: "",
    difficulties: "",
    nextDayGoal: "",
  });
  const [questions, setQuestions] = useState<ReportQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<ReportFileSelection>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    let active = true;
    const suffix = marathonDay ? "?day=" + encodeURIComponent(String(marathonDay)) : "";
    fetch("/api/reports/questions" + suffix, { cache: "no-store" })
      .then(async (response) => {
        const data = await readJson(response);
        if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Есеп сұрақтарын жүктеу мүмкін болмады.");
        if (active) setQuestions(((data.questions ?? []) as ReportQuestion[]).sort((a, b) => a.sort_order - b.sort_order));
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Есеп сұрақтарын жүктеу мүмкін болмады.");
      });
    return () => { active = false; };
  }, [marathonDay]);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  function chooseFile(slot: ReportFileSlot, file?: File) {
    if (!file) {
      setSelectedFiles((current) => {
        const next = { ...current };
        delete next[slot];
        return next;
      });
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(getMimeType(file))) {
      setMessage("Тек JPG, PNG, WEBP, PDF, DOC немесе DOCX файлдарын жүктеуге болады.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      setMessage("Әр файлдың көлемі 20 МБ-тан аспауы керек.");
      return;
    }

    setMessage("");
    setSelectedFiles((current) => ({ ...current, [slot]: file }));
  }

  async function uploadReportFile(reportId: string, slot: ReportFileSlot, file: File, index: number, total: number) {
    const mimeType = getMimeType(file);
    setProgress("Файл жүктелуде (" + index + "/" + total + "): " + file.name);

    const prepareResponse = await fetch("/api/reports/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "prepare",
        reportId,
        slot,
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
      }),
      cache: "no-store",
    });
    const prepared = await readJson(prepareResponse);

    if (
      !prepareResponse.ok ||
      typeof prepared.storagePath !== "string" ||
      typeof prepared.token !== "string"
    ) {
      throw new Error(typeof prepared.error === "string" ? prepared.error : "Файл жүктеуге дайындалмады.");
    }

    const browserSupabase = createBrowserSupabaseClient();
    const { error: uploadError } = await browserSupabase.storage
      .from("submissions")
      .uploadToSignedUrl(prepared.storagePath, prepared.token, file, { contentType: mimeType });

    if (uploadError) {
      throw new Error("«" + file.name + "» файлын сақтау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.");
    }

    const completeResponse = await fetch("/api/reports/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        reportId,
        slot,
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
        storagePath: prepared.storagePath,
      }),
      cache: "no-store",
    });
    const completed = await readJson(completeResponse);

    if (!completeResponse.ok) {
      throw new Error(typeof completed.error === "string" ? completed.error : "Жүктелген файлды тексеру мүмкін болмады.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setProgress("");

    try {
      const selected = FILE_SLOTS
        .filter((slot) => selectedFiles[slot.key])
        .map((slot) => ({ slot: slot.key, file: selectedFiles[slot.key] as File }));

      const reportResponse = await fetch("/api/reports/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: form.reportDate,
          marathonDay,
          studyMinutes: Number(form.studyMinutes || 0),
          completedTaskCount: Number(form.completedTaskCount || 0),
          reflection: form.reflection,
          difficulties: form.difficulties,
          nextDayGoal: form.nextDayGoal,
          answers,
        }),
        cache: "no-store",
      });
      const reportData = await readJson(reportResponse);
      if (!reportResponse.ok) {
        throw new Error(typeof reportData.error === "string" ? reportData.error : "Есепті жіберу кезінде қате болды.");
      }

      const savedReport = reportData.report as { id?: unknown } | undefined;
      const reportId = typeof savedReport?.id === "string" ? savedReport.id : "";
      if (selected.length && !reportId) {
        throw new Error("Есеп сақталды, бірақ файл жүктеу үшін есеп идентификаторы алынбады. Әкімшіге хабарласыңыз.");
      }

      for (let index = 0; index < selected.length; index++) {
        const selectedFile = selected[index];
        await uploadReportFile(reportId, selectedFile.slot, selectedFile.file, index + 1, selected.length);
      }

      setSelectedFiles({});
      setMessage(selected.length ? "Есеп пен " + selected.length + " файл сәтті жіберілді." : "Есеп жіберілді.");
      setProgress("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате болды. Қайта көріңіз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">
        {marathonDay ? marathonDay + "-КҮН" : "БҮГІН"}
      </p>
      <h2 className="mt-1.5 text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">Оқу есебі</h2>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-[11px] font-extrabold text-[#3F3832]">
          Күні
          <input type="date" value={form.reportDate} onChange={(event) => update("reportDate", event.target.value)} className={input} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[11px] font-extrabold text-[#3F3832]">
            Оқу минуттары
            <input type="number" min="0" value={form.studyMinutes} onChange={(event) => update("studyMinutes", event.target.value)} className={input} />
          </label>
          <label className="block text-[11px] font-extrabold text-[#3F3832]">
            Орындалған тапсырма
            <input type="number" min="0" value={form.completedTaskCount} onChange={(event) => update("completedTaskCount", event.target.value)} className={input} />
          </label>
        </div>

        <div className="rounded-[16px] border border-[#F1E4D8] bg-[#FFF9F3] px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#C25100]">КҮНДЕЛІКТІ ЕСЕП</p>
          <p className="mt-1 text-xs leading-5 text-[#665B52]">Бүгінгі күніңді қысқа, нақты және шынайы қорытындыла. Әр бөлімді толықтыр.</p>
        </div>

        {questions.map((question) => (
          <label key={question.id} className="block text-[11px] font-extrabold text-[#3F3832]">
            {question.question}{question.required ? " *" : ""}
            {question.field_type === "NUMBER" ? (
              <input required={question.required} type="number" value={answers[question.field_key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.field_key]: event.target.value }))} className={input} />
            ) : question.field_type === "SHORT_TEXT" ? (
              <input required={question.required} maxLength={5000} value={answers[question.field_key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.field_key]: event.target.value }))} className={input} />
            ) : (
              <textarea required={question.required} rows={4} maxLength={5000} placeholder="Жауабыңды толық жаз..." value={answers[question.field_key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.field_key]: event.target.value }))} className={input} />
            )}
          </label>
        ))}

        <section className="space-y-3 rounded-[18px] border border-[#EFE8E1] bg-white p-4">
          <div>
            <div className="flex items-center gap-2 text-[#C25100]">
              <ImagePlus size={16} />
              <h3 className="text-xs font-extrabold text-[#3F3832]">Есепке файл тіркеу</h3>
            </div>
            <p className="mt-1 text-[10px] leading-5 text-[#9A9189]">Әр бөлімге бір файлға дейін. JPG, PNG, WEBP, PDF, DOC, DOCX · 20 МБ-тан аспасын.</p>
          </div>

          {FILE_SLOTS.map((slot) => {
            const file = selectedFiles[slot.key];
            const inputId = "report-file-" + slot.key.toLowerCase();
            return (
              <div key={slot.key} className="rounded-[14px] border border-[#F0E8E1] bg-[#FFFCF9] p-3">
                <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#C25100]">
                    <UploadCloud size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold text-[#3F3832]">{slot.label}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-[#9A9189]">{slot.hint}</span>
                    <span className="mt-1.5 block break-all text-[10px] font-semibold text-[#C25100]">
                      {file ? file.name + " · " + (file.size / (1024 * 1024)).toFixed(2) + " МБ" : "Файл таңдау"}
                    </span>
                  </span>
                  <input
                    id={inputId}
                    type="file"
                    className="sr-only"
                    disabled={loading}
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => chooseFile(slot.key, event.target.files?.[0])}
                  />
                </label>
                {file ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => chooseFile(slot.key)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-[#98513A] hover:bg-[#FFF0E8] disabled:opacity-50"
                  >
                    <X size={12} /> Файлды алып тастау
                  </button>
                ) : null}
              </div>
            );
          })}
        </section>

        {progress ? (
          <div className="flex items-center gap-2 rounded-[14px] border border-[#FFDDBB] bg-[#FFF9F3] px-3.5 py-3 text-xs font-semibold text-[#88501E]" aria-live="polite">
            <LoaderCircle size={15} className="animate-spin" />
            <span className="min-w-0 break-all">{progress}</span>
          </div>
        ) : null}

        {message ? (
          <div role="status" className="rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-semibold text-[#5C5149]">
            {message}
          </div>
        ) : null}

        <button disabled={loading} className="w-full rounded-[14px] bg-[#FF6F2C] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">
          {loading ? "Жіберілуде..." : "Есепті жіберу"}
        </button>
      </form>
    </div>
  );
}
