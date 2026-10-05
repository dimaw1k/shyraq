"use client";

import { useEffect, useRef, useState } from "react";
import {
  setStudentLanguage,
  useStudentLanguage,
  type StudentLanguage,
} from "@/lib/student-language";

export function AuthLanguagePicker() {
  const { language, t } = useStudentLanguage("kk");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const options: Array<[StudentLanguage, string]> = [
    ["ru", "RU"],
    ["kk", "KZ"],
    ["en", "ENG"],
  ];

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const activeLabel = options.find(([value]) => value === language)?.[1] ?? "KZ";

  return (
    <div ref={rootRef} className="absolute right-5 top-5 z-30 sm:right-6 sm:top-6">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language")}
        onClick={() => setOpen((value) => !value)}
        className={[
          "flex h-9 w-[82px] items-center justify-between gap-2 rounded-[11px] border bg-white px-3 text-[10px] font-extrabold text-[#5F574F] shadow-[0_4px_14px_rgba(23,34,53,.04)] outline-none transition",
          open
            ? "border-[#FF8000] ring-3 ring-[#FF8000]/10"
            : "border-[#E7E0D8] hover:border-[#FFB366]",
        ].join(" ")}
      >
        <span>{activeLabel}</span>
        <span className={["text-[9px] text-[#9A9189] transition-transform", open ? "rotate-180" : ""].join(" ")}>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t("language")}
          className="absolute right-0 top-[42px] w-[82px] overflow-hidden rounded-[11px] border border-[#E7E0D8] bg-white p-1 shadow-[0_14px_30px_rgba(23,34,53,.14)]"
        >
          {options.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={language === value}
              onClick={() => {
                setStudentLanguage(value);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center rounded-[8px] px-2.5 py-2 text-left text-[10px] font-extrabold transition",
                language === value
                  ? "bg-[#FFF1E2] text-[#D56600]"
                  : "text-[#6F665E] hover:bg-[#FAF7F3] hover:text-[#172235]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
