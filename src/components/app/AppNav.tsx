"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
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
  { label: "Сабақтар", href: "/lessons", icon: BookOpen },
  { label: "Есептер", href: "/reports", icon: FileText },
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

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      width={compact ? 94 : 116}
      height="34"
      viewBox="0 0 116 34"
      role="img"
      aria-label="SHYRAQ"
      className="block"
    >
      <text x="0" y="26" fill="#172235" fontSize="27" fontWeight="800" letterSpacing="-1.15" fontFamily="Arial, Helvetica, sans-serif">
        SHYR
      </text>
      <g transform="translate(-12 0)">
        <path d="M100 25.8c-3.8-4.8-6.8-8.2-6.8-12.9 0-4.2 3-7.5 6.8-7.5s6.8 3.3 6.8 7.5c0 4.7-3 8.1-6.8 12.9Z" fill="#FF6F2C" />
        <path d="M100 20.4c-1.7-2.3-2.9-4.3-2.9-6.5 0-1.7 1.2-3 2.9-3s2.9 1.3 2.9 3c0 2.2-1.2 4.2-2.9 6.5Z" fill="#FFF7F1" />
        <circle cx="100" cy="25.1" r="1.3" fill="#FF6F2C" />
      </g>
      <text x="94" y="26" fill="#172235" fontSize="27" fontWeight="800" letterSpacing="-1.15" fontFamily="Arial, Helvetica, sans-serif">
        Q
      </text>
    </svg>
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
      <header className="sticky top-0 z-30 h-[72px] border-b border-[#E7EBF0] bg-white">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-7">
          <Link
            href={role === "ADMIN" ? "/admin" : role === "MENTOR" ? "/mentor" : "/dashboard"}
            aria-label="Shyraq"
            className="inline-flex items-center"
          >
            <Wordmark />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Хабарландырулар"
              className="grid h-10 w-10 place-items-center rounded-full text-[#6F7E95] transition hover:bg-[#F5F7FA] hover:text-[#172235]"
            >
              <Bell size={18} strokeWidth={1.9} />
            </button>
            <UserChip name={userName} role={role} />
            <button
              type="button"
              aria-label="Мәзірді ашу"
              onClick={() => setMobileOpen((open) => !open)}
              className="ml-1 grid h-10 w-10 place-items-center rounded-full text-[#172235] lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <aside
        className={[
          "fixed left-0 top-[72px] z-40 h-[calc(100vh-72px)] w-[232px] border-r border-[#E7EBF0] bg-[#FAFBFC] px-3 py-4",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300 ease-out",
        ].join(" ")}
      >
        <div className="mb-4 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#A0AABB]">Shyraq</p>
          <p className="mt-1 text-xs font-semibold text-[#7A8699]">{roleLabels[role] ?? role}</p>
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
                  "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-[#FFF0E8] text-[#FF6F2C]"
                    : "text-[#55647A] hover:bg-white hover:text-[#172235]",
                ].join(" ")}
              >
                <Icon size={17} strokeWidth={active ? 2.1 : 1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-3 right-3 rounded-[14px] border border-[#E6EBF1] bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9AA6B6]">Профиль</p>
          <p className="mt-1 truncate text-xs font-bold text-[#172235]">{userName ?? "Shyraq қолданушысы"}</p>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Мәзірді жабу"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 top-[72px] z-30 bg-[#172235]/10 backdrop-blur-[1px] lg:hidden"
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
    <div className="min-h-screen bg-[#F5F7FA] text-[#172235]">
      <AppNav role={role} userName={userName} />
      <div className="lg:pl-[232px]">
        <div className="border-b border-[#E7EBF0] bg-white">
          <div className="flex min-h-[70px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-extrabold tracking-[-.02em] text-[#172235]">{title}</h1>
              {description ? <p className="mt-0.5 truncate text-[11px] font-medium text-[#8995A7]">{description}</p> : null}
            </div>
            {right ? <div>{right}</div> : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function UserChip({ name, role }: { name?: string; role?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FF6F2C] text-[11px] font-extrabold text-white">
        {initials(name)}
      </span>
      <div className="hidden sm:block">
        <p className="max-w-32 truncate text-[11px] font-extrabold text-[#172235]">{name ?? "Shyraq"}</p>
        {role ? <p className="text-[9px] font-medium text-[#98A3B3]">{roleLabels[role] ?? role}</p> : null}
      </div>
    </div>
  );
}

export function CompactStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-[#E7EBF0] bg-white p-3.5">
      <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#9BA7B7]">{label}</p>
      <p className="mt-1.5 truncate text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] font-medium text-[#8B97A7]">{hint}</p> : null}
    </div>
  );
}
