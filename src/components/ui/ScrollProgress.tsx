"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const total = root.scrollHeight - root.clientHeight;
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div
        className="h-full origin-left bg-[#ff7a00] transition-[width] duration-100 ease-out"
        style={{ width: progress + "%" }}
      />
    </div>
  );
}
