"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import { formatKzDateTime, parseKzDateTime, toKzDatetimeLocal } from "@/lib/datetime";

export { formatKzDateTime, parseKzDateTime };

export type MenuOption = { value: string; label: string };

export function StaffSelectMenu({
  value,
  options,
  placeholder = "Таңдаңыз",
  onChange,
  disabled = false,
}: {
  value: string;
  options: MenuOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = options.find((item) => item.value === value)?.label ?? placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[14px] border border-[#E8E1DA] bg-white px-3.5 py-2.5 text-left text-[11px] font-semibold text-[#172235] outline-none transition hover:border-[#FFB067] disabled:cursor-not-allowed disabled:opacity-60"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={15} className={open ? "shrink-0 rotate-180 transition-transform" : "shrink-0 transition-transform"} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] rounded-[14px] border border-[#E8E1DA] bg-white p-1.5 shadow-[0_20px_50px_rgba(23,34,53,.14)]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[11px] font-semibold transition",
                value === option.value ? "bg-[#FFF1E2] text-[#C95500]" : "text-[#4B433C] hover:bg-[#FAF7F3]",
              ].join(" ")}
            >
              <span>{option.label}</span>
              {value === option.value ? <Check size={13} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StaffDateTimeField({
  value,
  onChange,
  label = "Күн мен уақыт",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="relative">
      <input
        type="datetime-local"
        step="1"
        value={toKzDatetimeLocal(value)}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-11 w-full rounded-[14px] border border-[#E8E1DA] bg-white px-3.5 text-[11px] font-semibold text-[#172235] outline-none transition focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
      />
    </div>
  );
}

export function StaffModal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : previousOverflow;

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#172235]/30 p-3 backdrop-blur-[3px] sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[10000] w-full max-w-[760px] rounded-[24px] border border-white/80 bg-[#FAF9F7] shadow-[0_30px_90px_rgba(23,34,53,.25)] sm:max-h-[calc(100vh-48px)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E8E1DA] bg-[#FAF9F7] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">{title}</h2>
            {description ? <p className="mt-1 text-[10px] font-medium leading-5 text-[#857B72]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-[#E8E1DA] bg-white text-[#5B534C] transition hover:bg-[#FFF1E2]"
            aria-label="Жабу"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export const staffInputClass =
  "h-11 w-full rounded-[14px] border border-[#E8E1DA] bg-white px-3.5 text-[11px] font-semibold text-[#172235] outline-none transition focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10";
