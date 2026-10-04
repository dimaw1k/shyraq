"use client";

import {
  ArrowUpRight,
  Camera,
  Check,
  Clock3,
  ImagePlus,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReportType = "MORNING" | "EVENING";

type Question = {
  id: string;
  question: string;
  field_key: string;
  field_type: string;
  required: boolean;
  sort_order: number;
};

type ExistingReport = {
  report_type: ReportType;
  status: string;
};

type PhotoSlot = {
  key: "MORNING_MEET" | "PLAN" | "SCREEN_TIME" | "PROCESS";
  label: string;
  hint: string;
  file: File | null;
  preview: string | null;
};

type Props = {
  meetingUrl: string | null;
  meetingName: string;
  today: string;
  marathonDay: number | null;
  morningMinutes: number;
  eveningMinutes: number;
  reports: ExistingReport[];
  completedTaskCount: number;
};

const SLOT_CONFIG: Omit<PhotoSlot, "file" | "preview">[] = [
  {
    key: "MORNING_MEET",
    label: "Study Time",
    hint: "Миттегі қатысу / экран",
  },
  {
    key: "PLAN",
    label: "Жоспар",
    hint: "Бүгінгі жоспарың",
  },
  {
    key: "SCREEN_TIME",
    label: "Screen Time",
    hint: "Күннің экран статистикасы",
  },
  {
    key: "PROCESS",
    label: "Процесс",
    hint: "Бүгінгі оқу барысы",
  },
];

const EMPTY_SLOTS: PhotoSlot[] = SLOT_CONFIG.map((slot) => ({
  ...slot,
  file: null,
  preview: null,
}));

function formatMinutes(value: number) {
  const minutes = Math.max(0, Math.round(value));
  if (minutes < 60) return minutes + " мин";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? hours + " сағ " + rest + " мин" : hours + " сағ";
}

export function StudyTimeCard({
  meetingUrl,
  meetingName,
  today,
  marathonDay,
  morningMinutes,
  eveningMinutes,
  reports,
  completedTaskCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("MORNING");

  const submitted = useMemo(
    () => new Set(reports.map((report) => report.report_type)),
    [reports],
  );

  function openReport(type: ReportType) {
    setReportType(type);
    setOpen(true);
  }

  return (
    <>
      <section className="rounded-[22px] border border-[#E8E3DD] bg-white p-4 shadow-[0_12px_34px_rgba(23,34,53,.045)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
              STUDY TIME
            </p>
            <h2 className="mt-1 text-[17px] font-extrabold tracking-[-.04em] text-[#172235]">
              Күннің оқу ырғағы
            </h2>
            <p className="mt-1 text-[9px] font-semibold leading-4 text-[#8B8179]">
              Google Meet → оқу → күндік есеп. Барлығы бір жерден.
            </p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
            <Sparkles size={16} />
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <SessionRow
            label="Таңғы Study Time"
            minutes={morningMinutes}
            submitted={submitted.has("MORNING")}
            onReport={() => openReport("MORNING")}
          />
          <SessionRow
            label="Кешкі Study Time"
            minutes={eveningMinutes}
            submitted={submitted.has("EVENING")}
            onReport={() => openReport("EVENING")}
          />
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {meetingUrl ? (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#FF8000] px-3 text-[9px] font-extrabold text-white transition hover:bg-[#E56F00]"
            >
              <Camera size={14} />
              {meetingName || "Google Meet-ке кіру"}
              <ArrowUpRight size={12} />
            </a>
          ) : (
            <div className="flex h-10 flex-1 items-center justify-center rounded-[11px] bg-[#F6F2ED] px-3 text-[9px] font-extrabold text-[#A19890]">
              Meet сілтемесі әлі қосылмаған
            </div>
          )}

          <button
            type="button"
            onClick={() => openReport(reportType)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[11px] border border-[#E8E3DD] bg-[#FFFCF9] px-3 text-[9px] font-extrabold text-[#3F3832] transition hover:border-[#F3C7B0] hover:text-[#FF8000]"
          >
            <Send size={13} />
            Есеп тапсыру
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-[#FFF9F3] px-3 py-2.5 text-[8px] font-semibold text-[#7C6C5D]">
          <Clock3 size={12} className="shrink-0 text-[#FF8000]" />
          Study Time минуттары Meet қатысуынан автоматты есептеледі.
        </div>
      </section>

      {open ? (
        <ReportModal
          today={today}
          marathonDay={marathonDay}
          meetingUrl={meetingUrl}
          reportType={reportType}
          onReportTypeChange={setReportType}
          onClose={() => setOpen(false)}
          onSubmitted={() => {
            setOpen(false);
            window.location.reload();
          }}
        />
      ) : null}
    </>
  );
}

function SessionRow({
  label,
  minutes,
  submitted,
  onReport,
}: {
  label: string;
  minutes: number;
  submitted: boolean;
  onReport: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-[#EEE7E0] bg-[#FFFCF9] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-extrabold text-[#172235]">{label}</p>
        <span
          className={[
            "rounded-full px-2 py-1 text-[7px] font-extrabold",
            submitted
              ? "bg-[#EAF7F0] text-[#2E7E58]"
              : "bg-[#FFF1E2] text-[#C15F00]",
          ].join(" ")}
        >
          {submitted ? "Есеп дайын" : "Күтілуде"}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[18px] font-extrabold tracking-[-.04em] text-[#172235]">
            {formatMinutes(minutes)}
          </p>
          <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
            Meet қатысуы
          </p>
        </div>
        <button
          type="button"
          onClick={onReport}
          className="rounded-[10px] bg-white px-2.5 py-2 text-[8px] font-extrabold text-[#FF8000] shadow-[0_2px_10px_rgba(23,34,53,.05)]"
        >
          {submitted ? "Қайта ашу" : "Есеп беру"}
        </button>
      </div>
    </div>
  );
}

function ReportModal({
  today,
  marathonDay,
  meetingUrl,
  morningMinutes,
  eveningMinutes,
  completedTaskCount,
  reportType,
  onReportTypeChange,
  onClose,
  onSubmitted,
}: {
  today: string;
  marathonDay: number | null;
  meetingUrl: string | null;
  morningMinutes: number;
  eveningMinutes: number;
  completedTaskCount: number;
  reportType: ReportType;
  onReportTypeChange: (value: ReportType) => void;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<PhotoSlot[]>(EMPTY_SLOTS);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingQuestions(true);
    setError("");

    fetch(
      "/api/reports/questions?day=" +
        encodeURIComponent(String(marathonDay ?? 0)) +
        "&type=" +
        encodeURIComponent(reportType),
      { cache: "no-store" },
    )
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error ?? "Сұрақтар жүктелмеді.");
        }
        if (active) setQuestions(payload.questions ?? []);
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Сұрақтар жүктелмеді.");
        }
      })
      .finally(() => {
        if (active) setLoadingQuestions(false);
      });

    return () => {
      active = false;
    };
  }, [marathonDay, reportType]);

  useEffect(() => {
    if (!openBodyLock()) return undefined;
    return () => unlockBody();
  }, []);

  function handleFile(slotKey: PhotoSlot["key"], file: File | null) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Фото JPG, PNG немесе WebP болуы керек.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Бір фото 10 MB-тан аспауы керек.");
      return;
    }

    const preview = URL.createObjectURL(file);

    setFiles((current) =>
      current.map((slot) =>
        slot.key === slotKey
          ? {
              ...slot,
              file,
              preview,
            }
          : slot,
      ),
    );
    setError("");
  }

  async function submit() {
    if (saving) return;

    const missingPhoto = files.find((slot) => !slot.file);
    if (missingPhoto) {
      setError("Барлық 4 фотоны қосу керек: " + missingPhoto.label + ".");
      return;
    }

    const missingQuestion = questions.find(
      (question) =>
        question.required &&
        !String(answers[question.field_key] ?? "").trim(),
    );

    if (missingQuestion) {
      setError("«" + missingQuestion.question + "» сұрағына жауап бер.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const reportResponse = await fetch("/api/reports/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: today,
          reportType,
          marathonDay,
          studyMinutes:
            reportType === "MORNING" ? morningMinutes : eveningMinutes,
          completedTaskCount,
          answers,
        }),
      });

      const reportPayload = await reportResponse.json().catch(() => ({}));

      if (!reportResponse.ok || !reportPayload?.report?.id) {
        throw new Error(reportPayload?.error ?? "Есепті сақтау мүмкін болмады.");
      }

      const uploadResults = await Promise.all(
        files.map(async (slot) => {
          const data = new FormData();
          data.append("reportId", reportPayload.report.id);
          data.append("slot", slot.key);
          data.append("file", slot.file as File);

          const response = await fetch("/api/reports/files", {
            method: "POST",
            body: data,
          });
          const payload = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(payload?.error ?? slot.label + " фотосы жүктелмеді.");
          }

          return payload;
        }),
      );

      if (!uploadResults.length) {
        throw new Error("Файлдар жүктелмеді.");
      }

      setNotice(
        reportType === "MORNING"
          ? "Таңғы есеп сәтті жіберілді."
          : "Кешкі есеп сәтті жіберілді.",
      );

      window.setTimeout(onSubmitted, 500);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Есепті жіберу кезінде қате шықты.",
      );
    } finally {
      setSaving(false);
    }
  }

  const title = reportType === "MORNING" ? "Таңғы есеп" : "Кешкі есеп";
  const subtitle =
    reportType === "MORNING"
      ? "Study Time-нан кейінгі қысқа старт есебі"
      : "Күн нәтижесін бекітетін қысқа қорытынды";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#172235]/35 p-0 backdrop-blur-[4px] sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[26px] bg-[#FAF9F7] shadow-[0_30px_90px_rgba(23,34,53,.25)] sm:max-w-[780px] sm:rounded-[26px]">
        <div className="flex items-center gap-3 border-b border-[#E8E3DD] bg-white px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
              STUDY TIME · {marathonDay ? marathonDay + "-КҮН" : "БҮГІН"}
            </p>
            <h2 className="mt-0.5 text-[18px] font-extrabold tracking-[-.04em] text-[#172235]">
              {title}
            </h2>
            <p className="mt-0.5 text-[8px] font-semibold text-[#948A82]">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-9 w-9 place-items-center rounded-[11px] text-[#8B8179] hover:bg-[#F3EEE9] disabled:opacity-50"
            aria-label="Жабу"
          >
            <X size={17} />
          </button>
        </div>

        <div className="border-b border-[#E8E3DD] bg-white px-4 py-3 sm:px-5">
          <div className="grid grid-cols-2 gap-1.5 rounded-[12px] bg-[#F4F0EB] p-1">
            {(["MORNING", "EVENING"] as ReportType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onReportTypeChange(type)}
                className={[
                  "h-9 rounded-[10px] text-[9px] font-extrabold transition",
                  reportType === type
                    ? "bg-[#FF8000] text-white shadow-[0_5px_14px_rgba(255,128,0,.16)]"
                    : "text-[#81786F] hover:bg-white",
                ].join(" ")}
              >
                {type === "MORNING" ? "Таңғы" : "Кешкі"}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[8px] font-semibold text-[#8B8179]">
              4 фото + қысқа жауаптар
            </span>
            {meetingUrl ? (
              <a
                href={meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[8px] font-extrabold text-[#FF8000]"
              >
                Meet-ке кіру <ArrowUpRight size={11} />
              </a>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-3">
            <section className="rounded-[16px] border border-[#E8E3DD] bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-extrabold text-[#172235]">
                    Фото есебі
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
                    Әр фотоны өз орнына жүкте.
                  </p>
                </div>
                <ImagePlus size={15} className="text-[#FF8000]" />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {files.map((slot) => (
                  <PhotoPicker key={slot.key} slot={slot} onFile={handleFile} />
                ))}
              </div>
            </section>

            <section className="rounded-[16px] border border-[#E8E3DD] bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-extrabold text-[#172235]">
                    Сұрақтарға жауап
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
                    Жауаптарыңды қысқа, нақты жаз.
                  </p>
                </div>
                <Sparkles size={15} className="text-[#FF8000]" />
              </div>

              {loadingQuestions ? (
                <div className="mt-4 rounded-[12px] bg-[#FAF9F7] px-3 py-4 text-[9px] font-semibold text-[#9A9189]">
                  Сұрақтар жүктелуде...
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {questions.map((question) => (
                    <label
                      key={question.id}
                      className="block text-[9px] font-extrabold text-[#3F3832]"
                    >
                      {question.question}
                      {question.required ? " *" : ""}
                      {question.field_type === "SHORT_TEXT" ? (
                        <input
                          value={answers[question.field_key] ?? ""}
                          onChange={(event) =>
                            setAnswers((current) => ({
                              ...current,
                              [question.field_key]: event.target.value,
                            }))
                          }
                          className="mt-1.5 h-10 w-full rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] px-3 text-[10px] font-semibold text-[#172235] outline-none focus:border-[#F3C7B0] focus:bg-white"
                        />
                      ) : (
                        <textarea
                          rows={3}
                          value={answers[question.field_key] ?? ""}
                          onChange={(event) =>
                            setAnswers((current) => ({
                              ...current,
                              [question.field_key]: event.target.value,
                            }))
                          }
                          className="mt-1.5 w-full rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] px-3 py-2.5 text-[10px] font-semibold leading-5 text-[#172235] outline-none focus:border-[#F3C7B0] focus:bg-white"
                          placeholder="Жауабыңды жаз..."
                        />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </section>

            {error ? (
              <div className="rounded-[12px] border border-[#F4D0CB] bg-[#FFF7F5] px-3.5 py-2.5 text-[9px] font-bold text-[#B54D2B]">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="rounded-[12px] border border-[#D9EEDF] bg-[#F2FAF4] px-3.5 py-2.5 text-[9px] font-bold text-[#2E7E58]">
                {notice}
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#E8E3DD] bg-white p-3.5 sm:p-4">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || loadingQuestions}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#FF8000] px-4 text-[10px] font-extrabold text-white shadow-[0_10px_22px_rgba(255,128,0,.18)] transition hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {saving ? (
              "Жіберілуде..."
            ) : (
              <>
                <Send size={14} />
                {title}ді жіберу
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoPicker({
  slot,
  onFile,
}: {
  slot: PhotoSlot;
  onFile: (slot: PhotoSlot["key"], file: File | null) => void;
}) {
  return (
    <label className="group relative block overflow-hidden rounded-[13px] border border-dashed border-[#DCCFC4] bg-[#FAF9F7]">
      {slot.preview ? (
        <img
          src={slot.preview}
          alt=""
          className="h-[150px] w-full object-cover"
        />
      ) : (
        <div className="grid h-[150px] place-items-center px-4 text-center">
          <div>
            <span className="mx-auto grid h-9 w-9 place-items-center rounded-[10px] bg-white text-[#FF8000] shadow-sm">
              <Upload size={15} />
            </span>
            <p className="mt-2 text-[9px] font-extrabold text-[#172235]">
              {slot.label}
            </p>
            <p className="mt-1 text-[7px] font-semibold text-[#9A9189]">
              {slot.hint}
            </p>
          </div>
        </div>
      )}

      <span className="absolute left-2 top-2 rounded-full bg-[#172235]/78 px-2 py-1 text-[7px] font-extrabold text-white">
        {slot.label}
      </span>

      {slot.preview ? (
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/92 px-2 py-1 text-[7px] font-extrabold text-[#FF8000]">
          <Check size={9} strokeWidth={3} />
          Дайын
        </span>
      ) : null}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          onFile(slot.key, event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function openBodyLock() {
  if (typeof document === "undefined") return false;
  document.body.style.overflow = "hidden";
  return true;
}

function unlockBody() {
  document.body.style.overflow = "";
}
