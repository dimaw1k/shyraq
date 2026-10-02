"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Pencil, X } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

type MentorOption = { id: string; full_name: string };
type Option = { value: string; label: string };

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

function ChoiceMenu({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = options.find((item) => item.value === value)?.label ?? "Таңдаңыз";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold text-[#3F3832] outline-none transition hover:border-[#FFB067]"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+5px)] z-40 max-h-56 w-full overflow-auto rounded-[11px] border border-[#E8E1DA] bg-white p-1.5 shadow-[0_16px_34px_rgba(23,34,53,.12)]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-[9px] font-bold transition",
                value === option.value ? "bg-[#FFF1E2] text-[#C95500]" : "text-[#4B433C] hover:bg-[#FAF7F3]",
              ].join(" ")}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value ? <Check size={11} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
      const response = await fetch("/api/chief-mentor/teams/" + team.id, {
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
          className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#4B433C] transition hover:border-[#FFB067] hover:bg-[#FFFCF9]"
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
          className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF8000]"
          placeholder="Команда атауы"
        />

        <div className="grid grid-cols-2 gap-2">
          <ChoiceMenu
            value={mentorId}
            options={[
              { value: "", label: "Ментор жоқ" },
              ...mentors.map((mentor) => ({ value: mentor.id, label: mentor.full_name })),
            ]}
            onChange={setMentorId}
          />

          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF8000]"
          />
        </div>

        <ChoiceMenu
          value={status}
          options={[
            { value: "ACTIVE", label: "Белсенді" },
            { value: "INACTIVE", label: "Өшірулі" },
          ]}
          onChange={setStatus}
        />

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
            onClick={() => void save()}
            disabled={loading}
            className="!min-h-8 !rounded-[10px] !px-3 !py-1.5 !text-[9px]"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Сақтау
          </PrimaryButton>
        </div>

        {message ? <p className="text-right text-[8px] font-semibold text-[#7F756D]">{message}</p> : null}
      </div>
    </div>
  );
}
