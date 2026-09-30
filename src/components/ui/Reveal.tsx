"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
};

export function Reveal({ children, className = "", delay = 0, once = true }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        if (once) observer.unobserve(node);
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -70px 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={["shrq-reveal", visible ? "is-visible" : "", className].filter(Boolean).join(" ")}
      style={{ transitionDelay: String(delay) + "ms" }}
    >
      {children}
    </div>
  );
}
