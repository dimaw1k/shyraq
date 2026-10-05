"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Check,
  ChevronDown,
  Info,
  Languages,
  LogOut,
  Mail,
  MessageSquareText,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Timer,
  UserRound,
  Volume2,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type ThemeMode = "light" | "dark" | "system";
type Language = "kk" | "ru" | "en";

type ReminderSettings = {
  enabled: boolean;
  morningMeet: boolean;
  morningMeetTime: string;
  morningReport: boolean;
  morningReportTime: string;
  eveningMeet: boolean;
  eveningMeetTime: string;
  eveningReport: boolean;
  eveningReportTime: string;
  habits: boolean;
  habitsTime: string;
};

const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  morningMeet: true,
  morningMeetTime: "08:00",
  morningReport: true,
  morningReportTime: "10:00",
  eveningMeet: true,
  eveningMeetTime: "19:00",
  eveningReport: true,
  eveningReportTime: "21:00",
  habits: true,
  habitsTime: "20:30",
};

const STORAGE = {
  language: "shyraq:language",
  theme: "shyraq:theme",
  reminders: "shyraq:reminders",
};

function SectionCard({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#E7E0D8] bg-white p-4 shadow-[0_10px_30px_rgba(23,34,53,.035)] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#FFF7F1] text-[#FF8000]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">{eyebrow}</p>
          <h2 className="mt-1 text-[17px] font-extrabold tracking-[-.02em] text-[#172235]">{title}</h2>
          {description ? <p className="mt-1 text-[11px] leading-5 text-[#80766D]">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SegmentedButton<T extends string>({
  value,
  active,
  label,
  onClick,
}: {
  value: T;
  active: boolean;
  label: string;
  onClick: (value: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        "rounded-[12px] border px-3 py-2.5 text-[11px] font-extrabold transition",
        active
          ? "border-[#FF8000] bg-[#FFF1E2] text-[#D76600]"
          : "border-[#E7E0D8] bg-[#FCFBF9] text-[#6F665E] hover:border-[#FFB366] hover:bg-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[15px] border border-[#ECE6DF] bg-[#FCFBF9] px-3.5 py-3 text-left transition hover:bg-white"
    >
      <span className="min-w-0">
        <span className="block text-[12px] font-extrabold text-[#172235]">{label}</span>
        {description ? <span className="mt-0.5 block text-[10px] leading-4 text-[#8B8179]">{description}</span> : null}
      </span>
      <span className={["relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-[#FF8000]" : "bg-[#D8D1CA]"].join(" ")}>
        <span
          className={[
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

export function StudentSettingsClient({
  email,
}: {
  email: string;
}) {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("kk");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [expandedReminders, setExpandedReminders] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE.language) as Language | null;
    const savedTheme = window.localStorage.getItem(STORAGE.theme) as ThemeMode | null;
    const savedReminders = window.localStorage.getItem(STORAGE.reminders);

    if (savedLanguage === "kk" || savedLanguage === "ru" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }

    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
      setTheme(savedTheme);
    }

    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders) as Partial<ReminderSettings>;
        setReminders({ ...DEFAULT_REMINDERS, ...parsed });
      } catch {}
    }

    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE.language, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE.theme, theme);
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    document.documentElement.dataset.theme = resolved;
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE.reminders, JSON.stringify(reminders));
  }, [reminders]);

  const reminderCount = useMemo(() => {
    if (!reminders.enabled) return 0;
    return [
      reminders.morningMeet,
      reminders.morningReport,
      reminders.eveningMeet,
      reminders.eveningReport,
      reminders.habits,
    ].filter(Boolean).length;
  }, [reminders]);

  async function requestBrowserNotifications() {
    if (typeof Notification === "undefined") {
      setNotice("Бұл браузер хабарландыруларды қолдамайды.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotice("Браузер хабарландыруларына рұқсат берілді.");
    } else if (permission === "denied") {
      setNotice("Хабарландыруға рұқсат берілмеді. Браузер баптауларынан қосуға болады.");
    }
  }

  function updateReminder(key: keyof ReminderSettings, value: boolean | string) {
    setReminders((current) => ({ ...current, [key]: value }));
  }

  async function signOutAll() {
    setLogoutLoading(true);
    setNotice("");

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setNotice("Аккаунттан шығу кезінде қате болды.");
      setLogoutLoading(false);
      return;
    }

    router.replace("/login");
  }

  return (
    <div className="space-y-4">
      <SectionCard
        icon={<Languages size={18} />}
        eyebrow="ТІЛ"
        title="Интерфейс тілі"
        description="Таңдауыңыз осы құрылғыда сақталады."
      >
        <div className="grid grid-cols-3 gap-2">
          <SegmentedButton value="kk" active={language === "kk"} label="Қазақша" onClick={setLanguage} />
          <SegmentedButton value="ru" active={language === "ru"} label="Русский" onClick={setLanguage} />
          <SegmentedButton value="en" active={language === "en"} label="English" onClick={setLanguage} />
        </div>
        {language !== "kk" ? (
          <div className="mt-3 rounded-[13px] bg-[#FFF7F1] px-3 py-2.5 text-[10px] font-semibold leading-4 text-[#8A5A39]">
            Қазір Shyraq интерфейсінің негізгі мазмұны қазақ тілінде. Тіл таңдауы сақталды.
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        icon={<BellRing size={18} />}
        eyebrow="ЕСКЕ САЛҒЫШТАР"
        title="Оқу күнінің ескертулері"
        description={reminderCount + " еске салғыш қосулы."}
      >
        <div className="space-y-2.5">
          <Toggle
            checked={reminders.enabled}
            onChange={(value) => updateReminder("enabled", value)}
            label="Еске салғыштарды қосу"
            description="Оқу кестесіне байланысты ескертулерді басқару."
          />

          <button
            type="button"
            onClick={() => setExpandedReminders((value) => !value)}
            className="flex w-full items-center justify-between rounded-[15px] border border-[#E7E0D8] bg-white px-3.5 py-3 text-[11px] font-extrabold text-[#172235]"
          >
            <span>Толық баптаулар</span>
            <ChevronDown size={16} className={expandedReminders ? "rotate-180 transition" : "transition"} />
          </button>

          {expandedReminders ? (
            <div className="space-y-2.5">
              <div className="grid gap-2 md:grid-cols-2">
                <Toggle
                  checked={reminders.morningMeet && reminders.enabled}
                  onChange={(value) => updateReminder("morningMeet", value)}
                  label="Таңғы Meet"
                  description="Таңғы кездесуге дейін."
                />
                <div className="relative">
                  <Timer className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A49A90]" size={15} />
                  <input
                    type="time"
                    value={reminders.morningMeetTime}
                    onChange={(event) => updateReminder("morningMeetTime", event.target.value)}
                    className="w-full rounded-[14px] border border-[#E7E0D8] bg-[#FCFBF9] py-3 pl-10 pr-3 text-[11px] font-bold outline-none focus:border-[#FF8000]"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Toggle
                  checked={reminders.morningReport && reminders.enabled}
                  onChange={(value) => updateReminder("morningReport", value)}
                  label="Таңғы есеп"
                  description="Есеп ашылғанда."
                />
                <div className="relative">
                  <Timer className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A49A90]" size={15} />
                  <input
                    type="time"
                    value={reminders.morningReportTime}
                    onChange={(event) => updateReminder("morningReportTime", event.target.value)}
                    className="w-full rounded-[14px] border border-[#E7E0D8] bg-[#FCFBF9] py-3 pl-10 pr-3 text-[11px] font-bold outline-none focus:border-[#FF8000]"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Toggle
                  checked={reminders.eveningMeet && reminders.enabled}
                  onChange={(value) => updateReminder("eveningMeet", value)}
                  label="Кешкі Meet"
                  description="Кешкі кездесуге дейін."
                />
                <div className="relative">
                  <Timer className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A49A90]" size={15} />
                  <input
                    type="time"
                    value={reminders.eveningMeetTime}
                    onChange={(event) => updateReminder("eveningMeetTime", event.target.value)}
                    className="w-full rounded-[14px] border border-[#E7E0D8] bg-[#FCFBF9] py-3 pl-10 pr-3 text-[11px] font-bold outline-none focus:border-[#FF8000]"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Toggle
                  checked={reminders.eveningReport && reminders.enabled}
                  onChange={(value) => updateReminder("eveningReport", value)}
                  label="Кешкі есеп"
                  description="Есеп ашылғанда."
                />
                <div className="relative">
                  <Timer className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A49A90]" size={15} />
                  <input
                    type="time"
                    value={reminders.eveningReportTime}
                    onChange={(event) => updateReminder("eveningReportTime", event.target.value)}
                    className="w-full rounded-[14px] border border-[#E7E0D8] bg-[#FCFBF9] py-3 pl-10 pr-3 text-[11px] font-bold outline-none focus:border-[#FF8000]"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Toggle
                  checked={reminders.habits && reminders.enabled}
                  onChange={(value) => updateReminder("habits", value)}
                  label="Әдеттер"
                  description="Күнделікті әдеттерді тексеру."
                />
                <div className="relative">
                  <Timer className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A49A90]" size={15} />
                  <input
                    type="time"
                    value={reminders.habitsTime}
                    onChange={(event) => updateReminder("habitsTime", event.target.value)}
                    className="w-full rounded-[14px] border border-[#E7E0D8] bg-[#FCFBF9] py-3 pl-10 pr-3 text-[11px] font-bold outline-none focus:border-[#FF8000]"
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={requestBrowserNotifications}
              disabled={notificationPermission === "unsupported" || notificationPermission === "granted"}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-[#E7E0D8] bg-[#FCFBF9] px-4 py-3 text-[11px] font-extrabold text-[#172235] disabled:cursor-default disabled:opacity-60"
            >
              {notificationPermission === "granted" ? <Check size={15} /> : <Bell size={15} />}
              {notificationPermission === "granted" ? "Хабарландыру қосулы" : "Хабарландыруға рұқсат беру"}
            </button>
            <div className="flex items-center gap-2 rounded-[14px] bg-[#FFF7F1] px-3.5 py-3 text-[10px] font-semibold leading-4 text-[#8A5A39] sm:flex-1">
              <Volume2 size={14} className="shrink-0 text-[#FF8000]" />
              Браузер хабарландыруы тек рұқсат берілген құрылғыда жұмыс істейді.
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Palette size={18} />}
        eyebrow="КӨРІНІС"
        title="Экран көрінісі"
        description="Жарық, күңгірт немесе жүйе режимі."
      >
        <div className="grid grid-cols-3 gap-2">
          <SegmentedButton value="light" active={theme === "light"} label="Жарық" onClick={setTheme} />
          <SegmentedButton value="dark" active={theme === "dark"} label="Күңгірт" onClick={setTheme} />
          <SegmentedButton value="system" active={theme === "system"} label="Жүйе" onClick={setTheme} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#8B8179]">
          {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          Көрініс таңдауы осы құрылғыда сақталады.
        </div>
      </SectionCard>

      <SectionCard
        icon={<ShieldCheck size={18} />}
        eyebrow="ҚАУІПСІЗДІК"
        title="Аккаунт қауіпсіздігі"
      >
        <div className="space-y-2.5">
          <Link
            href="/reset-password"
            className="flex items-center justify-between rounded-[15px] border border-[#E7E0D8] bg-[#FCFBF9] px-3.5 py-3 text-[11px] font-extrabold text-[#172235] transition hover:border-[#FFB366] hover:bg-white"
          >
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#FF8000]" />Құпиясөзді өзгерту</span>
            <ChevronDown size={15} className="-rotate-90 text-[#9A9189]" />
          </Link>

          <button
            type="button"
            disabled={logoutLoading}
            onClick={signOutAll}
            className="flex w-full items-center justify-between rounded-[15px] border border-[#E7E0D8] bg-[#FCFBF9] px-3.5 py-3 text-[11px] font-extrabold text-[#172235] transition hover:border-[#FFB366] hover:bg-white disabled:opacity-60"
          >
            <span className="flex items-center gap-2"><LogOut size={15} className="text-[#FF8000]" />Барлық құрылғыдан шығу</span>
            <ChevronDown size={15} className="-rotate-90 text-[#9A9189]" />
          </button>
        </div>
      </SectionCard>

      <SectionCard
        icon={<UserRound size={18} />}
        eyebrow="АККАУНТ"
        title="Аккаунт"
      >
        <div className="rounded-[15px] border border-[#E7E0D8] bg-[#FCFBF9] p-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#FFF1E2] text-[#FF8000]">
              <Mail size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">EMAIL</p>
              <p className="mt-1 truncate text-[12px] font-bold text-[#172235]">{email}</p>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/profile"
            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-[#E7E0D8] bg-white px-4 py-3 text-[11px] font-extrabold text-[#172235]"
          >
            <UserRound size={15} /> Профиль
          </Link>
          <Link
            href="/reset-password"
            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-[#E7E0D8] bg-white px-4 py-3 text-[11px] font-extrabold text-[#172235]"
          >
            <ShieldCheck size={15} /> Құпиясөз
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Info size={18} />}
        eyebrow="ҚОЛДАНБА ТУРАЛЫ"
        title="Shyraq"
        description="Оқу тәртібін жүйеге айналдыратын платформа."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[14px] bg-[#FCFBF9] p-3">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">НҰСҚА</p>
            <p className="mt-1 text-[12px] font-extrabold text-[#172235]">0.1.0</p>
          </div>
          <div className="rounded-[14px] bg-[#FCFBF9] p-3">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">ПЛАТФОРМА</p>
            <p className="mt-1 text-[12px] font-extrabold text-[#172235]">Shyraq Education</p>
          </div>
          <div className="rounded-[14px] bg-[#FCFBF9] p-3">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">ҚОЛДАУ</p>
            <p className="mt-1 text-[12px] font-extrabold text-[#172235]">24/7 сұраныс</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<MessageSquareText size={18} />}
        eyebrow="КЕРІ БАЙЛАНЫС"
        title="Қолдау қызметі"
        description="Қате, ұсыныс немесе аккаунт мәселесі болса, осы жерден өтініш жіберіңіз."
      >
        <Link
          href="#support"
          className="flex items-center justify-center gap-2 rounded-[14px] bg-[#FF8000] px-4 py-3 text-[11px] font-extrabold text-white shadow-[0_10px_24px_rgba(255,128,0,.16)]"
        >
          <MessageSquareText size={15} />
          Кері байланысқа өту
        </Link>
      </SectionCard>

      {notice ? (
        <div className="sticky bottom-3 z-20 rounded-[15px] border border-[#E7E0D8] bg-white px-4 py-3 text-[11px] font-bold text-[#5C5149] shadow-[0_15px_35px_rgba(23,34,53,.10)]">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
