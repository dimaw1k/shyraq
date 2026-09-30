"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const items = [
  { label: "Басты бет", href: "#top", target: "top" },
  { label: "Мүмкіндіктер", href: "#features", target: "features" },
  { label: "21 күн", href: "#marathon", target: "marathon" },
  { label: "Пікірлер", href: "#reviews", target: "reviews" },
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
    if (target === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] isolate px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-7xl items-center justify-center">
        <div
          className={[
            "relative z-[10000] flex w-full items-center justify-between gap-3 rounded-[18px] border px-3 py-2 transition-all duration-500 sm:rounded-[20px] sm:px-4",
            scrolled
              ? "border-black/8 bg-white/95 shadow-[0_12px_40px_rgba(20,20,20,.10)] backdrop-blur-xl"
              : "border-white/55 bg-white/78 shadow-[0_10px_30px_rgba(20,20,20,.06)] backdrop-blur-xl",
          ].join(" ")}
        >
          <Link href="/#top" aria-label="Shyraq" className="shrink-0">
            <svg
              width="116"
              height="34"
              viewBox="0 0 116 34"
              role="img"
              aria-label="SHYRAQ"
              className="block h-[30px] w-auto sm:h-[34px]"
            >
              <text
                x="0"
                y="26"
                fill="#172235"
                fontSize="27"
                fontWeight="800"
                letterSpacing="-1.15"
                fontFamily="Arial, Helvetica, sans-serif"
              >
                SHYR
              </text>

              <g transform="translate(-12 0)">
                <path
                  d="M100 25.8c-3.8-4.8-6.8-8.2-6.8-12.9 0-4.2 3-7.5 6.8-7.5s6.8 3.3 6.8 7.5c0 4.7-3 8.1-6.8 12.9Z"
                  fill="#FF6F2C"
                />
                <path
                  d="M100 20.4c-1.7-2.3-2.9-4.3-2.9-6.5 0-1.7 1.2-3 2.9-3s2.9 1.3 2.9 3c0 2.2-1.2 4.2-2.9 6.5Z"
                  fill="#FFF7F1"
                />
                <circle cx="100" cy="25.1" r="1.3" fill="#FF6F2C" />
              </g>

              <text
                x="94"
                y="26"
                fill="#172235"
                fontSize="27"
                fontWeight="800"
                letterSpacing="-1.15"
                fontFamily="Arial, Helvetica, sans-serif"
              >
                Q
              </text>
            </svg>
          </Link>

          <nav className="relative hidden overflow-hidden rounded-full bg-[#172235] p-1 sm:flex">
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
                  "relative z-10 flex min-w-[92px] flex-1 items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold transition-colors duration-300 sm:text-xs",
                  active === item.target
                    ? "text-[#172235]"
                    : "text-white/72 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Link
            href="/register"
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#ff6f2c] px-3.5 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_24px_rgba(255,111,44,.20)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(255,111,44,.26)] sm:px-4 sm:text-xs"
          >
            Марафонға қосылу
            <Sparkles size={13} className="ml-1.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
