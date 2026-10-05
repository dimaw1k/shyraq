"use client";

import {
  ArrowUpRight,
  Camera,
  Check,
  ImagePlus,
  LockKeyhole,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatReportOpenTime, isReportOpen } from "@/lib/report-schedule";
import { useStudentLanguage } from "@/lib/student-language";

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
  labelKey: string;
  hintKey: string;
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
  morningReportOpenTime: string;
  eveningReportOpenTime: string;
};

const SLOT_CONFIG = [
  { key: "MORNING_MEET", labelKey: "meetAttendance", hintKey: "morningStudy" },
  { key: "PLAN", labelKey: "plan", hintKey: "todayPlan" },
  { key: "SCREEN_TIME", labelKey: "screenTime", hintKey: "screenStats" },
  { key: "PROCESS", labelKey: "process", hintKey: "studyProgress" },
] as const;

function createEmptySlots(): PhotoSlot[] {
  return SLOT_CONFIG.map((slot) => ({
    ...slot,
    file: null,
    preview: null,
  }));
}

function formatMinutes(value: number, t: (key: string) => string) {
  const minutes = Math.max(0, Math.round(value));
  if (minutes < 60) return minutes + " " + t("minutesLabel");

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return hours + " " + t("hours");
  return hours + " " + t("hours") + " " + String(rest).padStart(2, "0") + " " + t("minutesLabel");
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
  morningReportOpenTime,
  eveningReportOpenTime,
}: Props) {
  const { t } = useStudentLanguage("kk");
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("MORNING");
  const [now, setNow] = useState(0);

  const submitted = useMemo(
    () => new Set(reports.map((report) => report.report_type)),
    [reports],
  );

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const currentTime = now ? new Date(now) : new Date(0);
  const morningOpen = isReportOpen(morningReportOpenTime, currentTime);
  const eveningOpen = isReportOpen(eveningReportOpenTime, currentTime);

  function openReport(type: ReportType) {
    setReportType(type);
    setOpen(true);
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <SessionRow
          label={t("morningStudy")}
          minutes={morningMinutes}
          submitted={submitted.has("MORNING")}
          open={morningOpen}
          openTime={morningReportOpenTime}
          onReport={() => openReport("MORNING")}
        />
        <SessionRow
          label={t("eveningStudy")}
          minutes={eveningMinutes}
          submitted={submitted.has("EVENING")}
          open={eveningOpen}
          openTime={eveningReportOpenTime}
          onReport={() => openReport("EVENING")}
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {meetingUrl ? (
          <>
            <a
              href={meetingUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={meetingName + " — " + t("morningMeet")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#FF8000] px-3 text-[9px] font-semibold text-white transition hover:bg-[#E56F00]"
            >
              <Camera size={14} />
              {t("morningMeetJoin")}
              <ArrowUpRight size={12} />
            </a>

            <a
              href={meetingUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={meetingName + " — " + t("eveningMeet")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#FF8000] px-3 text-[9px] font-semibold text-white transition hover:bg-[#E56F00]"
            >
              <Camera size={14} />
              {t("eveningMeetJoin")}
              <ArrowUpRight size={12} />
            </a>
          </>
        ) : (
          <>
            <div className="flex h-10 items-center justify-center rounded-[11px] bg-[#F6F2ED] px-3 text-[9px] font-extrabold text-[#A19890]">
              {t("morningMeet")} — {t("meetingLinkMissing")}
            </div>
            <div className="flex h-10 items-center justify-center rounded-[11px] bg-[#F6F2ED] px-3 text-[9px] font-extrabold text-[#A19890]">
              {t("eveningMeet")} — {t("meetingLinkMissing")}
            </div>
          </>
        )}
      </div>

      {open ? (
        <ReportModal
          today={today}
          marathonDay={marathonDay}
          meetingUrl={meetingUrl}
          morningMinutes={morningMinutes}
          eveningMinutes={eveningMinutes}
          completedTaskCount={completedTaskCount}
          reportType={reportType}
          openTime={
            reportType === "MORNING"
              ? morningReportOpenTime
              : eveningReportOpenTime
          }
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
  open,
  openTime,
  onReport,
}: {
  label: string;
  minutes: number;
  submitted: boolean;
  open: boolean;
  openTime: string;
  onReport: () => void;
}) {
  const { t } = useStudentLanguage("kk");
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
          {submitted ? t("reportReady") : t("pending")}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[18px] font-extrabold tracking-[-.04em] text-[#172235]">
            {formatMinutes(minutes, t)}
          </p>
          <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
            {t("meetAttendance")}
          </p>
        </div>
        <button
          type="button"
          onClick={onReport}
          disabled={!open}
          className={[
            "inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-[10px] px-2.5 py-2 text-[8px] font-semibold shadow-[0_2px_10px_rgba(23,34,53,.05)] transition",
            open
              ? "bg-white text-[#FF8000] hover:bg-[#FFF8F2]"
              : "cursor-not-allowed bg-[#F4F0EB] text-[#AAA19A]",
          ].join(" ")}
          title={open ? undefined : formatReportOpenTime(openTime) + " " + t("reportOpensAt")}
        >
          {open ? (
            submitted ? t("reopen") : t("reportSubmit")
          ) : (
            <>
              <LockKeyhole size={10} />
              {t("reportSubmit")}
            </>
          )}
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
  openTime,
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
  openTime: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useStudentLanguage("kk");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<PhotoSlot[]>(() => createEmptySlots());
  const [loadedQuestionsKey, setLoadedQuestionsKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const questionsRequestKey = String(marathonDay ?? 0) + ":" + reportType;
  const loadingQuestions = loadedQuestionsKey !== questionsRequestKey;
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

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
          throw new Error(payload?.error ?? t("reportQuestionLoadFailed"));
        }
        if (active) {
          setQuestions(payload.questions ?? []);
          setLoadedQuestionsKey(questionsRequestKey);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : t("reportQuestionLoadFailed"));
          setLoadedQuestionsKey(questionsRequestKey);
        }
      })
    return () => {
      active = false;
    };
  }, [questionsRequestKey, marathonDay, reportType]);

  useEffect(() => {
    if (!openBodyLock()) return undefined;
    return () => unlockBody();
  }, []);

  function handleFile(slotKey: PhotoSlot["key"], file: File | null) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("photoFormatError"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t("photoSizeError"));
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
      setError(t("allFourPhotos").replace("{slot}", t(missingPhoto.labelKey)));
      return;
    }

    const missingQuestion = questions.find(
      (question) =>
        question.required &&
        !String(answers[question.field_key] ?? "").trim(),
    );

    if (missingQuestion) {
      setError(t("questionRequired").replace("{question}", missingQuestion.question));
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
        throw new Error(reportPayload?.error ?? t("reportSaveFailed"));
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
            throw new Error(t("uploadFileFailed") + ": " + t(slot.labelKey));
          }

          return payload;
        }),
      );

      if (!uploadResults.length) {
        throw new Error(t("filesLoadFailed"));
      }

      setNotice(
        reportType === "MORNING"
          ? t("reportSentMorning")
          : t("reportSentEvening"),
      );

      window.setTimeout(onSubmitted, 500);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t("reportSendFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  const title = reportType === "MORNING" ? t("morningReport") : t("eveningReport");
  const subtitle =
    reportType === "MORNING"
      ? t("shortStartReport")
      : t("dailySummary");

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#172235]/35 p-0 backdrop-blur-[4px] sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[26px] bg-[#FAF9F7] shadow-[0_30px_90px_rgba(23,34,53,.25)] sm:max-w-[780px] sm:rounded-[26px]">
        <div className="flex items-center gap-3 border-b border-[#E8E3DD] bg-white px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
              {t("studyTime").toUpperCase()} · {marathonDay ? marathonDay + "-" + t("day").toUpperCase() : t("today").toUpperCase()}
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
            aria-label={t("close")}
          >
            <X size={17} />
          </button>
        </div>

        <div className="border-b border-[#E8E3DD] bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-[#FFF1E2] px-2.5 py-1 text-[8px] font-extrabold text-[#C15F00]">
              {reportType === "MORNING" ? t("morningReport") : t("eveningReport")}
            </span>
            <span className="text-[8px] font-semibold text-[#8B8179]">
              {t("fourPhotos")}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[8px] font-semibold text-[#8B8179]">
              {t("reportOpenedTime")}: {formatReportOpenTime(openTime)}
            </span>
            {meetingUrl ? (
              <a
                href={meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[8px] font-semibold text-[#FF8000]"
              >
                {t("meetJoin")} <ArrowUpRight size={11} />
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
                    {t("photoReport")}
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
                    {t("photoHint")}
                  </p>
                </div>
                <ImagePlus size={15} className="text-[#FF8000]" />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {files.map((slot) => (
                  <PhotoPicker key={slot.key} slot={slot} onFile={handleFile} t={t} />
                ))}
              </div>
            </section>

            <section className="rounded-[16px] border border-[#E8E3DD] bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-extrabold text-[#172235]">
                    {t("answerQuestions")}
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
                    {t("answerHintShort")}
                  </p>
                </div>
                <Sparkles size={15} className="text-[#FF8000]" />
              </div>

              {loadingQuestions ? (
                <div className="mt-4 rounded-[12px] bg-[#FAF9F7] px-3 py-4 text-[9px] font-semibold text-[#9A9189]">
                  {t("questionsLoading")}
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
                          placeholder={t("answerPlaceholder")}
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
              t("submitting")
            ) : (
              <>
                <Send size={14} />
                {t("sendReportFor").replace("{title}", title)}
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
  t,
}: {
  slot: PhotoSlot;
  onFile: (slot: PhotoSlot["key"], file: File | null) => void;
  t: (key: string) => string;
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
              {t(slot.labelKey)}
            </p>
            <p className="mt-1 text-[7px] font-semibold text-[#9A9189]">
              {t(slot.hintKey)}
            </p>
          </div>
        </div>
      )}

      <span className="absolute left-2 top-2 rounded-full bg-[#172235]/78 px-2 py-1 text-[7px] font-extrabold text-white">
        {t(slot.labelKey)}
      </span>

      {slot.preview ? (
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/92 px-2 py-1 text-[7px] font-extrabold text-[#FF8000]">
          <Check size={9} strokeWidth={3} />
          {t("ready")}
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
