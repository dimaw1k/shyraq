"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.07,
        smoothWheel: true,
        syncTouch: true,
        touchMultiplier: 1.05,
        wheelMultiplier: 0.9,
        anchors: {
          offset: -96,
          duration: 1.15,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}
