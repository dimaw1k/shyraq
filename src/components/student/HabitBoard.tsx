"use client";

import {
  BookOpen,
  Check,
  Dumbbell,
  Library,
  ListTodo,
  Moon,
  PenLine,
  Plus,
  SmartphoneOff,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";

type Habit = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_default: boolean;
  sort_order: number;
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
  SmartphoneOff,
  Library,
  PenLine,
  Moon,
  Dumbbell,
  Sparkles,
} as const;

const ICON_OPTIONS = [
  ["Sparkles", Sparkles],
  ["BookOpen", BookOpen],
  ["Dumbbell", Dumbbell],
  ["ListTodo", ListTodo],
  ["Moon", Moon],
] as const;

function shiftDate(value: string, delta: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function dayLabel(value: string) {
  return new Intl.DateTimeFormat("kk-KZ", {
    timeZone: "Asia/Almaty",
    weekday: "short",
  })
    .format(new Date(value + "T12:00:00+05:00"))
    .replace(".", "")
    .slice(0, 2)
    .toUpperCase();
}

function iconFor(value: string) {
  return ICONS[value as keyof typeof ICONS] ?? Sparkles;
}

function buildLastSeven(today: string) {
  return Array.from({ length: 7 }, (_, index) => shiftDate(today, index - 6));
}

export function HabitBoard({
  habits: initialHabits,
  checkins: initialCheckins,
  today,
}: Props) {
  const [habits, setHabits] = useState(initialHabits);
  const [checkins, setCheckins] = useState(initialCheckins);
  const [soundOn, setSoundOn] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState("Sparkles");
  const [error, setError] = useState("");
  const audioContext = useRef<AudioContext | null>(null);

  const dates = useMemo(() => buildLastSeven(today), [today]);

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
          count: dates.filter((date) =>
            checked.has(habit.id + ":" + date),
          ).length,
        }))
        .sort((a, b) => b.count - a.count)[0],
    [checked, dates, habits],
  );

  function playClick(checkedNow: boolean) {
    if (!soundOn || typeof window === "undefined") return;

    const Context = window.AudioContext;
    if (!Context) return;

    const ctx = audioContext.current ?? new Context();
    audioContext.current = ctx;

    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = checkedNow ? "square" : "triangle";
    oscillator.frequency.setValueAtTime(checkedNow ? 880 : 620, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      checkedNow ? 420 : 260,
      now + 0.075,
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      checkedNow ? 0.12 : 0.075,
      now + 0.008,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.095);

    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();

    snap.type = "sine";
    snap.frequency.setValueAtTime(checkedNow ? 1480 : 1060, now);
    snap.frequency.exponentialRampToValueAtTime(720, now + 0.045);

    snapGain.gain.setValueAtTime(0.0001, now);
    snapGain.gain.exponentialRampToValueAtTime(0.055, now + 0.006);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    snap.connect(snapGain);
    snapGain.connect(ctx.destination);
    snap.start(now);
    snap.stop(now + 0.055);
  }

  async function toggleHabit(habitId: string, dateKey = today) {
    if (saving) return;

    setSaving(habitId);
    setError("");

    const response = await fetch("/api/habits/" + habitId + "/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dateKey }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "Әдетті белгілеу мүмкін болмады.");
      setSaving(null);
      return;
    }

    const key = habitId + ":" + dateKey;

    if (payload.checked) {
      setCheckins((current) =>
        current.some(
          (item) => item.habit_id + ":" + item.completed_date === key,
        )
          ? current
          : [...current, { habit_id: habitId, completed_date: dateKey }],
      );
    } else {
      setCheckins((current) =>
        current.filter(
          (item) => item.habit_id + ":" + item.completed_date !== key,
        ),
      );
    }

    playClick(Boolean(payload.checked));
    setSaving(null);
  }

  async function addHabit() {
    if (saving) return;

    setError("");

    const response = await fetch("/api/habits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: newName,
        description: newDescription,
        icon: newIcon,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "Әдетті қосу мүмкін болмады.");
      return;
    }

    setHabits((current) => [...current, payload.habit]);
    setNewName("");
    setNewDescription("");
    setNewIcon("Sparkles");
    setAdding(false);
  }

  async function removeHabit(habitId: string) {
    if (!window.confirm("Бұл әдетті өшіру керек пе?")) return;

    const response = await fetch("/api/habits/" + habitId, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "Әдетті өшіру мүмкін болмады.");
      return;
    }

    setHabits((current) => current.filter((habit) => habit.id !== habitId));
    setCheckins((current) => current.filter((item) => item.habit_id !== habitId));
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
                  БҮГІНГІ ЫРҒАҚ
                </p>
                <h2 className="mt-1.5 text-[24px] font-extrabold tracking-[-.055em] text-[#172235]">
                  Әдеттерді бекіт.
                </h2>
                <p className="mt-1.5 max-w-[520px] text-[10px] font-semibold leading-5 text-[#81786F]">
                  Кішкентай әрекет күн сайын қайталанса, үлкен нәтижеге айналады.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSoundOn((value) => !value)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] text-[#6F665E] transition hover:border-[#F3C7B0] hover:text-[#FF8000]"
                aria-label={soundOn ? "Дыбысты өшіру" : "Дыбысты қосу"}
                title={soundOn ? "Дыбысты өшіру" : "Дыбысты қосу"}
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
                  бүгін орындалды
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
              СЕРИЯ
            </span>
          </div>
          <p className="mt-6 text-[34px] font-extrabold leading-none tracking-[-.06em] text-[#172235]">
            {streak}
          </p>
          <p className="mt-1 text-[9px] font-bold text-[#8B8179]">күн қатарынан</p>
        </div>

        <div className="shrq-habit-stat rounded-[22px] border border-[#E8E3DD] bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#B95D00]">
              <Check size={17} />
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#A19890]">
              ҮЗДІК ӘДЕТ
            </span>
          </div>
          <p className="mt-6 truncate text-[15px] font-extrabold tracking-[-.03em] text-[#172235]">
            {bestHabit?.habit.name ?? "Әзірге жоқ"}
          </p>
          <p className="mt-1 text-[9px] font-bold text-[#8B8179]">
            {bestHabit?.count ?? 0}/7 күн
          </p>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#E8E3DD] bg-[#FAF9F7] p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#172235]">
              7 КҮНДІК ЫРҒАҚ
            </p>
            <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">
              Әр нүкте — сол күндегі орындалған әдет.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAdding((value) => !value)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[11px] bg-[#FF8000] px-3.5 text-[9px] font-extrabold text-white shadow-[0_7px_18px_rgba(255,128,0,.18)] transition hover:bg-[#E56F00] active:scale-[.97]"
          >
            <Plus size={14} />
            Әдет қосу
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
          {dates.map((date) => {
            const count = habits.reduce(
              (total, habit) =>
                total + Number(checked.has(habit.id + ":" + date)),
              0,
            );
            const active = date === today;

            return (
              <div
                key={date}
                className={[
                  "rounded-[12px] border px-1.5 py-2.5 text-center transition",
                  active
                    ? "border-[#F3C7B0] bg-white shadow-sm"
                    : "border-transparent bg-white/60",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-[8px] font-extrabold",
                    active ? "text-[#FF8000]" : "text-[#9A9189]",
                  ].join(" ")}
                >
                  {dayLabel(date)}
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

      {adding ? (
        <section className="shrq-habit-add rounded-[20px] border border-[#F3C7B0] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold text-[#172235]">Жаңа әдет</p>
              <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">
                Өзіңе лайық бір қарапайым әдет қос.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-[9px] font-extrabold text-[#9A9189] hover:text-[#172235]"
            >
              Жабу
            </button>
          </div>

          <div className="mt-3 grid gap-2.5 md:grid-cols-[1fr_1.2fr_auto]">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={60}
              placeholder="Мысалы: 15 минут қайталау"
              className="h-10 rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] px-3 text-[10px] font-semibold outline-none transition focus:border-[#F3C7B0] focus:bg-white"
            />
            <input
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              maxLength={140}
              placeholder="Қысқа сипаттама"
              className="h-10 rounded-[11px] border border-[#E8E3DD] bg-[#FAF9F7] px-3 text-[10px] font-semibold outline-none transition focus:border-[#F3C7B0] focus:bg-white"
            />
            <button
              type="button"
              onClick={() => void addHabit()}
              className="h-10 rounded-[11px] bg-[#172235] px-4 text-[9px] font-extrabold text-white transition hover:bg-[#24344F] active:scale-[.98]"
            >
              Сақтау
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map(([value, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setNewIcon(value)}
                className={[
                  "grid h-8 w-8 place-items-center rounded-[9px] border transition",
                  newIcon === value
                    ? "border-[#F3C7B0] bg-[#FFF1E2] text-[#FF8000]"
                    : "border-[#E8E3DD] bg-[#FAF9F7] text-[#8B8179]",
                ].join(" ")}
                aria-label={value}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-[12px] border border-[#F5CBC8] bg-[#FFF8F7] px-3.5 py-2.5 text-[9px] font-bold text-[#B94B44]">
          {error}
        </div>
      ) : null}

      <section>
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#172235]">
              БҮГІН
            </p>
            <h2 className="mt-1 text-[19px] font-extrabold tracking-[-.045em] text-[#172235]">
              Әдеттерің
            </h2>
          </div>
          <p className="text-[9px] font-bold text-[#9A9189]">
            {todayCompleted}/{habits.length} орындалды
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {habits.map((habit, index) => {
            const Icon = iconFor(habit.icon);
            const doneToday = checked.has(habit.id + ":" + today);
            const weekCount = dates.filter((date) =>
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
                  {
                    "--habit-delay": index * 45 + "ms",
                  } as CSSProperties
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
                          {habit.description ?? "Күн сайын қайталап көр."}
                        </p>
                      </div>

                      {!habit.is_default ? (
                        <button
                          type="button"
                          onClick={() => void removeHabit(habit.id)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-[#B4AAA1] opacity-70 transition hover:bg-[#FFF4F2] hover:text-[#C94D45] sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={habit.name + " өшіру"}
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleHabit(habit.id)}
                    disabled={isSaving}
                    aria-pressed={doneToday}
                    aria-label={
                      doneToday
                        ? habit.name + " — орындалды"
                        : habit.name + " — орындадым деп белгілеу"
                    }
                    className={[
                      "shrq-habit-check shrink-0",
                      doneToday ? "is-checked" : "",
                      isSaving ? "is-saving" : "",
                    ].join(" ")}
                  >
                    {doneToday ? <Check size={17} strokeWidth={3} /> : <span />}
                  </button>
                </div>

                <div className="relative mt-4 grid grid-cols-7 gap-1.5">
                  {dates.map((date) => {
                    const done = checked.has(habit.id + ":" + date);

                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => void toggleHabit(habit.id, date)}
                        disabled={isSaving}
                        className="group/day min-w-0"
                        aria-label={habit.name + ": " + date}
                      >
                        <span
                          className={[
                            "block h-1.5 rounded-full transition-all duration-200",
                            done
                              ? "bg-[#FF8000] shadow-[0_0_8px_rgba(255,128,0,.28)]"
                              : "bg-[#EDE8E2] group-hover/day:bg-[#DDD6CF]",
                            date === today && !done
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
                    7 КҮН: {weekCount}
                  </span>
                  <span
                    className={[
                      "text-[8px] font-extrabold",
                      doneToday ? "text-[#D56700]" : "text-[#9A9189]",
                    ].join(" ")}
                  >
                    {doneToday ? "БҮГІН ДАЙЫН" : "БҮГІНГЕ ҚАДАМ"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
