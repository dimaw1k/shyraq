"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

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
  label = "Уақыт",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => value ? value.slice(0, 10) : "");
  const [hour, setHour] = useState(() => value ? value.slice(11, 13) : "12");
  const [minute, setMinute] = useState(() => value ? value.slice(14, 16) : "00");

  useEffect(() => {
    if (!value) {
      setDate("");
      return;
    }
    setDate(value.slice(0, 10));
    setHour(value.slice(11, 13) || "12");
    setMinute(value.slice(14, 16) || "00");
  }, [value]);

  function commit(nextDate = date, nextHour = hour, nextMinute = minute) {
    if (!nextDate) {
      onChange("");
      return;
    }
    onChange(nextDate + "T" + nextHour + ":" + nextMinute);
  }

  const labelText = value
    ? new Date(value).toLocaleString("kk-KZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : label;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[14px] border border-[#E8E1DA] bg-white px-3.5 py-2.5 text-left text-[11px] font-semibold text-[#172235] transition hover:border-[#FFB067]"
        aria-expanded={open}
      >
        <span className={value ? "truncate" : "truncate text-[#9A9189]"}>{labelText}</span>
        <ChevronDown size={15} className={open ? "shrink-0 rotate-180 transition-transform" : "shrink-0 transition-transform"} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] rounded-[16px] border border-[#E8E1DA] bg-white p-3 shadow-[0_20px_50px_rgba(23,34,53,.14)]">
          <div className="grid gap-3">
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Күн
              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  commit(event.target.value, hour, minute);
                }}
                className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E1DA] bg-[#FFFCF9] px-3 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000]"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] font-extrabold text-[#5B534C]">
                Сағат
                <span className="mt-1.5 block"><StaffSelectMenu value={hour} options={Array.from({ length: 24 }, (_, index) => { const item = String(index).padStart(2, "0"); return { value: item, label: item }; })} onChange={(value) => { setHour(value); commit(date, value, minute); }} /></span>
              </label>
              <label className="text-[10px] font-extrabold text-[#5B534C]">
                Минут
                <span className="mt-1.5 block"><StaffSelectMenu value={minute} options={["00","05","10","15","20","25","30","35","40","45","50","55"].map((item) => ({ value: item, label: item }))} onChange={(value) => { setMinute(value); commit(date, hour, value); }} /></span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setDate("");
                onChange("");
                setOpen(false);
              }}
              className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-extrabold text-[#6B625B] transition hover:bg-[#FAF7F3]"
            >
              Тазарту
            </button>
          </div>
        </div>
      ) : null}
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
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#172235]/25 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-white/70 bg-[#FAF9F7] shadow-[0_30px_90px_rgba(23,34,53,.22)]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E8E1DA] bg-[#FAF9F7]/95 px-5 py-4 backdrop-blur sm:px-6">
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
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export const staffInputClass =
  "h-11 w-full rounded-[14px] border border-[#E8E1DA] bg-white px-3.5 text-[11px] font-semibold text-[#172235] outline-none transition focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10";
