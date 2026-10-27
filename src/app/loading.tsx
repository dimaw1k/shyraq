"use client";

import { usePathname } from "next/navigation";
import { Montserrat } from "next/font/google";
import { AppShell } from "@/components/app/AppNav";

const montserrat = Montserrat({
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

type AppRole = "STUDENT" | "MENTOR" | "CHIEF_MENTOR" | "LEADER";

function getRole(pathname: string): AppRole | null {
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/temporarily-closed") ||
    pathname.startsWith("/api/")
  ) {
    return null;
  }

  if (pathname === "/chief-mentor" || pathname.startsWith("/chief-mentor/")) return "CHIEF_MENTOR";
  if (pathname === "/mentor" || pathname.startsWith("/mentor/")) return "MENTOR";
  if (pathname === "/leader" || pathname.startsWith("/leader/")) return "LEADER";

  return "STUDENT";
}

function ContentSkeleton() {
  return (
    <div
      className={montserrat.className + " mx-auto w-full max-w-[1380px] px-3.5 py-5 sm:px-6 lg:px-8"}
      role="status"
      aria-live="polite"
      aria-label="Контент жүктелуде"
    >
      <div className="animate-pulse space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-28 rounded-[20px] border border-[#E8E1DA] bg-white" />
          <div className="h-28 rounded-[20px] border border-[#E8E1DA] bg-white" />
          <div className="hidden h-28 rounded-[20px] border border-[#E8E1DA] bg-white xl:block" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,2fr)]">
          <div className="min-h-52 rounded-[20px] border border-[#E8E1DA] bg-white p-4">
            <div className="h-3 w-1/2 rounded-full bg-[#F0ECE7]" />
            <div className="mt-5 space-y-3">
              <div className="h-9 rounded-xl bg-[#FAF8F5]" />
              <div className="h-9 rounded-xl bg-[#FAF8F5]" />
              <div className="h-9 rounded-xl bg-[#FAF8F5]" />
            </div>
          </div>
          <div className="min-h-52 rounded-[20px] border border-[#E8E1DA] bg-white p-4">
            <div className="h-3 w-1/3 rounded-full bg-[#F0ECE7]" />
            <div className="mt-5 space-y-3">
              <div className="h-12 rounded-xl bg-[#FAF8F5]" />
              <div className="h-12 rounded-xl bg-[#FAF8F5]" />
              <div className="h-12 rounded-xl bg-[#FAF8F5]" />
            </div>
          </div>
        </div>
        <p className="text-center text-xs font-medium text-[#8B8179]">Жүктелуде</p>
      </div>
    </div>
  );
}

function PublicLoading() {
  return (
    <main className={montserrat.className + " flex min-h-screen items-center justify-center bg-[#FAF9F7] px-5 text-[#172235]"}>
      <div className="w-full max-w-sm rounded-[24px] border border-[#E8E3DD] bg-white p-6 shadow-[0_18px_55px_rgba(23,34,53,.06)]">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#FFF1E2] text-[#FF8000]">
            <span className="h-4 w-4 animate-pulse rounded-full bg-[#FF8000]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#ECE7E1]" />
            <div className="mt-2 h-2 w-40 animate-pulse rounded-full bg-[#F2EEE9]" />
          </div>
        </div>
        <div className="mt-6 h-2.5 w-full animate-pulse rounded-full bg-[#F0ECE7]" />
        <p className="mt-3 text-center text-[10px] font-semibold text-[#9A9189]">Жүктелуде</p>
      </div>
    </main>
  );
}

export default function Loading() {
  const pathname = usePathname() ?? "/";
  const role = getRole(pathname);

  if (!role) return <PublicLoading />;

  // Keep the existing role-specific navigation in place. Only the page content
  // is replaced while loading; hide the shared title header so the fallback
  // doesn't temporarily introduce different typography/layout from the page.
  return (
    <AppShell role={role} title="" hideHeader>
      <ContentSkeleton />
    </AppShell>
  );
}
