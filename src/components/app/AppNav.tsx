"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Medal,
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
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
}

function initials(name?: string) {
  if (!name) return "S";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";
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
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 shadow-soft transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.05)] lg:hidden"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r border-gray-100 bg-[#FAFAFA] px-3 py-4 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="px-3 pb-6">
          <Link
            href={role === "ADMIN" ? "/admin" : role === "MENTOR" ? "/mentor" : "/dashboard"}
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center gap-2.5"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#C25100] text-sm font-bold text-white">
              S
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-gray-900">Shyraq</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                {roleLabels[role] ?? role}
              </p>
            </div>
          </Link>
        </div>

        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out",
                  active
                    ? "bg-[#C25100]/10 text-[#C25100]"
                    : "text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-soft",
                ].join(" ")}
              >
                <Icon size={17} strokeWidth={active ? 2.1 : 1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-1">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-soft">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#C25100]/10 text-xs font-semibold text-[#C25100]">
              {initials(userName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-900">{userName ?? "Shyraq user"}</p>
              <p className="mt-0.5 text-[10px] text-gray-400">Аккаунт белсенді</p>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Мәзірді жабу"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/10 lg:hidden"
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
  children: React.ReactNode;
  title: string;
  description?: string;
  right?: React.ReactNode;
  role: string;
  userName?: string;
}) {
  return (
    <div className="min-h-screen bg-white lg:pl-[236px]">
      <AppNav role={role} userName={userName} />
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="pl-12 lg:pl-0">
              <h1 className="text-base font-semibold tracking-tight text-gray-900 sm:text-lg">{title}</h1>
              {description ? <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">{description}</p> : null}
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
    <div className="flex items-center gap-2 rounded-full bg-[#FAFAFA] px-2.5 py-1.5">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#C25100]/10 text-[11px] font-semibold text-[#C25100]">
        {initials(name)}
      </span>
      <div className="hidden min-w-0 sm:block">
        <p className="max-w-32 truncate text-xs font-semibold text-gray-900">{name ?? "Shyraq"}</p>
        {role ? <p className="text-[10px] text-gray-400">{roleLabels[role] ?? role}</p> : null}
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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1.5 truncate text-lg font-semibold tracking-tight text-gray-900">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}
