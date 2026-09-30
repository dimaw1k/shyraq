"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { TimeRange } from "@/lib/video/coverage";
import { mergeTimeRanges, watchedPercent } from "@/lib/video/coverage";

const KinescopePlayer = dynamic(() => import("@kinescope/react-kinescope-player"), { ssr: false });

type Props = {
  lessonId: string;
  videoId: string;
  durationSeconds: number;
  requiredWatchPercent: number;
  initialRanges?: TimeRange[];
};

export function KinescopeLessonPlayer({
  lessonId,
  videoId,
  durationSeconds,
  requiredWatchPercent,
  initialRanges = [],
}: Props) {
  const [ranges, setRanges] = useState<TimeRange[]>(initialRanges);
  const [percent, setPercent] = useState(() => watchedPercent(initialRanges, durationSeconds));
  const [saving, setSaving] = useState(false);
  const lastTime = useRef<number | null>(null);
  const rangesRef = useRef<TimeRange[]>(initialRanges);

  useEffect(() => {
    rangesRef.current = ranges;
  }, [ranges]);

  async function persist(nextRanges: TimeRange[]) {
    setSaving(true);
    try {
      const response = await fetch("/api/lessons/" + lessonId + "/progress", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranges: nextRanges }),
      });
      if (!response.ok) throw new Error("Progress save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleTimeUpdate(event: { currentTime: number }) {
    const current = Math.max(0, Math.min(durationSeconds, event.currentTime));
    const previous = lastTime.current;
    lastTime.current = current;
    if (previous === null) return;

    const next =
      previous <= current && current - previous <= 4
        ? mergeTimeRanges([...rangesRef.current, { start: previous, end: current }])
        : rangesRef.current;

    rangesRef.current = next;
    setRanges(next);
    setPercent(watchedPercent(next, durationSeconds));
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      void persist(rangesRef.current);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [lessonId]);

  useEffect(() => {
    const flush = () => void persist(rangesRef.current);
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [lessonId]);

  const unlocked = percent >= requiredWatchPercent;

  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden rounded-2xl bg-black">
        <KinescopePlayer
          videoId={videoId}
          width="100%"
          height="100%"
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span>Көрілгені</span>
          <strong>{percent.toFixed(0)}%</strong>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: Math.min(100, percent) + "%" }}
          />
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          {unlocked
            ? "Тест ашылды."
            : "Тестті ашу үшін кемінде " + requiredWatchPercent + "% көру керек."}
          {saving ? " Сақталуда..." : ""}
        </p>
      </div>
    </div>
  );
}
