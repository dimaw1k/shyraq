"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileText,
  Flame,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const studentLinks: NavItem[] = [
  { label: "Басты бет", href: "/dashboard", icon: LayoutDashboard },
  { label: "Тапсырмалар", href: "/tasks", icon: ClipboardList },
  { label: "Есептер", href: "/reports", icon: FileText },
  { label: "Сабақтар", href: "/lessons", icon: BookOpen },
  { label: "Рейтинг", href: "/rankings", icon: Trophy },
  { label: "Баптаулар", href: "/settings", icon: Settings },
];

const mentorLinks: NavItem[] = [
  { label: "Басты бет", href: "/mentor", icon: LayoutDashboard },
  { label: "Рейтинг", href: "/rankings", icon: Trophy },
];

const adminLinks: NavItem[] = [
  { label: "Басқару панелі", href: "/admin", icon: LayoutDashboard },
  { label: "Оқушылар", href: "/admin/users", icon: Users },
  { label: "Командалар", href: "/admin/teams", icon: Users },
  { label: "Сабақтар", href: "/admin/lessons", icon: BookOpen },
  { label: "Тапсырмалар", href: "/admin/tasks", icon: ClipboardList },
  { label: "Тесттер", href: "/admin/tests", icon: FileText },
  { label: "Ұпай ережелері", href: "/admin/score-rules", icon: ShieldCheck },
];

const roleLabels: Record<string, string> = {
  STUDENT: "Оқушы",
  MENTOR: "Ментор",
  ADMIN: "Админ",
};

function isActive(pathname: string, href: string) {
  const rootRoutes = new Set(["/dashboard", "/mentor", "/admin"]);
  return pathname === href || (!rootRoutes.has(href) && pathname.startsWith(href + "/"));
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

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#172235] text-white shadow-[0_10px_24px_rgba(23,34,53,.16)]">
        <span className="text-sm font-extrabold tracking-[-.06em]">SHR</span>
      </div>
      <div>
        <p className="text-[17px] font-extrabold tracking-[-.05em] text-[#172235]">
          SHYR<span className="text-[#FF6F2C]">A</span>Q
        </p>
        <p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[.18em] text-[#AAA198]">Оқу платформасы</p>
      </div>
    </div>
  );
}

export function AppNav({ role, userName }: { role: string; userName?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = useMemo(() => {
    if (role === "ADMIN") return adminLinks;
    if (role === "MENTOR") return mentorLinks;
    return studentLinks;
  }, [role]);

  return (
    <>
      <button
        type="button"
        aria-label="Мәзірді ашу"
        onClick={() => setMobileOpen((open) => !open)}
        className="fixed left-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#EAE4DC] bg-white text-[#172235] shadow-[0_12px_28px_rgba(35,23,15,.08)] transition hover:-translate-y-0.5 lg:hidden"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#EEE8E0] bg-[#FBFAF7] px-4 py-5 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="px-2 pb-7">
          <Link
            href={role === "ADMIN" ? "/admin" : role === "MENTOR" ? "/mentor" : "/dashboard"}
            onClick={() => setMobileOpen(false)}
            aria-label="Shyraq"
          >
            <Wordmark />
          </Link>
        </div>

        <div className="mb-5 rounded-[22px] bg-gradient-to-br from-[#FFF0E8] to-[#FFE1D2] p-4">
          <div className="flex items-center gap-2 text-[#7B5F52]">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/75 text-[#FF6F2C]">
              <Flame size={15} />
            </span>
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[.18em]">ОҚУ РЕЖИМІ</p>
              <p className="mt-0.5 text-xs font-bold text-[#172235]">{roleLabels[role] ?? role}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1.5">
          {links.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all duration-300",
                  active
                    ? "bg-[#172235] text-white shadow-[0_12px_28px_rgba(23,34,53,.12)]"
                    : "text-[#746C63] hover:bg-white hover:text-[#172235] hover:shadow-[0_8px_22px_rgba(35,23,15,.05)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-8 w-8 place-items-center rounded-xl transition",
                    active
                      ? "bg-[#FF6F2C] text-white"
                      : "bg-[#F2EDE7] text-[#8F867D] group-hover:bg-[#FFF0E8] group-hover:text-[#FF6F2C]",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={active ? 2.3 : 1.9} />
                </span>
                <span>{item.label}</span>
                {active ? <ArrowRight className="ml-auto opacity-60" size={14} /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="rounded-[24px] border border-[#EEE8E0] bg-white p-3 shadow-[0_12px_30px_rgba(35,23,15,.05)]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#172235] text-xs font-extrabold text-white">
                {initials(userName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-[#172235]">{userName ?? "Shyraq user"}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-[#AAA198]">{roleLabels[role] ?? role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Мәзірді жабу"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[#172235]/20 backdrop-blur-sm lg:hidden"
        />
      ) : null}
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
}: {
  children: ReactNode;
  title: string;
  description?: string;
  right?: ReactNode;
  role: string;
  userName?: string;
}) {
  return (
    <div className="min-h-screen bg-[#FBFAF7] lg:pl-[248px]">
      <AppNav role={role} userName={userName} />
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-[#EEE8E0]/80 bg-[#FBFAF7]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="pl-14 lg:pl-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#FF6F2C]">SHYRAQ</p>
              <h1 className="mt-1 text-lg font-extrabold tracking-[-.04em] text-[#172235] sm:text-xl">{title}</h1>
              {description ? <p className="mt-0.5 hidden max-w-xl text-xs font-medium leading-5 text-[#8A8178] sm:block">{description}</p> : null}
            </div>
            <div className="flex items-center gap-2">{right}</div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export function UserChip({ name, role }: { name?: string; role?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#EEE8E0] bg-white/90 px-2.5 py-2 shadow-[0_8px_22px_rgba(35,23,15,.04)]">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">
        {initials(name)}
      </span>
      <div className="hidden min-w-0 sm:block">
        <p className="max-w-32 truncate text-[11px] font-extrabold text-[#172235]">{name ?? "Shyraq"}</p>
        {role ? <p className="text-[9px] font-semibold text-[#AAA198]">{roleLabels[role] ?? role}</p> : null}
      </div>
    </div>
  );
}

export function CompactStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#EEE8E0] bg-white p-4 shadow-[0_12px_30px_rgba(35,23,15,.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(35,23,15,.07)]">
      <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#AAA198]">{label}</p>
      <p className="mt-2 text-xl font-extrabold tracking-[-.04em] text-[#172235]">{value}</p>
      {hint ? <p className="mt-1 text-[10px] font-semibold text-[#8E857C]">{hint}</p> : null}
    </div>
  );
}
