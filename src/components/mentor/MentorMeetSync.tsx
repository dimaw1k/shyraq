"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function MentorMeetSync({ teamId, googleConnected }: { teamId: string; googleConnected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function sync() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/mentor/meet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Meet синхрондау сәтсіз аяқталды.");
      setMessage("Жаңартылды: " + String(data.attendanceRows ?? 0) + " қатысу жазбасы.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  if (!googleConnected) {
    return <a href="/api/integrations/google/start" className="inline-flex min-h-10 items-center rounded-[11px] bg-[#172235] px-4 py-2.5 text-[10px] font-extrabold text-white">Google қосу</a>;
  }

  return (
    <div>
      <button type="button" onClick={() => void sync()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-[11px] bg-[#FF8000] px-4 py-2.5 text-[10px] font-extrabold text-white disabled:opacity-50">
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        {loading ? "Жаңартылуда..." : "Қатысуды жаңарту"}
      </button>
      {message ? <p className="mt-2 text-[9px] font-semibold text-[#6F665E]">{message}</p> : null}
    </div>
  );
}
