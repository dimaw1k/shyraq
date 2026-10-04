"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const items = [
  { label: "Басты бет", href: "#top", target: "top" },
  { label: "Мүмкіндіктер", href: "#features", target: "features" },
  { label: "21 күн", href: "#marathon", target: "marathon" },
  { label: "Қалай жұмыс істейді", href: "#how-it-works", target: "how-it-works" },
];

export function StickyNav() {
  const [active, setActive] = useState("top");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 20);

    const updateActive = () => {
      const offset = 140;
      let current = "top";

      for (const item of items) {
        const section = document.getElementById(item.target);
        if (section && section.getBoundingClientRect().top <= offset) {
          current = item.target;
        }
      }

      if (window.scrollY < 180) current = "top";
      setActive(current);
    };

    updateScrollState();
    updateActive();

    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, []);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.target === active),
  );

  const scrollTo = (target: string) => {
    const section =
      target === "top" ? document.documentElement : document.getElementById(target);

    if (!section) return;

    const top = target === "top"
      ? 0
      : Math.max(0, window.scrollY + section.getBoundingClientRect().top - 96);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] isolate px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-7xl items-center justify-center">
        <div
          className={[
            "relative z-[10000] flex w-full items-center justify-between gap-3 rounded-[18px] border px-3 py-2 transition-all duration-300 sm:rounded-[20px] sm:px-4",
            scrolled
              ? "border-black/8 bg-white/95 shadow-[0_12px_40px_rgba(20,20,20,.10)] backdrop-blur-xl"
              : "border-white/55 bg-white/78 shadow-[0_10px_30px_rgba(20,20,20,.06)] backdrop-blur-xl",
          ].join(" ")}
        >
          <Link
            href="/#top"
            aria-label="Shyraq"
            className="inline-flex shrink-0 items-center gap-0"
          >
            <span
              className="font-extrabold tracking-[-0.065em]"
              style={{
                color: "#172235",
                fontSize: "27px",
                lineHeight: 1,
                fontFamily:
                  'var(--font-montserrat), Montserrat, ui-sans-serif, system-ui, sans-serif',
              }}
            >
              SHYR
            </span>
            <span
              aria-hidden="true"
              className="grid h-6 w-[18px] shrink-0 place-items-center"
            >
              <svg viewBox="0 0 18 24" width="18" height="24" fill="none">
                <path
                  d="M9 22c-3.1-4-5.4-7.2-5.4-11.1A5.4 5.4 0 0 1 9 5.5a5.4 5.4 0 0 1 5.4 5.4C14.4 14.8 12.1 18 9 22Z"
                  fill="#FF8000"
                />
                <circle cx="9" cy="10.8" r="1.9" fill="#FFF7F1" />
                <path
                  d="M6.6 16.2c1.5 1.2 3.3 1.2 4.8 0"
                  stroke="#FFF7F1"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span
              className="font-extrabold tracking-[-0.065em]"
              style={{
                color: "#172235",
                fontSize: "27px",
                lineHeight: 1,
                fontFamily:
                  'var(--font-montserrat), Montserrat, ui-sans-serif, system-ui, sans-serif',
              }}
            >
              Q
            </span>
          </Link>

          <nav className="relative hidden overflow-hidden rounded-full bg-[#eef1f6] p-1 sm:flex">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,.14)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{
                width: "calc((100% - 8px) / 4)",
                transform: `translateX(calc(${activeIndex} * 100%))`,
              }}
            />

            {items.map((item) => (
              <a
                key={item.target}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  scrollTo(item.target);
                }}
                className={[
                  "relative z-10 flex min-w-[100px] flex-1 items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold transition-colors duration-300 sm:text-xs",
                  active === item.target
                    ? "text-[#172235]"
                    : "text-[#172235]/65 hover:text-[#172235]",
                ].join(" ")}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[#E8E1DA] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-[#172235] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D7CFC6] sm:px-4 sm:text-xs"
            >
              Кіру
            </Link>

            <Link
              href="/register"
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#FF8000] px-3.5 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_24px_rgba(255,128,0,.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E56F00] sm:px-4 sm:text-xs"
            >
              Тіркелу
              <ArrowRight size={13} className="ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
