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

type NavItem = { label: string; href: string; icon: LucideIcon };

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

function Wordmark() {
  return (
    <span aria-label="Shyraq" className="inline-flex items-center">
      <span className="text-[25px] font-extrabold tracking-[-0.08em] text-[#172235]">
        SHYR<span className="text-[#FF6F2C]">A</span>Q
      </span>
    </span>
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
      <header className="sticky top-0 z-40 h-[68px] border-b border-[#E8E1DA] bg-[#FBFAF7]/95 backdrop-blur-xl lg:ml-[236px]">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-[12px] text-[#172235] transition hover:bg-[#FFF0E8] lg:hidden"
            aria-label="Мәзір"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Хабарландырулар"
              className="grid h-10 w-10 place-items-center rounded-[12px] text-[#81766D] transition hover:bg-[#F6F2ED] hover:text-[#172235]"
            >
              <Bell size={17} strokeWidth={1.9} />
            </button>
            <UserChip name={userName} role={role} />
          </div>
        </div>
      </header>

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[236px] border-r border-[#E8E1DA] bg-[#FBFAF7] px-4 py-5",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-200 ease-out",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-2">
            <Link href={role === "ADMIN" ? "/admin" : role === "MENTOR" ? "/mentor" : "/dashboard"} onClick={() => setMobileOpen(false)}>
              <Wordmark />
            </Link>
            <span className="hidden rounded-full bg-[#FFF0E8] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[.14em] text-[#D65E25] lg:inline-flex">
              {roleLabels[role] ?? role}
            </span>
          </div>

          <nav className="mt-9 space-y-1.5">
            {links.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[12px] font-bold transition-all duration-200",
                    active
                      ? "bg-[#FFF0E8] text-[#FF6F2C]"
                      : "text-[#6F665E] hover:bg-white hover:text-[#172235]",
                  ].join(" ")}
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[18px] border border-[#E8E1DA] bg-white p-3.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#A19890]">Профиль</p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FF6F2C] text-[10px] font-extrabold text-white">{initials(userName)}</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-extrabold text-[#172235]">{userName ?? "Shyraq"}</p>
                <p className="mt-0.5 text-[9px] font-semibold text-[#A19890]">{roleLabels[role] ?? role}</p>
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
          className="fixed inset-0 z-40 bg-[#172235]/10 backdrop-blur-[1px] lg:hidden"
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
    <div className="min-h-screen bg-[#FBFAF7] text-[#172235]">
      <AppNav role={role} userName={userName} />
      <div className="lg:ml-[236px]">
        {!hideHeader ? (
          <div className="border-b border-[#E8E1DA] bg-[#FBFAF7]">
            <div className="mx-auto flex min-h-[88px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <h1 className="truncate text-[22px] font-extrabold tracking-[-.04em] text-[#172235]">{title}</h1>
                {description ? <p className="mt-1 truncate text-[11px] font-medium text-[#857B72]">{description}</p> : null}
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
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">{initials(name)}</span>
      <div className="hidden max-w-36 min-w-0 sm:block">
        <p className="truncate text-[10px] font-extrabold text-[#172235]">{name ?? "Shyraq"}</p>
        {role ? <p className="mt-0.5 truncate text-[9px] font-semibold text-[#9A9189]">{roleLabels[role] ?? role}</p> : null}
      </div>
    </div>
  );
}

export function CompactStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[20px] border border-[#E8E1DA] bg-white p-4 shadow-[0_12px_40px_rgba(23,34,53,.05)]">
      <p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#9A9189]">{label}</p>
      <p className="mt-2 text-[21px] font-extrabold tracking-[-.04em] text-[#172235]">{value}</p>
      {hint ? <p className="mt-1 text-[10px] font-medium text-[#8B8179]">{hint}</p> : null}
    </div>
  );
}
