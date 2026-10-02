"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Bell, BookOpen, ClipboardCheck, ClipboardList, FileText, LayoutDashboard, Menu, Settings, Trophy, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
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
  { label: "Менің командам", href: "/mentor#team", icon: Users },
  { label: "Тапсырманы тексеру", href: "/mentor/submissions", icon: ClipboardCheck },
  { label: "Есептер", href: "/mentor#reports", icon: FileText },
  { label: "Meet", href: "/mentor#meet", icon: Activity },
  { label: "Рейтинг", href: "/rankings", icon: Trophy },
];

const chiefMentorLinks: NavItem[] = [
  { label: "Басты бет", href: "/chief-mentor", icon: LayoutDashboard },
  { label: "Менторлар", href: "/chief-mentor/mentors", icon: Users },
  { label: "Командалар", href: "/chief-mentor/teams", icon: Users },
  { label: "Сабақтар", href: "/chief-mentor/lessons", icon: BookOpen },
  { label: "Тапсырмалар", href: "/chief-mentor/tasks", icon: ClipboardList },
  { label: "Тапсырманы тексеру", href: "/chief-mentor/submissions", icon: ClipboardCheck },
  { label: "Есептер", href: "/chief-mentor/reports", icon: FileText },
  { label: "Аналитика", href: "/chief-mentor/analytics", icon: BarChart3 },
];

const leaderLinks: NavItem[] = [
  { label: "Басқару", href: "/leader", icon: LayoutDashboard },
  { label: "Қызметкерлер", href: "/leader/staff", icon: Users },
  { label: "Командалар", href: "/leader/teams", icon: Users },
  { label: "Оқушылар", href: "/leader/students", icon: ClipboardCheck },
  { label: "Контент", href: "/leader/content", icon: BookOpen },
  { label: "Тапсырыстар", href: "/leader/submissions", icon: ClipboardCheck },
  { label: "Аналитика", href: "/leader/analytics", icon: BarChart3 },
  { label: "Журнал", href: "/leader/audit", icon: FileText },
  { label: "Қолдау", href: "/leader/support", icon: Bell },
  { label: "Баптаулар", href: "/leader/settings", icon: Settings },
];

const roleLabels: Record<string, string> = {
  STUDENT: "Оқушы",
  MENTOR: "Ментор",
  CHIEF_MENTOR: "Аға ментор",
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
  const rootRoutes = new Set(["/dashboard", "/mentor", "/chief-mentor", "/leader"]);
  return pathname === route || (!rootRoutes.has(route) && pathname.startsWith(route + "/"));
}

function initials(name?: string) {
  if (!name) return "S";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "S";
}

function Wordmark() {
  return <span aria-label="Shyraq" className="inline-flex items-center"><span className="text-[25px] font-extrabold tracking-[-0.08em] text-[#172235]">SHYR<span className="text-[#FF8000]">A</span>Q</span></span>;
}

function NavLinks({ links, pathname, close }: { links: NavItem[]; pathname: string; close: () => void }) {
  return (
    <nav className="mt-8 space-y-1" aria-label="Негізгі навигация">
      {links.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} onClick={close} aria-current={active ? "page" : undefined}
            className={["group flex items-center gap-3 rounded-[13px] px-3.5 py-2.75 text-[12px] font-bold transition-all duration-200", active ? "bg-[#FFF1E2] text-[#FF8000]" : "text-[#6F665E] hover:bg-white hover:text-[#172235]"].join(" ")}>
            <Icon size={17} strokeWidth={active ? 2.25 : 1.9} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
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
  const home = roleHome[role] ?? "/dashboard";

  return (
    <>
      <header className="sticky top-0 z-40 h-[68px] border-b border-[#E8E3DD] bg-[#FAF9F7]/92 backdrop-blur-xl lg:ml-[236px]">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMobileOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-[12px] text-[#172235] transition hover:bg-[#FFF1E2] lg:hidden" aria-label={mobileOpen ? "Мәзірді жабу" : "Мәзірді ашу"} aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2">
            {role === "STUDENT" ? <NotificationBell /> : null}
            <UserChip name={userName} role={role} />
          </div>
        </div>
      </header>

      <aside className={["fixed inset-y-0 left-0 z-50 w-[236px] border-r border-[#E8E3DD] bg-[#FAF9F7] px-4 py-5", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", "transition-transform duration-200 ease-out"].join(" ")}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-2">
            <Link href={home} onClick={() => setMobileOpen(false)} aria-label="Shyraq басты беті"><Wordmark /></Link>
            <span className="hidden max-w-[112px] rounded-full bg-[#FFF1E2] px-2 py-1 text-center text-[8px] font-extrabold uppercase tracking-[.1em] text-[#B95D00] lg:inline-flex">{roleLabels[role] ?? role}</span>
          </div>
          <NavLinks links={links} pathname={pathname} close={() => setMobileOpen(false)} />
          <div className="mt-auto rounded-[18px] border border-[#E8E3DD] bg-white p-3.5 shadow-[0_10px_28px_rgba(23,34,53,.04)]">
            <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#A19890]">Профиль</p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">{initials(userName)}</span>
              <div className="min-w-0"><p className="truncate text-[11px] font-extrabold text-[#172235]">{userName ?? "Shyraq"}</p><p className="mt-0.5 truncate text-[9px] font-semibold text-[#A19890]">{roleLabels[role] ?? role}</p></div>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? <button type="button" aria-label="Мәзірді жабу" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#172235]/15 backdrop-blur-[1px] lg:hidden" /> : null}
    </>
  );
}

export function AppShell({ children, title, description, right, role, userName, hideHeader = false }: { children: ReactNode; title: string; description?: string; right?: ReactNode; role: string; userName?: string; hideHeader?: boolean }) {
  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#172235]">
      <AppNav role={role} userName={userName} />
      <div className="lg:ml-[236px]">
        {!hideHeader ? <div className="border-b border-[#E8E3DD] bg-[#FAF9F7]/92 backdrop-blur"><div className="mx-auto flex min-h-[84px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><div className="min-w-0"><h1 className="truncate text-[22px] font-extrabold tracking-[-.04em] text-[#172235]">{title}</h1>{description ? <p className="mt-1 truncate text-[11px] font-medium text-[#857B72]">{description}</p> : null}</div>{right ? <div className="shrink-0">{right}</div> : null}</div></div> : null}
        {children}
      </div>
    </div>
  );
}

export function UserChip({ name, role }: { name?: string; role?: string }) {
  return <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">{initials(name)}</span><div className="hidden max-w-40 min-w-0 sm:block"><p className="truncate text-[10px] font-extrabold text-[#172235]">{name ?? "Shyraq"}</p>{role ? <p className="mt-0.5 truncate text-[9px] font-semibold text-[#9A9189]">{roleLabels[role] ?? role}</p> : null}</div></div>;
}
