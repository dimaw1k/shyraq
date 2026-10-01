"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

export type StaffTaskEditProps = {
  task: {
    id: string;
    title: string;
    description: string;
    instructions: string | null;
    team_id: string | null;
    starts_at: string | null;
    deadline: string | null;
    points: number;
    attachment_required: boolean;
    active: boolean;
  };
  teams: Array<{ id: string; name: string }>;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function StaffTaskEditForm({ task, teams }: StaffTaskEditProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [teamId, setTeamId] = useState(task.team_id ?? "");
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(task.starts_at));
  const [deadline, setDeadline] = useState(toDatetimeLocal(task.deadline));
  const [points, setPoints] = useState(String(task.points ?? 0));
  const [attachmentRequired, setAttachmentRequired] = useState(task.attachment_required);
  const [active, setActive] = useState(task.active);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/chief-mentor/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          teamId: teamId || null,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          points: Number(points),
          attachmentRequired,
          active,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ?? "Тапсырманы сақтау сәтсіз аяқталды.");
        return;
      }

      setEditing(false);
      setMessage("Сақталды.");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setEditing(true);
          }}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#4B433C] transition hover:bg-[#FFFCF9]"
        >
          <Pencil size={12} />
          Өңдеу
        </button>
        {message ? <span className="text-[8px] font-semibold text-[#7F756D]">{message}</span> : null}
      </div>
    );
  }

  return (
    <div className="w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 sm:w-[420px]">
      <div className="grid gap-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]" placeholder="Тапсырма атауы" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="resize-none rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]" placeholder="Сипаттама" />

        <div className="grid grid-cols-2 gap-2">
          <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]">
            <option value="">Барлық командалар</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <input type="number" min="0" value={points} onChange={(event) => setPoints(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]" placeholder="Ұпай" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold" />
          <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold" />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-[#5B534C]">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={attachmentRequired} onChange={(event) => setAttachmentRequired(event.target.checked)} />
            Файл міндетті
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
            ACTIVE
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} disabled={loading} className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#6B625B] disabled:opacity-50">
            <X size={12} />
            Бас тарту
          </button>
          <PrimaryButton type="button" onClick={save} disabled={loading} className="!min-h-8 !rounded-[10px] !px-3 !py-1.5 !text-[9px]">
            <Check size={12} />
            {loading ? "..." : "Сақтау"}
          </PrimaryButton>
        </div>

        {message ? <p className="text-right text-[8px] font-semibold text-[#7F756D]">{message}</p> : null}
      </div>
    </div>
  );
}
