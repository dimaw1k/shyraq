"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  Settings,
  Trophy,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NotificationBell } from "@/components/student/NotificationBell";

type NavItem = { label: string; href: string; icon: LucideIcon };

const studentLinks: NavItem[] = [
  { label: "Басты бет", href: "/dashboard", icon: LayoutDashboard },
  { label: "Сабақтар", href: "/lessons", icon: BookOpen },
  { label: "Тапсырмалар", href: "/tasks", icon: ClipboardList },
  { label: "Профиль", href: "/profile", icon: Users },
  { label: "Баптаулар", href: "/settings", icon: Settings },
];

const mentorLinks: NavItem[] = [
  { label: "Басты бет", href: "/mentor", icon: LayoutDashboard },
  { label: "Команда", href: "/mentor/team", icon: UsersRound },
  { label: "Тапсырмалар", href: "/mentor/tasks", icon: ClipboardCheck },
  { label: "Есептер", href: "/mentor/reports", icon: FileText },
  { label: "Кездесу", href: "/mentor/meet", icon: Activity },
  { label: "Рейтинг", href: "/mentor/rating", icon: Trophy },
  { label: "Профиль", href: "/profile", icon: Users },
];

const chiefMentorLinks: NavItem[] = [
  { label: "Басты бет", href: "/chief-mentor", icon: LayoutDashboard },
  { label: "Менторлар", href: "/chief-mentor/mentors", icon: Users },
  { label: "Командалар", href: "/chief-mentor/teams", icon: UsersRound },
  { label: "Оқушылар", href: "/chief-mentor/students", icon: Users },
  { label: "Сабақтар", href: "/chief-mentor/lessons", icon: BookOpen },
  { label: "Тапсырмалар", href: "/chief-mentor/tasks", icon: ClipboardList },
  { label: "Тапсырманы тексеру", href: "/chief-mentor/submissions", icon: ClipboardCheck },
  { label: "Есептер", href: "/chief-mentor/reports", icon: FileText },
  { label: "Кездесулер", href: "/chief-mentor/meet", icon: CalendarCheck2 },
  { label: "Рейтинг", href: "/chief-mentor/rating", icon: Trophy },
  { label: "Аналитика", href: "/chief-mentor/analytics", icon: BarChart3 },
  { label: "Хабарламалар", href: "/chief-mentor/messages", icon: Mail },
  { label: "Журнал", href: "/chief-mentor/audit", icon: FileClock },
  { label: "Қолдау", href: "/chief-mentor/support", icon: Bell },
  { label: "Баптаулар", href: "/chief-mentor/settings", icon: Settings },
  { label: "Профиль", href: "/profile", icon: Users },
];

const leaderLinks: NavItem[] = [
  { label: "Басты бет", href: "/leader", icon: LayoutDashboard },
  { label: "Қызметкерлер", href: "/leader/staff", icon: Users },
  { label: "Командалар", href: "/leader/teams", icon: Users },
  { label: "Оқушылар", href: "/leader/students", icon: ClipboardCheck },
  { label: "Тапсырмалар", href: "/leader/tasks", icon: ClipboardList },
  { label: "Сабақтар", href: "/leader/content", icon: BookOpen },
  { label: "Тапсырыстар", href: "/leader/submissions", icon: ClipboardCheck },
  { label: "Аналитика", href: "/leader/analytics", icon: BarChart3 },
  { label: "Журнал", href: "/leader/audit", icon: FileText },
  { label: "Қолдау", href: "/leader/support", icon: Bell },
  { label: "Баптаулар", href: "/leader/settings", icon: Settings },
  { label: "Профиль", href: "/profile", icon: Users },
];

const roleLabels: Record<string, string> = {
  STUDENT: "Оқушы",
  MENTOR: "Ментор",
  CHIEF_MENTOR: "Бас ментор",
  LEADER: "Жетекші",
};

const roleHome: Record<string, string> = {
  STUDENT: "/dashboard",
  MENTOR: "/mentor",
  CHIEF_MENTOR: "/chief-mentor",
  LEADER: "/leader",
};

