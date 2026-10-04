"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { uiLabel } from "@/lib/ui-labels";

const baseCard =
  "rounded-[24px] border border-[var(--border)] bg-[var(--card)]";
const shadow =
  "shadow-[0_12px_34px_rgba(23,34,53,.045)]";

export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={
        "mx-auto w-full min-w-0 max-w-[1320px] px-3.5 py-4 pb-2 sm:px-6 sm:py-7 sm:pb-4 lg:px-8 lg:pb-5 " +
        className
      }
    >
      <div className="shrq-page-enter min-w-0">{children}</div>
    </main>
  );
}

export function Card({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      className={[
        "shrq-card",
        baseCard,
        shadow,
        dark
          ? "border-[#172235] bg-[#172235] text-white shadow-[0_18px_52px_rgba(23,34,53,.12)]"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[var(--accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 text-[22px] leading-tight font-extrabold tracking-[-.045em] text-[var(--foreground)] sm:text-[30px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-xs font-medium leading-5 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PrimaryButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-4 py-2.5 text-[11px] font-extrabold text-white",
        "shadow-[0_10px_24px_rgba(255,128,0,.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-dark)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,128,0,.16)]",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function PrimaryLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-4 py-2.5 text-[11px] font-extrabold text-white",
        "shadow-[0_10px_24px_rgba(255,128,0,.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-dark)]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,128,0,.16)]",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#3F3832]",
        "transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFFBF6]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,128,0,.12)]",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#9A9189]">
            {label}
          </p>
          <p className="mt-2 truncate text-[24px] font-extrabold tracking-[-.045em] text-[var(--foreground)]">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 truncate text-[10px] font-medium text-[#8B8179]">
              {hint}
            </p>
          ) : null}
        </div>
        {icon ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[var(--accent-soft)] text-[var(--accent)]">
            {icon}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function ProgressBar({
  value,
  label,
  className = "",
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-[#8B8179]">
          <span>{label}</span>
          <span className="font-extrabold text-[var(--foreground)]">{safe}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-[#EFEAE4]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
          style={{ width: safe + "%" }}
        />
      </div>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "orange" | "green" | "red";
}) {
  const toneClass = {
    neutral: "bg-[#F4F1EC] text-[#7F756D]",
    orange: "bg-[var(--accent-soft)] text-[#B95D00]",
    green: "bg-[#EDF8F2] text-[#2E7E58]",
    red: "bg-[#FFF0EE] text-[#BF514A]",
  }[tone];

  const display = typeof children === "string" ? uiLabel(children) : children;

  return (
    <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-extrabold " + toneClass}>
      {display}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#DDD6CE] bg-[#FFFCF8] px-6 py-12 text-center">
      <p className="text-sm font-extrabold text-[#3F3832]">{title}</p>
      {description ? (
        <p className="mt-1.5 text-xs font-medium text-[#9A9189]">{description}</p>
      ) : null}
    </div>
  );
}
