"use client";

import {
  ArrowLeft,
  Bell,
  BellOff,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Dumbbell,
  Library,
  ListTodo,
  Moon,
  PenLine,
  Sparkles,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStudentLanguage } from "@/lib/student-language";

type CreatedHabit = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_default: boolean;
  sort_order: number;
  frequency: "DAILY" | "WEEKLY" | "REPEAT";
  weekdays: number[];
  goal: string | null;
  start_date: string;
  goal_days: number | null;
  section: string;
  reminder_time: string | null;
  repeat_interval: number;
  repeat_unit: "DAY" | "WEEK";
};

type Props = {
  open: boolean;
  today: string;
  onClose: () => void;
  onCreated: (habit: CreatedHabit) => void;
};

const ICON_OPTIONS = [
  ["Sparkles", Sparkles],
  ["BookOpen", BookOpen],
  ["Dumbbell", Dumbbell],
  ["ListTodo", ListTodo],
  ["Library", Library],
  ["PenLine", PenLine],
  ["Moon", Moon],
  ["Smartphone", Smartphone],
] as const;

const WEEKDAYS = [
  [1, "monShort"],
  [2, "tueShort"],
  [3, "wedShort"],
  [4, "thuShort"],
  [5, "friShort"],
  [6, "satShort"],
  [7, "sunShort"],
] as const;

const DURATION_OPTIONS = [
  { value: "forever", label: "Мәңгі", days: null },
  { value: "7", label: "7 күн", days: 7 },
  { value: "21", label: "21 күн", days: 21 },
  { value: "30", label: "30 күн", days: 30 },
  { value: "100", label: "100 күн", days: 100 },
  { value: "365", label: "365 күн", days: 365 },
  { value: "custom", label: "Өзім", days: null },
] as const;