function isActive(pathname: string, href: string) {
  const route = href.split("#")[0];
  if (href.includes("#")) return false;
  const rootRoutes = new Set(["/dashboard", "/mentor", "/chief-mentor", "/leader"]);
  if (rootRoutes.has(route)) return pathname === route;
  return pathname === route || pathname.startsWith(route + "/");
}

function initials(name?: string) {
  if (!name) return "S";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "S"
  );
}

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span aria-label="Shyraq" className="inline-flex shrink-0 items-center">
      <svg
        width="116"
        height="34"
        viewBox="0 0 116 34"
        role="img"
        aria-label="SHYRAQ"
        className="block h-[26px] sm:h-[30px] w-auto"
      >
        <text
          x="0"
          y="26"
          fill="#172235"
          fontSize="27"
          fontWeight="800"
          letterSpacing="-0.35"
          fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        >
          SHYR
        </text>
        <g transform="translate(-15 0)">
          <path
            d="M100 25.8c-3.8-4.8-6.8-8.2-6.8-12.9 0-4.2 3-7.5 6.8-7.5s6.8 3.3 6.8 7.5c0 4.7-3 8.1-6.8 12.9Z"
            fill="#FF8000"
          />
          <path
            d="M100 20.4c-1.7-2.3-2.9-4.3-2.9-6.5 0-1.7 1.2-3 2.9-3s2.9 1.3 2.9 3c0 2.2-1.2 4.2-2.9 6.5Z"
            fill="#FFF7F1"
          />
          <circle cx="100" cy="25.1" r="1.3" fill="#FF8000" />
        </g>
        <text
          x="93"
          y="25"
          fill="#172235"
          fontSize="27"
          fontWeight="800"
          letterSpacing="-1.15"
          fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        >
          Q
        </text>
      </svg>
    </span>
  );
}

function NavLinks({
  links,
  pathname,
  close,
}: {
  links: NavItem[];
  pathname: string;
  close: () => void;
}) {
  return (
    <nav className="mt-6 space-y-1 pb-4" aria-label="Негізгі навигация">
      {links.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            aria-current={active ? "page" : undefined}
            className={[
              "group flex min-h-11 items-center gap-3 rounded-[13px] px-3.5 py-2.5 text-[12px] font-bold transition-all duration-200",
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_3px_0_0_var(--accent)]"
                : "text-[#6F665E] hover:bg-white hover:text-[#172235]",
            ].join(" ")}
          >
            <Icon size={17} strokeWidth={active ? 2.25 : 1.9} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function getMobileLinks(role: string, links: NavItem[]) {
  const preferredByRole: Record<string, string[]> = {
    STUDENT: ["/dashboard", "/lessons", "/tasks", "/profile", "/settings"],
    MENTOR: ["/mentor", "/mentor/team", "/mentor/tasks", "/mentor/reports", "/profile"],
    CHIEF_MENTOR: [
      "/chief-mentor",
      "/chief-mentor/mentors",
      "/chief-mentor/submissions",
      "/chief-mentor/reports",
      "/profile",
    ],
    LEADER: ["/leader", "/leader/staff", "/leader/students", "/leader/analytics", "/profile"],
  };

  const preferred = preferredByRole[role] ?? preferredByRole.STUDENT;
  const byHref = new Map(links.map((item) => [item.href, item]));
  return preferred.map((href) => byHref.get(href)).filter((item): item is NavItem => Boolean(item));
}

function MobileBottomNav({ links, pathname }: { links: NavItem[]; pathname: string }) {
  return (
    <nav
      className="shrq-mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#E8E3DD] bg-white/[0.96] shadow-[0_-12px_32px_rgba(23,34,53,.08)] backdrop-blur-xl lg:hidden"
      aria-label="Мобильді навигация"
    >
      <div className="mx-auto grid max-w-[520px] grid-cols-5 px-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          const label = item.label
            .replace("Басты бет", "Басты")
            .replace("Баптаулар", "Баптау")
            .replace("Тапсырмаларды тексеру", "Тексеру");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-[12px] px-1 py-2 text-center transition-colors",
                active ? "text-[var(--accent)]" : "text-[#8A8178]",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-8 w-10 place-items-center rounded-[11px] transition-colors",
                  active ? "bg-[var(--accent-soft)]" : "",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
              </span>
              <span className="max-w-full truncate text-[9px] font-extrabold leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppNav({ role, userName }: { role: string; userName?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = useMemo(() => {
    if (role === "LEADER") return leaderLinks;
    if (role === "CHIEF_MENTOR") return chiefMentorLinks;
    if (role === "MENTOR") return mentorLinks;
    return studentLinks;
  }, [role]);

  const mobileLinks = useMemo(() => getMobileLinks(role, links), [role, links]);
  const home = roleHome[role] ?? "/dashboard";

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-[60px] border-b border-[#E8E3DD] bg-[#FAF9F7]/94 backdrop-blur-xl lg:left-[236px] lg:h-[56px]">
        <div className="flex h-full items-center justify-between gap-3 px-3.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] text-[#172235] transition hover:bg-[var(--accent-soft)] lg:hidden"
              aria-label={mobileOpen ? "Мәзірді жабу" : "Мәзірді ашу"}
              aria-expanded={mobileOpen}
              aria-controls="shyraq-mobile-sidebar"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link href={home} className="lg:hidden" aria-label="Shyraq басты беті">
              <Wordmark compact />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {role === "STUDENT" ? <NotificationBell /> : null}
            <UserChip name={userName} role={role} />
          </div>
        </div>
      </header>

      <aside
        id="shyraq-mobile-sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 w-[min(86vw,300px)] border-r border-[#E8E3DD] bg-[#FAF9F7] px-3.5 py-4 shadow-[14px_0_40px_rgba(23,34,53,.08)] sm:px-4 sm:py-5",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-200 ease-out",
        ].join(" ")}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between px-2">
            <Link href={home} onClick={() => setMobileOpen(false)} aria-label="Shyraq басты беті">
              <Wordmark />
            </Link>
            <span className="hidden max-w-[112px] rounded-full bg-[var(--accent-soft)] px-2 py-1 text-center text-[8px] font-extrabold uppercase tracking-[.1em] text-[#B95D00] lg:inline-flex">
              {roleLabels[role] ?? role}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <NavLinks links={links} pathname={pathname} close={() => setMobileOpen(false)} />
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Мәзірді жабу"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[45] bg-[#172235]/15 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      <MobileBottomNav links={mobileLinks} pathname={pathname} />
    </>
  );
}

