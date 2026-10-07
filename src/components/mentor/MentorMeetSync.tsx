"use client";

import { useState } from "react";
import { Loader2, Plus, RefreshCw, Unplug } from "lucide-react";

export function MentorMeetSync({ teamId, teamName, googleConnected, hasMeetSpace }: { teamId: string; teamName: string; googleConnected: boolean; hasMeetSpace: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function disconnect() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/integrations/google/disconnect", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Google аккаунтын ажырату сәтсіз аяқталды.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
      setLoading(false);
    }
  }

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
      if (!response.ok) throw new Error(data?.error ?? "Кездесуді жаңарту сәтсіз аяқталды.");
      setMessage("Жаңартылды: " + String(data.attendanceRows ?? 0) + " қатысу жазбасы.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  async function createMeet() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/mentor/meet/space", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: teamName + " — Google Meet" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Google Meet жасау сәтсіз аяқталды.");
      setMessage("Google Meet жасалды.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
      setLoading(false);
    }
  }

  if (!googleConnected) {
    return <a href="/api/integrations/google/start?returnTo=%2Fmentor%2Fmeet" className="inline-flex min-h-10 items-center rounded-[11px] bg-[#172235] px-4 py-2.5 text-[10px] font-extrabold text-white">Google қосу</a>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void createMeet()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-[11px] bg-[#172235] px-4 py-2.5 text-[10px] font-extrabold text-white disabled:opacity-50">
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        {hasMeetSpace ? "Жаңа Meet жасау" : "Google Meet жасау"}
      </button>
      <button type="button" onClick={() => void sync()} disabled={loading || !hasMeetSpace} className="inline-flex min-h-10 items-center gap-2 rounded-[11px] bg-[#FF8000] px-4 py-2.5 text-[10px] font-extrabold text-white disabled:opacity-50">
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        {loading ? "Жаңартылуда..." : "Қатысуды жаңарту"}
      </button>
      <button type="button" onClick={() => void disconnect()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-[11px] border border-[#E8E3DD] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#5B534C] disabled:opacity-50">
        <Unplug size={13} /> Google-ды ажырату
      </button>
      {message ? <p className="basis-full text-[9px] font-semibold text-[#6F665E]">{message}</p> : null}
    </div>
  );
}
