"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Medal,
  Menu,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const studentLinks: NavItem[] = [
  { label: "Басты бет", href: "/dashboard", icon: LayoutDashboard },
  { label: "Тапсырмалар", href: "/tasks", icon: ClipboardList },
  { label: "Есептер", href: "/reports", icon: BarChart3 },
  { label: "Сабақтар", href: "/lessons", icon: BookOpen },
  { label: "Рейтинг", href: "/rankings", icon: Trophy },
  { label: "Баптаулар", href: "/settings", icon: Settings },
];

const operationsLinks: NavItem[] = [
  { label: "Басты бет", href: "/dashboard", icon: LayoutDashboard },
  { label: "Рейтинг", href: "/rankings", icon: Medal },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
}

export function AppNav({ role }: { role: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = role === "STUDENT" ? studentLinks : operationsLinks;

  if (role === "MENTOR") {
    links.push({ label: "Ментор", href: "/mentor", icon: Users });
  }

  if (role === "ADMIN") {
    links.push({ label: "Админ", href: "/admin", icon: Users });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Мәзірді ашу"
        onClick={() => setMobileOpen((open) => !open)}
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 shadow-soft transition-all duration-300 ease-in-out lg:hidden"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r border-gray-100 bg-[#FAFAFA] px-3 py-4 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="px-3 pb-5">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#C25100] text-sm font-bold text-white">
              S
            </span>
            <span>Shyraq</span>
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
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3">
          <div className="rounded-2xl bg-white p-3 shadow-soft">
            <p className="text-xs font-semibold text-gray-900">Shyraq</p>
            <p className="mt-1 text-[11px] leading-4 text-gray-500">Оқу прогресіңіз бір жерде.</p>
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
  right,
  role,
}: {
  children: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  role: string;
}) {
  return (
    <div className="min-h-screen bg-white lg:pl-[236px]">
      <AppNav role={role} />
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="pl-12 lg:pl-0">
              <h1 className="text-base font-semibold tracking-tight text-gray-900 sm:text-lg">{title}</h1>
            </div>
            <div className="flex items-center gap-2">{right}</div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