export function AppShell({
  children,
  title,
  description,
  right,
  role,
  userName,
  hideHeader = false,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  right?: ReactNode;
  role: string;
  userName?: string;
  hideHeader?: boolean;
}) {
  return (
    <div className="min-h-screen min-w-0 bg-[var(--background)] text-[var(--foreground)]">
      <AppNav role={role} userName={userName} />
      <div className="min-w-0 pb-[calc(78px+env(safe-area-inset-bottom))] pt-[60px] lg:ml-[236px] lg:pb-0 lg:pt-[56px]">
        {!hideHeader ? (
          <div className="border-b border-[#E8E3DD] bg-[#FAF9F7]/92 backdrop-blur">
            <div className="mx-auto flex min-h-[76px] max-w-[1320px] flex-col items-start justify-center gap-2 px-3.5 py-3.5 sm:min-h-[82px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
              <div className="min-w-0 max-w-full">
                <h1 className="line-clamp-2 text-[19px] font-extrabold leading-tight tracking-[-.04em] text-[#172235] sm:text-[22px]">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-4 text-[#857B72] sm:text-[11px]">
                    {description}
                  </p>
                ) : null}
              </div>
              {right ? <div className="shrink-0">{right}</div> : null}
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function UserChip({ name, role }: { name?: string; role?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[10px] font-extrabold text-[var(--accent)] ring-1 ring-[rgba(255,128,0,.14)]">
        {initials(name)}
      </span>
      <div className="hidden max-w-40 min-w-0 sm:block">
        <p className="truncate text-[10px] font-extrabold text-[#172235]">{name ?? "Shyraq"}</p>
        {role ? (
          <p className="mt-0.5 truncate text-[9px] font-semibold text-[#9A9189]">
            {roleLabels[role] ?? role}
          </p>
        ) : null}
      </div>
    </div>
  );
}