const SECTIONS = ["Таңертең", "Күндіз", "Кешке", "Басқа"] as const;

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function HabitCreateModal({
  open,
  today,
  onClose,
  onCreated,
}: Props) {
  const { t } = useStudentLanguage("kk");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "REPEAT">(
    "DAILY",
  );
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [duration, setDuration] = useState("forever");
  const [customDays, setCustomDays] = useState("");
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Күндіз");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [repeatInterval, setRepeatInterval] = useState("1");
  const [repeatUnit, setRepeatUnit] = useState<"DAY" | "WEEK">("DAY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, saving]);

  const goalDays = useMemo(() => {
    if (duration === "custom") {
      const parsed = Number(customDays);
      return Number.isInteger(parsed) && parsed >= 1 && parsed <= 999
        ? parsed
        : null;
    }

    return DURATION_OPTIONS.find((item) => item.value === duration)?.days ?? null;
  }, [customDays, duration]);

  function toggleWeekday(day: number) {
    if (frequency === "DAILY") return;

    setWeekdays((current) =>
      current.includes(day)
        ? current.length === 1
          ? current
          : current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  async function saveHabit() {
    if (saving) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedRepeatInterval = Number(repeatInterval);

    if (trimmedName.length < 2 || trimmedName.length > 60) {
      setError(t("habitNameValidation"));
      return;
    }

    if (trimmedDescription.length > 140) {
      setError(t("habitDescriptionValidation"));
      return;
    }

    if (!validDate(startDate)) {
      setError(t("startDateValidation"));
      return;
    }

    if (frequency === "WEEKLY" && weekdays.length === 0) {
      setError(t("chooseDay"));
      return;
    }

    if (duration === "custom" && !goalDays) {
      setError(t("durationValidation"));
      return;
    }

    if (
      frequency === "REPEAT" &&
      (!Number.isInteger(parsedRepeatInterval) ||
        parsedRepeatInterval < 1 ||
        parsedRepeatInterval > 365)
    ) {
      setError(t("repeatValidation"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
          icon,
          frequency,
          weekdays: frequency === "DAILY" ? [1, 2, 3, 4, 5, 6, 7] : weekdays,
          goal: goal.trim(),
          startDate,
          goalDays,
          section,
          reminderTime: reminderEnabled ? reminderTime : null,
          repeatInterval:
            frequency === "REPEAT" ? parsedRepeatInterval : 1,
          repeatUnit: frequency === "REPEAT" ? repeatUnit : "DAY",
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.habit) {
        setError(payload?.error ?? t("habitSaveFailed"));
        return;
      }

      onCreated(payload.habit);
      onClose();
    } catch {
      setError(t("serverConnectionError"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#172235]/35 p-3 backdrop-blur-[5px] sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="habit-create-title"
        className="flex max-h-[calc(100dvh-56px)] w-full min-h-0 flex-col overflow-hidden rounded-[22px] bg-[#FAF9F7] shadow-[0_30px_90px_rgba(23,34,53,.22)] sm:max-h-[calc(100dvh-72px)] sm:max-w-[760px] sm:rounded-[22px]"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-[#E8E3DD] bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] text-[#6F665E] transition hover:border-[#F3C7B0] hover:text-[#FF8000] disabled:opacity-50"
            aria-label={t("close")}
          >
            <ArrowLeft size={17} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#A19890]">
              {t("newHabit")}
            </p>
            <h2
              id="habit-create-title"
              className="mt-0.5 truncate text-[18px] font-extrabold tracking-[-.045em] text-[#172235]"
            >
              {t("configureHabit")}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-[#9A9189] transition hover:bg-[#F4F0EB] hover:text-[#172235] disabled:opacity-50"
            aria-label={t("close")}
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3 sm:px-5 sm:py-4">
          <div className="space-y-3">
            <section className="rounded-[18px] border border-[#E8E3DD] bg-white p-4">
              <div className="grid gap-2.5">
                <div>
                  <label className="text-[9px] font-extrabold text-[#172235]">
                    {t("habitNameLabel")}
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={60}
                    autoFocus
                    placeholder={t("habitExample")}
                    className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E3DD] bg-[#FAF9F7] px-3.5 text-[11px] font-semibold text-[#172235] outline-none transition focus:border-[#F3C7B0] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-[#172235]">
                    {t("descriptionOptional")}
                  </label>
                  <input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={140}
                    placeholder={t("writeBriefly")}
                    className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E3DD] bg-[#FAF9F7] px-3.5 text-[11px] font-semibold text-[#172235] outline-none transition focus:border-[#F3C7B0] focus:bg-white"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-extrabold text-[#172235]">{t("icon")}</p>
                  <div className="mt-1.5 grid grid-cols-8 gap-1.5">
                    {ICON_OPTIONS.map(([value, Icon]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setIcon(value)}
                        aria-label={value}
                        className={[
                          "grid h-9 place-items-center rounded-[10px] border transition",
                          icon === value
                            ? "border-[#F3C7B0] bg-[#FFF1E2] text-[#FF8000]"
                            : "border-[#E8E3DD] bg-[#FAF9F7] text-[#8B8179] hover:text-[#FF8000]",
                        ].join(" ")}
                      >
                        <Icon size={15} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#E8E3DD] bg-white p-4">
              <p className="text-[9px] font-extrabold text-[#172235]">{t("repeat")}</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(
                  [
                    ["DAILY", t("daily")],
                    ["WEEKLY", t("weekly")],
                    ["REPEAT", t("repeatMode")],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFrequency(value)}
                    className={[
                      "h-10 rounded-[11px] border text-[9px] font-extrabold transition",
                      frequency === value
                        ? "border-[#FF8000] bg-[#FF8000] text-white shadow-[0_7px_18px_rgba(255,128,0,.16)]"
                        : "border-[#E8E3DD] bg-[#FAF9F7] text-[#81786F] hover:border-[#F3C7B0]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {frequency !== "DAILY" ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-extrabold text-[#172235]">
                      {t("whichDays")}
                    </p>
                    <p className="text-[8px] font-semibold text-[#A19890]">
                      {weekdays.length}{t("daysSelected")}
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map(([value, labelKey]) => {
                      const label = t(labelKey);
                      const selected = weekdays.includes(value);

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleWeekday(value)}
                          className={[
                            "h-9 rounded-[10px] border text-[8px] font-extrabold transition",
                            selected
                              ? "border-[#FF8000] bg-[#FF8000] text-white"
                              : "border-[#E8E3DD] bg-[#FAF9F7] text-[#8B8179] hover:border-[#F3C7B0]",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-[12px] bg-[#FAF9F7] px-3 py-2.5 text-[9px] font-semibold text-[#81786F]">
                  {t("dailyAutoText")}
                </div>
              )}

              {frequency === "REPEAT" ? (
                <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-[#FAF9F7] p-2">
                  <span className="shrink-0 text-[9px] font-extrabold text-[#172235]">{t("every")}</span>
                  <input
                    value={repeatInterval}
                    onChange={(event) => setRepeatInterval(event.target.value.replace(/\D/g, "").slice(0, 3))}
                    inputMode="numeric"
                    className="h-9 w-14 rounded-[10px] border border-[#E8E3DD] bg-white text-center text-[10px] font-extrabold outline-none focus:border-[#F3C7B0]"
                  />
                  <select
                    value={repeatUnit}
                    onChange={(event) => setRepeatUnit(event.target.value as "DAY" | "WEEK")}
                    className="h-9 min-w-0 flex-1 rounded-[10px] border border-[#E8E3DD] bg-white px-2.5 text-[9px] font-extrabold text-[#172235] outline-none"
                  >
                    <option value="DAY">{t("dailyUnit")}</option>
                    <option value="WEEK">{t("weeklyUnit")}</option>
                  </select>
                </div>
              ) : null}
            </section>

            <section className="rounded-[18px] border border-[#E8E3DD] bg-white">
              <div className="flex items-center gap-3 border-b border-[#EEE9E4] px-4 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#FFF1E2] text-[#FF8000]">
                  <Check size={15} strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold text-[#172235]">{t("goal")}</p>
                  <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
                    {t("goalQuestion")}
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 px-4 py-3.5">
                <input
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  maxLength={100}
                  placeholder={t("goalExample")}
                  className="h-10 w-full rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] px-3 text-[10px] font-semibold text-[#172235] outline-none focus:border-[#F3C7B0] focus:bg-white"
                />

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="min-w-0">
                    <span className="text-[8px] font-extrabold uppercase tracking-[.1em] text-[#A19890]">
                      {t("startDate")}
                    </span>
                    <span className="relative mt-1.5 block">
                      <Clock3
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9189]"
                      />
                      <input
                        type="date"
                        value={startDate}
                        min={today}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="h-10 w-full rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] pl-9 pr-2 text-[9px] font-extrabold text-[#172235] outline-none focus:border-[#F3C7B0]"
                      />
                    </span>
                  </label>

                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.1em] text-[#A19890]">
                      {t("goalDuration")}
                    </p>
                    <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
                      {DURATION_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDuration(option.value)}
                          className={[
                            "h-10 shrink-0 rounded-[11px] border px-3 text-[8px] font-extrabold transition",
                            duration === option.value
                              ? "border-[#FF8000] bg-[#FF8000] text-white"
                              : "border-[#E8E3DD] bg-[#FAF9F7] text-[#81786F] hover:border-[#F3C7B0]",
                          ].join(" ")}
                        >
                          {option.value === "forever" ? t("forever") : option.value === "custom" ? t("custom") : option.value + " " + t("daysLower")}
                        </button>
                      ))}
                    </div>

                    {duration === "custom" ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          value={customDays}
                          onChange={(event) =>
                            setCustomDays(
                              event.target.value.replace(/\D/g, "").slice(0, 3),
                            )
                          }
                          inputMode="numeric"
                          placeholder="1–999"
                          className="h-9 w-24 rounded-[10px] border border-[#E8E3DD] bg-[#FAF9F7] px-2.5 text-[9px] font-extrabold outline-none focus:border-[#F3C7B0]"
                        />
                        <span className="text-[8px] font-bold text-[#8B8179]">
                          {t("day")}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#E8E3DD] bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-extrabold text-[#172235]">{t("section")}</p>
                  <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
                    {t("placeInRoutine")}
                  </p>
                </div>
                <ChevronDown size={15} className="text-[#B1A79F]" />
              </div>

              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {SECTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSection(value)}
                    className={[
                      "h-10 rounded-[11px] border text-[8px] font-extrabold transition",
                      section === value
                        ? "border-[#FF8000] bg-[#FF8000] text-white"
                        : "border-[#E8E3DD] bg-[#FAF9F7] text-[#81786F] hover:border-[#F3C7B0]",
                    ].join(" ")}
                  >
                    {value === "Таңертең" ? t("morningSection") : value === "Күндіз" ? t("daySection") : value === "Кешке" ? t("eveningSection") : t("otherSection")}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[18px] border border-[#E8E3DD] bg-white p-4">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "grid h-8 w-8 place-items-center rounded-[10px]",
                    reminderEnabled
                      ? "bg-[#FFF1E2] text-[#FF8000]"
                      : "bg-[#F4F0EB] text-[#9A9189]",
                  ].join(" ")}
                >
                  {reminderEnabled ? <Bell size={15} /> : <BellOff size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-extrabold text-[#172235]">
                    {t("reminder")}
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">
                    {t("reminderSaveTime")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderEnabled((current) => !current)}
                  aria-pressed={reminderEnabled}
                  className={[
                    "relative h-6 w-11 rounded-full transition",
                    reminderEnabled ? "bg-[#FF8000]" : "bg-[#D8D1CA]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
                      reminderEnabled ? "left-[22px]" : "left-0.5",
                    ].join(" ")}
                  />
                </button>
              </div>

              {reminderEnabled ? (
                <div className="mt-3 rounded-[12px] bg-[#FAF9F7] p-2.5">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(event) => setReminderTime(event.target.value)}
                    className="h-10 w-full rounded-[10px] border border-[#E8E3DD] bg-white px-3 text-[10px] font-extrabold text-[#172235] outline-none focus:border-[#F3C7B0]"
                  />
                </div>
              ) : null}
            </section>

            {error ? (
              <div className="rounded-[12px] border border-[#F5CBC8] bg-[#FFF8F7] px-3.5 py-2.5 text-[9px] font-bold text-[#B94B44]">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E8E3DD] bg-white p-3.5 sm:p-4">
          <button
            type="button"
            onClick={() => void saveHabit()}
            disabled={saving}
            className="h-11 w-full rounded-[12px] bg-[#FF8000] px-4 text-[11px] font-semibold text-white shadow-[0_10px_22px_rgba(255,128,0,.18)] transition hover:bg-[#E56F00] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t("saving") : t("saveHabit")}
          </button>
        </div>
      </div>
    </div>
  );
}
