"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import { parseKzDateTime, StaffDateTimeField, StaffModal, StaffSelectMenu, staffInputClass } from "@/components/staff/StaffUI";

type TeamOption = { id: string; name: string };

export function StaffCreateTaskForm({ teams = [] }: { teams?: TeamOption[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [marathonDay, setMarathonDay] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [deadline, setDeadline] = useState("");
  const [points, setPoints] = useState("0");
  const [maxFiles, setMaxFiles] = useState("5");
  const [attachmentRequired, setAttachmentRequired] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const startsAtIso = parseKzDateTime(startsAt);
      const deadlineIso = parseKzDateTime(deadline);
      if (startsAtIso === undefined || deadlineIso === undefined) {
        setMessage("Күн мен уақытты 12.09.2026 15:00:00 форматында енгізіңіз.");
        return;
      }
      const response = await fetch("/api/chief-mentor/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          teamId: teamId || null,
          marathonDay: marathonDay ? Number(marathonDay) : null,
          taskOrder: 0,
          startsAt: startsAtIso,
          deadline: deadlineIso,
          points: Number(points),
          latePointsPercent: 100,
          maxFiles: Number(maxFiles),
          attachmentRequired,
          active: true,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Тапсырма сақталмады.");
        return;
      }

      setOpen(false);
      setMessage("Тапсырма қосылды.");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PrimaryButton type="button" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Тапсырма қосу
      </PrimaryButton>

      <StaffModal open={open} onClose={() => { if (!loading) setOpen(false); }} title="Жаңа тапсырма" description="Қысқа деректерді толтырып, тапсырманы сақтаңыз.">
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Тапсырма атауы
              <input value={title} onChange={(event) => setTitle(event.target.value)} required className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Сипаттама
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={3} className="mt-1.5 w-full resize-none rounded-[14px] border border-[#E8E1DA] bg-white px-3.5 py-3 text-[11px] font-semibold outline-none focus:border-[#FF8000]" />
            </label>
            <div>
              <p className="text-[10px] font-extrabold text-[#5B534C]">Команда</p>
              <div className="mt-1.5">
                <StaffSelectMenu value={teamId} onChange={setTeamId} placeholder="Барлық командалар" options={[{ value: "", label: "Барлық командалар" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]} />
              </div>
            </div>
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Марафон күні
              <input type="number" min="1" max="21" value={marathonDay} onChange={(event) => setMarathonDay(event.target.value)} className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Ұпай
              <input type="number" min="0" value={points} onChange={(event) => setPoints(event.target.value)} className={staffInputClass + " mt-1.5"} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-[10px] font-extrabold text-[#5B534C]">Ашылу уақыты</p><div className="mt-1.5"><StaffDateTimeField value={startsAt} onChange={setStartsAt} label="Уақытты таңдау" /></div></div>
            <div><p className="text-[10px] font-extrabold text-[#5B534C]">Соңғы мерзім</p><div className="mt-1.5"><StaffDateTimeField value={deadline} onChange={setDeadline} label="Соңғы мерзімді таңдау" /></div></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C]">Файл саны<input type="number" min="1" max="10" value={maxFiles} onChange={(event) => setMaxFiles(event.target.value)} className={staffInputClass + " mt-1.5"} /></label>
            <label className="flex items-end pb-2 text-[10px] font-extrabold text-[#5B534C]"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={attachmentRequired} onChange={(event) => setAttachmentRequired(event.target.checked)} />Файл міндетті</span></label>
          </div>

          {message ? <p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-bold text-[#B95D00]">{message}</p> : null}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} disabled={loading} className="h-11 rounded-[13px] border border-[#E8E1DA] bg-white px-4 text-[10px] font-extrabold text-[#6B625B]">Бас тарту</button>
            <PrimaryButton type="submit" disabled={loading}>{loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Сақтау</PrimaryButton>
          </div>
        </form>
      </StaffModal>
    </>
  );
}
