"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

const baseCard = "rounded-[22px] border border-[#E8E3DD] bg-white";
const shadow = "shadow-[0_12px_34px_rgba(23,34,53,.045)]";

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={"mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 " + className}>{children}</main>;
}

export function Card({ children, className = "", dark = false }: { children: ReactNode; className?: string; dark?: boolean }) {
  return <section className={[baseCard, shadow, dark ? "border-[#172235] bg-[#172235] text-white shadow-[0_18px_52px_rgba(23,34,53,.12)]" : "", className].join(" ")}>{children}</section>;
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">{eyebrow}</p> : null}
        <h1 className="mt-1.5 text-[23px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-xs font-medium leading-5 text-[#766E66]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PrimaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return <button {...props} className={["inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#FF8000] px-4 py-2.5 text-[11px] font-extrabold text-white","shadow-[0_10px_24px_rgba(255,128,0,.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E56F00]","disabled:cursor-not-allowed disabled:opacity-50",className].join(" ")}>{children}</button>;
}

export function PrimaryLink({ href, className = "", children }: { href: string; className?: string; children: ReactNode }) {
  return <Link href={href} className={["inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#FF8000] px-4 py-2.5 text-[11px] font-extrabold text-white","shadow-[0_10px_24px_rgba(255,128,0,.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E56F00]",className].join(" ")}>{children}</Link>;
}

export function SecondaryLink({ href, className = "", children }: { href: string; className?: string; children: ReactNode }) {
  return <Link href={href} className={["inline-flex items-center justify-center gap-2 rounded-[13px] border border-[#E8E3DD] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#3F3832]","transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFFBF6]",className].join(" ")}>{children}</Link>;
}

export function MetricCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#9A9189]">{label}</p>
          <p className="mt-2 truncate text-[23px] font-extrabold tracking-[-.045em] text-[#172235]">{value}</p>
          {hint ? <p className="mt-1 truncate text-[10px] font-medium text-[#8B8179]">{hint}</p> : null}
        </div>
        {icon ? <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#FFF1E2] text-[#FF8000]">{icon}</span> : null}
      </div>
    </Card>
  );
}

export function ProgressBar({ value, label, className = "" }: { value: number; label?: string; className?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return <div className={className}>{label ? <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-[#8B8179]"><span>{label}</span><span className="font-extrabold text-[#172235]">{safe}%</span></div> : null}<div className="h-2 overflow-hidden rounded-full bg-[#EFEAE4]"><div className="h-full rounded-full bg-[#FF8000] transition-[width] duration-300" style={{ width: safe + "%" }} /></div></div>;
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "orange" | "green" | "red" }) {
  const toneClass = { neutral: "bg-[#F4F1EC] text-[#7F756D]", orange: "bg-[#FFF1E2] text-[#B95D00]", green: "bg-[#EDF8F2] text-[#2E7E58]", red: "bg-[#FFF0EE] text-[#BF514A]" }[tone];
  return <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-extrabold " + toneClass}>{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="rounded-[18px] border border-dashed border-[#DDD6CE] bg-[#FFFCF8] px-6 py-12 text-center"><p className="text-sm font-extrabold text-[#3F3832]">{title}</p>{description ? <p className="mt-1.5 text-xs font-medium text-[#9A9189]">{description}</p> : null}</div>;
}
