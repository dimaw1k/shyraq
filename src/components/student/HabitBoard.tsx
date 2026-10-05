"use client";

import {
  Bell,
  BookOpen,
  Check,
  Dumbbell,
  Library,
  ListTodo,
  Moon,
  PenLine,
  Plus,
  Smartphone,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { HabitCreateModal } from "@/components/student/HabitCreateModal";
import { useStudentLanguage } from "@/lib/student-language";

type Habit = {
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

type Checkin = {
  habit_id: string;
  completed_date: string;
};

type Props = {
  habits: Habit[];
  checkins: Checkin[];
  today: string;
};

const ICONS = {
  BookOpen,
  ListTodo,
  Smartphone,
  Library,
  PenLine,
  Moon,
  Dumbbell,
  Sparkles,
} as const;

const WEEKDAY_KEYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;

function shiftDate(value: string, delta: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function dayDiff(start: string, end: string) {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  return Math.floor(
    (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000,
  );
}

function weekdayOneBased(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return ((date.getUTCDay() + 6) % 7) + 1;
}

function weekLabel(value: string, t: (key: string) => string) {
  return t(WEEKDAY_KEYS[weekdayOneBased(value) - 1]);
}

function iconFor(value: string) {
  return ICONS[value as keyof typeof ICONS] ?? Sparkles;
}

function buildCurrentWeek(today: string) {
  const monday = shiftDate(today, -(weekdayOneBased(today) - 1));
  return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));
}

function isScheduled(habit: Habit, dateKey: string) {
  if (dateKey < habit.start_date) return false;

  const elapsed = dayDiff(habit.start_date, dateKey);
  if (habit.goal_days !== null && elapsed >= habit.goal_days) return false;

  if (habit.frequency === "DAILY") return true;

  if (habit.frequency === "WEEKLY") {
    return habit.weekdays.includes(weekdayOneBased(dateKey));
  }

  const intervalDays =
    habit.repeat_unit === "WEEK"
      ? habit.repeat_interval * 7
      : habit.repeat_interval;

  return elapsed % intervalDays === 0;
}

function scheduleLabel(habit: Habit, t: (key: string) => string) {
  if (habit.frequency === "DAILY") return t("everyDay");
  if (habit.frequency === "REPEAT") {
    return t("repeat") + " · " + habit.repeat_interval + " " +
      (habit.repeat_unit === "WEEK" ? t("week") : t("day"));
  }
  const shortDayKeys = ["monShort", "tueShort", "wedShort", "thuShort", "friShort", "satShort", "sunShort"];
  const selected = habit.weekdays
    .filter((day) => day >= 1 && day <= 7)
    .map((day) => t(shortDayKeys[day - 1]));
  return selected.length ? t("weekPrefix") + selected.join(", ") : t("weekly");
}

function durationLabel(habit: Habit, t: (key: string) => string) {
  return habit.goal_days === null ? t("always") : habit.goal_days + " " + t("daysLower");
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return day + "." + month + "." + year;
}

export function HabitBoard({
  habits: initialHabits,
  checkins: initialCheckins,
  today,
}: Props) {
  const { t } = useStudentLanguage("kk");
  const [habits, setHabits] = useState(initialHabits);
  const [checkins, setCheckins] = useState(initialCheckins);
  const [soundOn, setSoundOn] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInstance, setCreateInstance] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const checkSound = useRef<HTMLAudioElement | null>(null);

  const dates = useMemo(() => buildCurrentWeek(today), [today]);

  const checked = useMemo(
    () =>
      new Set(
        checkins.map((item) => item.habit_id + ":" + item.completed_date),
      ),
    [checkins],
  );

  const todayCompleted = habits.filter((habit) =>
    checked.has(habit.id + ":" + today),
  ).length;

  const todayProgress = habits.length
    ? Math.round((todayCompleted / habits.length) * 100)
    : 0;

  const activityDays = useMemo(
    () => new Set(checkins.map((item) => item.completed_date)),
    [checkins],
  );

  const streak = useMemo(() => {
    let cursor = activityDays.has(today) ? today : shiftDate(today, -1);
    let count = 0;

    while (activityDays.has(cursor)) {
      count += 1;
      cursor = shiftDate(cursor, -1);
    }

    return count;
  }, [activityDays, today]);

  const bestHabit = useMemo(
    () =>
      [...habits]
        .map((habit) => ({
          habit,
          count: dates.filter(
            (date) =>
              date <= today &&
              isScheduled(habit, date) &&
              checked.has(habit.id + ":" + date),
          ).length,
        }))
        .sort((a, b) => b.count - a.count)[0],
    [checked, dates, habits, today],
  );

  function playCheckSound() {
    if (!soundOn || typeof window === "undefined") return;

    const audio =
      checkSound.current ?? new Audio("/sounds/apple-pay-succes.mp3");

    checkSound.current = audio;
    audio.volume = 0.45;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  async function toggleHabit(habit: Habit, dateKey = today) {
    if (saving || dateKey > today || !isScheduled(habit, dateKey)) return;

    const key = habit.id + ":" + dateKey;
    const isCurrentlyChecked = checked.has(key);

    setSaving(habit.id);
    setError("");

    try {
      const response = await fetch(
        "/api/habits/" + habit.id + "/check",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ dateKey }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? t("habitCheckFailed"));
        return;
      }

      if (payload.checked) {
        setCheckins((current) =>
          current.some(
            (item) => item.habit_id + ":" + item.completed_date === key,
          )
            ? current
            : [...current, { habit_id: habit.id, completed_date: dateKey }],
        );

        if (!isCurrentlyChecked) playCheckSound();
      } else {
        setCheckins((current) =>
          current.filter(
            (item) => item.habit_id + ":" + item.completed_date !== key,
          ),
        );
      }
    } catch {
      setError(t("serverConnectionError"));
    } finally {
      setSaving(null);
    }
  }

  async function removeHabit(habit: Habit) {
    if (!window.confirm("«" + habit.name + "» " + t("habitDeleteQuestion"))) return;

    setError("");

    try {
      const response = await fetch("/api/habits/" + habit.id, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? t("habitDeleteFailed"));
        return;
      }

      setHabits((current) => current.filter((item) => item.id !== habit.id));
      setCheckins((current) =>
        current.filter((item) => item.habit_id !== habit.id),
      );
    } catch {
      setError(t("serverConnectionError"));
    }
  }

  return (
    <div className="space-y-3.5">
      <section className="grid gap-3 md:grid-cols-[1.55fr_1fr_1fr]">
        <div className="shrq-habit-hero relative overflow-hidden rounded-[22px] border border-[#E8E3DD] bg-white p-5 shadow-[0_12px_34px_rgba(23,34,53,.05)] sm:p-6">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#FFF1E2] blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#A19890]">
                  {t("todayRhythm")}
                </p>
                <h2 className="mt-1.5 text-[24px] font-extrabold tracking-[-.055em] text-[#172235]">
                  {t("habitTitle")}
                </h2>
                <p className="mt-1.5 max-w-[520px] text-[10px] font-semibold leading-5 text-[#81786F]">
                  {t("smallAction")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSoundOn((value) => !value)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] text-[#6F665E] transition hover:border-[#F3C7B0] hover:text-[#FF8000]"
                aria-label={soundOn ? t("soundOff") : t("soundOn")}
                title={soundOn ? t("soundOff") : t("soundOn")}
              >
                {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-5">
              <div
                className="shrq-habit-progress-ring"
                style={{ "--progress": todayProgress } as CSSProperties}
              >
                <div className="shrq-habit-progress-inner">
                  <strong>{todayCompleted}</strong>
                  <span>/ {habits.length}</span>
                </div>
              </div>

              <div className="pb-0.5">
                <p className="text-[19px] font-extrabold tracking-[-.04em] text-[#172235]">
                  {todayProgress}%
                </p>
                <p className="mt-0.5 text-[9px] font-bold text-[#9A9189]">
                  {t("completedTodayLabel")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrq-habit-stat rounded-[22px] border border-[#E8E3DD] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
              <Sparkles size={17} />
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#A19890]">
              {t("series")}
            </span>
          </div>
          <p className="mt-6 text-[34px] font-extrabold leading-none tracking-[-.06em] text-[#172235]">
            {streak}
          </p>
          <p className="mt-1 text-[9px] font-bold text-[#8B8179]">
            {t("daysInRow")}
          </p>
        </div>

        <div className="shrq-habit-stat rounded-[22px] border border-[#E8E3DD] bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#B95D00]">
              <Check size={17} />
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#A19890]">
              {t("bestHabit")}
            </span>
          </div>
          <p className="mt-6 truncate text-[15px] font-extrabold tracking-[-.03em] text-[#172235]">
            {bestHabit?.habit.name ?? t("nothingYet")}
          </p>
          <p className="mt-1 text-[9px] font-bold text-[#8B8179]">
            {bestHabit?.count ?? 0}/7 {t("day")}
          </p>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#E8E3DD] bg-[#FAF9F7] p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#172235]">
              {t("weekRhythm")}
            </p>
            <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">
              {t("monSun")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateInstance((value) => value + 1);
              setCreateOpen(true);
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[11px] bg-[#FF8000] px-3.5 text-[9px] font-extrabold text-white shadow-[0_7px_18px_rgba(255,128,0,.18)] transition hover:bg-[#E56F00] active:scale-[.97]"
          >
            <Plus size={14} />
            {t("addHabit")}
          </button>
        </div>

        <div className="shrq-habit-week mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
          {dates.map((date) => {
            const count = habits.reduce(
              (total, habit) =>
                total +
                Number(
                  date <= today &&
                    isScheduled(habit, date) &&
                    checked.has(habit.id + ":" + date),
                ),
              0,
            );
            const active = date === today;
            const future = date > today;

            return (
              <div
                key={date}
                className={[
                  "rounded-[12px] border px-1.5 py-2.5 text-center transition",
                  active
                    ? "border-[#F3C7B0] bg-white shadow-sm"
                    : future
                      ? "border-transparent bg-white/40 opacity-55"
                      : "border-transparent bg-white/60",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-[8px] font-extrabold",
                    active ? "text-[#FF8000]" : "text-[#9A9189]",
                  ].join(" ")}
                >
                  <span className="block truncate">{weekLabel(date, t)}</span>
                </p>
                <p
                  className={[
                    "mt-1 text-[14px] font-extrabold",
                    count ? "text-[#172235]" : "text-[#C7BFB7]",
                  ].join(" ")}
                >
                  {count}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {error ? (
        <div className="rounded-[12px] border border-[#F5CBC8] bg-[#FFF8F7] px-3.5 py-2.5 text-[9px] font-bold text-[#B94B44]">
          {error}
        </div>
      ) : null}

      <section>
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#172235]">{t("today").toUpperCase()}</p>
            <h2 className="mt-1 text-[19px] font-extrabold tracking-[-.045em] text-[#172235]">{t("todayHabits")}</h2>
          </div>
          <p className="text-[9px] font-bold text-[#9A9189]">
            {todayCompleted}/{habits.length} {t("doneCount")}
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {habits.map((habit, index) => {
            const Icon = iconFor(habit.icon);
            const doneToday = checked.has(habit.id + ":" + today);
            const scheduledToday = isScheduled(habit, today);
            const weekCount = dates.filter(
              (date) =>
                date <= today &&
                isScheduled(habit, date) &&
                checked.has(habit.id + ":" + date),
            ).length;
            const isSaving = saving === habit.id;

            return (
              <article
                key={habit.id}
                className={[
                  "shrq-habit-card group relative overflow-hidden rounded-[19px] border bg-white p-4 transition-all duration-200",
                  doneToday
                    ? "is-complete border-[#F2C09B] shadow-[0_12px_28px_rgba(255,128,0,.10)]"
                    : "border-[#E8E3DD] hover:-translate-y-0.5 hover:border-[#F3C7B0] hover:shadow-[0_10px_24px_rgba(23,34,53,.045)]",
                ].join(" ")}
                style={
                  { "--habit-delay": index * 45 + "ms" } as CSSProperties
                }
              >
                {doneToday ? (
                  <span className="shrq-habit-glow" aria-hidden />
                ) : null}

                <div className="relative flex items-start gap-3">
                  <span
                    className={[
                      "grid h-11 w-11 shrink-0 place-items-center rounded-[13px] transition",
                      doneToday
                        ? "bg-[#FF8000] text-white shadow-[0_7px_16px_rgba(255,128,0,.18)]"
                        : "bg-[#FFF1E2] text-[#B95D00]",
                    ].join(" ")}
                  >
                    <Icon size={17} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[12px] font-extrabold tracking-[-.025em] text-[#172235]">
                          {habit.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 min-h-[30px] text-[8px] font-medium leading-[1.65] text-[#948A82]">
                          {habit.description ?? t("dailyHabit")}
                        </p>
                      </div>

                      {!habit.is_default ? (
                        <button
                          type="button"
                          onClick={() => void removeHabit(habit)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-[#B4AAA1] opacity-70 transition hover:bg-[#FFF4F2] hover:text-[#C94D45] sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={habit.name + " " + t("habitDelete")}
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleHabit(habit)}
                    disabled={isSaving || !scheduledToday}
                    aria-pressed={doneToday}
                    aria-label={
                      !scheduledToday
                        ? habit.name + " — " + t("notScheduledToday")
                        : doneToday
                          ? habit.name + " — " + t("completedDash")
                          : habit.name + " — " + t("markCompleted")
                    }
                    className={[
                      "shrq-habit-check shrink-0",
                      doneToday ? "is-checked" : "",
                      isSaving ? "is-saving" : "",
                      !scheduledToday ? "opacity-35" : "",
                    ].join(" ")}
                  >
                    {doneToday ? (
                      <Check size={17} strokeWidth={3} />
                    ) : (
                      <span />
                    )}
                  </button>
                </div>

                <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#FAF9F7] px-2 py-1 text-[7px] font-extrabold text-[#81786F]">
                    {scheduleLabel(habit, t)}
                  </span>
                  <span className="rounded-full bg-[#FAF9F7] px-2 py-1 text-[7px] font-extrabold text-[#81786F]">
                    {durationLabel(habit, t)}
                  </span>
                  <span className="rounded-full bg-[#FAF9F7] px-2 py-1 text-[7px] font-extrabold text-[#81786F]">
                    {habit.section === "Таңертең" ? t("morningSection") : habit.section === "Күндіз" ? t("daySection") : habit.section === "Кешке" ? t("eveningSection") : t("otherSection")}
                  </span>
                  {habit.reminder_time ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1E2] px-2 py-1 text-[7px] font-extrabold text-[#C15F00]">
                      <Bell size={9} />
                      {habit.reminder_time.slice(0, 5)}
                    </span>
                  ) : null}
                </div>

                <div className="relative mt-3 grid grid-cols-7 gap-1.5">
                  {dates.map((date) => {
                    const done =
                      date <= today &&
                      isScheduled(habit, date) &&
                      checked.has(habit.id + ":" + date);
                    const available =
                      date <= today && isScheduled(habit, date);

                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => void toggleHabit(habit, date)}
                        disabled={isSaving || !available}
                        className="group/day min-w-0 disabled:cursor-default"
                        aria-label={
                          habit.name + ": " + formatDate(date)
                        }
                      >
                        <span
                          className={[
                            "block h-1.5 rounded-full transition-all duration-200",
                            done
                              ? "bg-[#FF8000] shadow-[0_0_8px_rgba(255,128,0,.28)]"
                              : available
                                ? "bg-[#EDE8E2] group-hover/day:bg-[#DDD6CF]"
                                : "bg-[#F1EDE8]",
                            date === today && available && !done
                              ? "ring-1 ring-[#F3C7B0] ring-offset-1 ring-offset-white"
                              : "",
                          ].join(" ")}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="relative mt-3 flex items-center justify-between">
                  <span className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#A19890]">
                    {t("week7")}: {weekCount}
                  </span>
                  <span
                    className={[
                      "text-[8px] font-extrabold",
                      doneToday
                        ? "text-[#D56700]"
                        : scheduledToday
                          ? "text-[#9A9189]"
                          : "text-[#B8AEA5]",
                    ].join(" ")}
                  >
                    {doneToday ? t("todayDone") : scheduledToday ? t("todayStep") : t("todayNotScheduled")}
                  </span>
                </div>

                {habit.goal ? (
                  <p className="relative mt-2 truncate text-[8px] font-semibold text-[#A19890]">
                    {t("goal")}: {habit.goal}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <HabitCreateModal
        key={createInstance}
        open={createOpen}
        today={today}
        onClose={() => setCreateOpen(false)}
        onCreated={(habit) => setHabits((current) => [...current, habit])}
      />
    </div>
  );
}
