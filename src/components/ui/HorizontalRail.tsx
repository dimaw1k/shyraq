"use client";

import { Children, type ReactNode } from "react";

type HorizontalRailProps = {
  children: ReactNode;
  variant?: "benefit" | "journey" | "routine";
  className?: string;
  ariaLabel?: string;
};

export function HorizontalRail({
  children,
  variant = "benefit",
  className = "",
  ariaLabel = "Қосымша ақпарат",
}: HorizontalRailProps) {
  return (
    <div
      className={[
        "shyraq-horizontal-rail",
        "shyraq-horizontal-rail--" + variant,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label={ariaLabel}
    >
      {Children.toArray(children)}
    </div>
  );
}
