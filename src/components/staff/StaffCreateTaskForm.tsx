"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

export function StaffCreateTaskForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("0");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/chief-mentor/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, points: Number(points), active: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Тапсырма сақталмады.");
        return;
      }
      setTitle("");
      setDescription("");
      setPoints("0");
      setMessage("Тапсырма сәтті қосылды.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-2.5 rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 md:grid-cols-[1fr_1.5fr_120px_auto]">
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Тапсырма атауы" className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]" />
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Сипаттама" className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]" />
      <input type="number" min="0" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="Ұпай" className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]" />
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        Қосу
      </PrimaryButton>
      {message ? <p className="text-[9px] font-semibold text-[#7F756D] md:col-span-4">{message}</p> : null}
    </form>
  );
}
