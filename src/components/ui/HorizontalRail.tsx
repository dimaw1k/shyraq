"use client";

import {
  Children,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

type HorizontalRailProps = {
  children: ReactNode;
  variant?: "benefit" | "journey";
  className?: string;
  ariaLabel?: string;
};

export function HorizontalRail({
  children,
  variant = "benefit",
  className = "",
  ariaLabel = "Қосымша ақпарат",
}: HorizontalRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startScrollLeft = useRef(0);
  const activePointer = useRef<number | null>(null);
  const horizontalDrag = useRef(false);
  const [dragging, setDragging] = useState(false);

  const begin = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rail = railRef.current;
    if (!rail) return;

    startX.current = event.clientX;
    startY.current = event.clientY;
    startScrollLeft.current = rail.scrollLeft;
    activePointer.current = event.pointerId;
    horizontalDrag.current = false;
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || activePointer.current !== event.pointerId) return;

    const dx = startX.current - event.clientX;
    const dy = startY.current - event.clientY;

    if (!horizontalDrag.current) {
      const horizontalIntent =
        Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.12;

      if (!horizontalIntent) return;

      horizontalDrag.current = true;
      setDragging(true);

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers do not expose pointer capture consistently for touch.
      }
    }

    if (horizontalDrag.current) {
      event.preventDefault();
      rail.scrollLeft = startScrollLeft.current + dx;
    }
  };

  const finish = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore pointer-capture cleanup inconsistencies.
    }

    activePointer.current = null;
    horizontalDrag.current = false;
    setDragging(false);
  };

  return (
    <div
      ref={railRef}
      className={[
        "shyraq-horizontal-rail",
        variant === "journey"
          ? "shyraq-horizontal-rail--journey"
          : "shyraq-horizontal-rail--benefit",
        dragging ? "is-dragging" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={() => {
        activePointer.current = null;
        horizontalDrag.current = false;
        setDragging(false);
      }}
    >
      {Children.toArray(children)}
    </div>
  );
}
