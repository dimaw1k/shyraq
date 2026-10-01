"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

export type MentorOption = { id: string; full_name: string };

export function StaffCreateTeamForm({ mentors }: { mentors: MentorOption[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [capacity, setCapacity] = useState("70");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/chief-mentor/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mentorId, capacity: Number(capacity) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Команда сақталмады.");
        return;
      }
      setName("");
      setMentorId("");
      setCapacity("70");
      setMessage("Команда сәтті қосылды.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-2.5 rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 sm:grid-cols-[1fr_1fr_120px_auto]">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Команда атауы" className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]" />
      <select value={mentorId} onChange={(event) => setMentorId(event.target.value)} className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]">
        <option value="">Менторды кейін таңдау</option>
        {mentors.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.full_name}</option>)}
      </select>
      <input type="number" min="1" value={capacity} onChange={(event) => setCapacity(event.target.value)} className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]" />
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        Қосу
      </PrimaryButton>
      {message ? <p className="text-[9px] font-semibold text-[#7F756D] sm:col-span-4">{message}</p> : null}
    </form>
  );
}
