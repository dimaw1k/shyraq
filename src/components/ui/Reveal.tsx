"use client";

import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
};

/**
 * Render reveal content visibly in the initial HTML.
 *
 * The previous version depended on IntersectionObserver hydration to add
 * `is-visible`. If client scripts were delayed or blocked by CSP, every
 * landing-page section stayed at opacity: 0 and the home page looked blank.
 * Keep content available without JavaScript; the CSS class remains compatible
 * with the existing animation styles.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: RevealProps) {
  return (
    <div
      className={["shrq-reveal", "is-visible", className].filter(Boolean).join(" ")}
      style={{ transitionDelay: String(delay) + "ms" }}
    >
      {children}
    </div>
  );
}
