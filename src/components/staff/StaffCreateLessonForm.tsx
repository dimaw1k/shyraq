"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

export function StaffCreateLessonForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [videoId, setVideoId] = useState("");
  const [duration, setDuration] = useState("360");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/chief-mentor/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          kinescopeVideoId: videoId,
          durationSeconds: Number(duration),
          published: false,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Сабақ сақталмады.");
        return;
      }
      setTitle("");
      setVideoId("");
      setDuration("360");
      setMessage("Сабақ сәтті қосылды.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-2.5 rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 sm:grid-cols-[1fr_1fr_130px_auto]">
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Сабақ атауы" className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]" />
      <input value={videoId} onChange={(event) => setVideoId(event.target.value)} placeholder="Kinescope video ID" className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]" />
      <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Секунд" className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]" />
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        Қосу
      </PrimaryButton>
      {message ? <p className="text-[9px] font-semibold text-[#7F756D] sm:col-span-4">{message}</p> : null}
    </form>
  );
}
