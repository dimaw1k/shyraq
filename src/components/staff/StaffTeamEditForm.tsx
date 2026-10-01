"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import type { MentorOption } from "@/components/staff/StaffCreateTeamForm";

type StaffTeamEditFormProps = {
  team: {
    id: string;
    name: string;
    mentor_id: string | null;
    capacity: number | null;
    status: string;
  };
  mentors: MentorOption[];
};

export function StaffTeamEditForm({ team, mentors }: StaffTeamEditFormProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [mentorId, setMentorId] = useState(team.mentor_id ?? "");
  const [capacity, setCapacity] = useState(String(team.capacity ?? 70));
  const [status, setStatus] = useState(team.status);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/chief-mentor/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mentorId: mentorId || null,
          capacity: Number(capacity),
          status,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ?? "Команданы сақтау сәтсіз аяқталды.");
        return;
      }

      setEditing(false);
      setMessage("Сақталды. Жаңартылған мәндер келесі жүктеуде көрінеді.");
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
    <div className="w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 sm:w-[330px]">
      <div className="grid gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]"
          placeholder="Команда атауы"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={mentorId}
            onChange={(event) => setMentorId(event.target.value)}
            className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]"
          >
            <option value="">Ментор жоқ</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.full_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]"
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={loading}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#6B625B] disabled:opacity-50"
          >
            <X size={12} />
            Бас тарту
          </button>
          <PrimaryButton
            type="button"
            onClick={save}
            disabled={loading}
            className="!min-h-8 !rounded-[10px] !px-3 !py-1.5 !text-[9px]"
          >
            <Check size={12} />
            {loading ? "..." : "Сақтау"}
          </PrimaryButton>
        </div>

        {message ? <p className="text-right text-[8px] font-semibold text-[#7F756D]">{message}</p> : null}
      </div>
    </div>
  );
}
