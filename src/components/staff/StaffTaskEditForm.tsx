"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import { StaffDateTimeField, StaffModal, StaffSelectMenu, staffInputClass } from "@/components/staff/StaffUI";

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
    late_points_percent: number;
    attachment_required: boolean;
    max_files: number;
    marathon_day: number | null;
    task_order: number;
    active: boolean;
  };
  teams: Array<{ id: string; name: string }>;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate()) + "T" + p(date.getHours()) + ":" + p(date.getMinutes());
}

export function StaffTaskEditForm({ task, teams }: StaffTaskEditProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [teamId, setTeamId] = useState(task.team_id ?? "");
  const [marathonDay, setMarathonDay] = useState(String(task.marathon_day ?? ""));
  const [taskOrder, setTaskOrder] = useState(String(task.task_order ?? 0));
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(task.starts_at));
  const [deadline, setDeadline] = useState(toDatetimeLocal(task.deadline));
  const [points, setPoints] = useState(String(task.points ?? 0));
  const [latePointsPercent, setLatePointsPercent] = useState(String(task.late_points_percent ?? 100));
  const [maxFiles, setMaxFiles] = useState(String(task.max_files ?? 5));
  const [attachmentRequired, setAttachmentRequired] = useState(task.attachment_required);
  const [active, setActive] = useState(task.active);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/tasks/" + task.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          teamId: teamId || null,
          marathonDay: marathonDay ? Number(marathonDay) : null,
          taskOrder: Number(taskOrder || 0),
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          points: Number(points),
          latePointsPercent: Number(latePointsPercent),
          maxFiles: Number(maxFiles),
          attachmentRequired,
          active,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ?? "Сақтау сәтсіз аяқталды.");
        return;
      }

      setOpen(false);
      setMessage("Сақталды.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-[11px] border border-[#E8E1DA] bg-white px-3.5 py-2 text-[9px] font-extrabold text-[#4B433C] transition hover:border-[#FFB067]">
        <Pencil size={12} />
        Өңдеу
      </button>

      <StaffModal open={open} onClose={() => { if (!loading) setOpen(false); }} title="Тапсырманы өңдеу">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">Атауы<input value={title} onChange={(event) => setTitle(event.target.value)} className={staffInputClass + " mt-1.5"} /></label>
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">Сипаттама<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-[14px] border border-[#E8E1DA] px-3.5 py-3 text-[11px] font-semibold outline-none focus:border-[#FF8000]" /></label>
            <div><p className="text-[10px] font-extrabold text-[#5B534C]">Команда</p><div className="mt-1.5"><StaffSelectMenu value={teamId} onChange={setTeamId} placeholder="Барлығы" options={[{ value: "", label: "Барлығы" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]} /></div></div>
            <label className="text-[10px] font-extrabold text-[#5B534C]">Марафон күні<input type="number" min="1" max="21" value={marathonDay} onChange={(event) => setMarathonDay(event.target.value)} className={staffInputClass + " mt-1.5"} /></label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">Реті<input type="number" min="0" value={taskOrder} onChange={(event) => setTaskOrder(event.target.value)} className={staffInputClass + " mt-1.5"} /></label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">Ұпай<input type="number" min="0" value={points} onChange={(event) => setPoints(event.target.value)} className={staffInputClass + " mt-1.5"} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-extrabold text-[#5B534C]">Ашылу уақыты</p><div className="mt-1.5"><StaffDateTimeField value={startsAt} onChange={setStartsAt} label="Уақытты таңдау" /></div></div><div><p className="text-[10px] font-extrabold text-[#5B534C]">Дедлайн</p><div className="mt-1.5"><StaffDateTimeField value={deadline} onChange={setDeadline} label="Дедлайнды таңдау" /></div></div></div>
          <div className="grid gap-3 sm:grid-cols-3"><label className="text-[10px] font-extrabold text-[#5B534C]">Кеш ұпайы, %<input type="number" min="0" max="100" value={latePointsPercent} onChange={(event) => setLatePointsPercent(event.target.value)} className={staffInputClass + " mt-1.5"} /></label><label className="text-[10px] font-extrabold text-[#5B534C]">Файл саны<input type="number" min="1" max="10" value={maxFiles} onChange={(event) => setMaxFiles(event.target.value)} className={staffInputClass + " mt-1.5"} /></label><label className="flex items-end pb-2 text-[10px] font-extrabold text-[#5B534C]"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={attachmentRequired} onChange={(event) => setAttachmentRequired(event.target.checked)} />Файл міндетті</span></label></div>
          <label className="flex items-center gap-2 text-[10px] font-extrabold text-[#5B534C]"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Белсенді</label>
          {message ? <p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-bold text-[#B95D00]">{message}</p> : null}
          <div className="flex justify-end"><PrimaryButton type="button" onClick={() => void save()} disabled={loading}>{loading ? "Сақталуда..." : <><Check size={13} />Сақтау</>}</PrimaryButton></div>
        </div>
      </StaffModal>
    </>
  );
}
