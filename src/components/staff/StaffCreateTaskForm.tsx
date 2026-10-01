"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

type TeamOption = { id: string; name: string };

export function StaffCreateTaskForm({ teams = [] }: { teams?: TeamOption[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [points, setPoints] = useState("0");
  const [attachmentRequired, setAttachmentRequired] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          teamId: teamId || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          points: Number(points),
          attachmentRequired,
          active: true,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Тапсырма сақталмады.");
        return;
      }

      setTitle("");
      setDescription("");
      setTeamId("");
      setDeadline("");
      setPoints("0");
      setAttachmentRequired(false);
      setMessage("Тапсырма сәтті қосылды.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-2.5 rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 lg:grid-cols-[1fr_1.4fr_170px_170px_90px_auto]"
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Тапсырма атауы"
        required
        className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]"
      />

      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Сипаттама"
        required
        className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]"
      />

      <select
        value={teamId}
        onChange={(event) => setTeamId(event.target.value)}
        className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]"
      >
        <option value="">Барлық командалар</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>{team.name}</option>
        ))}
      </select>

      <input
        type="datetime-local"
        value={deadline}
        onChange={(event) => setDeadline(event.target.value)}
        className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold"
      />

      <input
        type="number"
        min="0"
        value={points}
        onChange={(event) => setPoints(event.target.value)}
        placeholder="Ұпай"
        className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold"
      />

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-[9px] font-bold text-[#5B534C]">
          <input
            type="checkbox"
            checked={attachmentRequired}
            onChange={(event) => setAttachmentRequired(event.target.checked)}
          />
          Файл
        </label>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Қосу
        </PrimaryButton>
      </div>

      {message ? <p className="text-[9px] font-semibold text-[#7F756D] lg:col-span-6">{message}</p> : null}
    </form>
  );
}
