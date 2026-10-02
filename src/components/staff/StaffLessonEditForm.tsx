"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import { parseKzDateTime, StaffDateTimeField, StaffModal, StaffSelectMenu, staffInputClass } from "@/components/staff/StaffUI";

type Props = {
  lesson: {
    materials: Array<{ label: string; url: string; type?: string }>;
    id: string;
    title: string;
    description: string | null;
    kinescope_video_id: string;
    duration_seconds: number;
    required_watch_percent: number;
    sort_order: number;
    lesson_order: number;
    marathon_day: number | null;
    team_id: string | null;
    published: boolean;
    starts_at: string | null;
    deadline_at: string | null;
  };
  teams: Array<{ id: string; name: string }>;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate()) + "T" + p(date.getHours()) + ":" + p(date.getMinutes()) + ":" + p(date.getSeconds());
}

export function StaffLessonEditForm({ lesson, teams }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description ?? "");
  const [video, setVideo] = useState("https://kinescope.io/" + lesson.kinescope_video_id);
  const [requiredWatch, setRequiredWatch] = useState(String(lesson.required_watch_percent));
  const [marathonDay, setMarathonDay] = useState(String(lesson.marathon_day ?? ""));
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(lesson.starts_at));
  const [deadlineAt, setDeadlineAt] = useState(toDatetimeLocal(lesson.deadline_at));
  const [published, setPublished] = useState(lesson.published);
  const [teamId, setTeamId] = useState(lesson.team_id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");

    try {
      const startsAtIso = parseKzDateTime(startsAt);
      const deadlineAtIso = parseKzDateTime(deadlineAt);
      if (startsAtIso === undefined || deadlineAtIso === undefined) {
        setMessage("Күн мен уақытты 12.09.2026 15:00:00 форматында енгізіңіз.");
        return;
      }
      const response = await fetch("/api/chief-mentor/lessons/" + lesson.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          kinescopeVideo: video,
          requiredWatchPercent: Number(requiredWatch),
          marathonDay: marathonDay ? Number(marathonDay) : null,
          teamId: teamId || null,
          startsAt: startsAtIso,
          deadlineAt: deadlineAtIso,
          published,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ?? "Сабақты сақтау сәтсіз аяқталды.");
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

      <StaffModal open={open} onClose={() => { if (!loading) setOpen(false); }} title="Сабақты өңдеу">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Сабақ атауы<input value={title} onChange={(event) => setTitle(event.target.value)} className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Сипаттама
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-1.5 w-full resize-y rounded-[14px] border border-[#E8E1DA] px-3.5 py-3 text-[11px] font-semibold leading-5 outline-none focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10" />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">Бейне сілтемесі<input value={video} onChange={(event) => setVideo(event.target.value)} className={staffInputClass + " mt-1.5"} /></label>
            <div>
              <p className="text-[10px] font-extrabold text-[#5B534C]">Команда</p>
              <div className="mt-1.5"><StaffSelectMenu value={teamId} onChange={setTeamId} placeholder="Барлық командалар" options={[{ value: "", label: "Барлық командалар" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]} /></div>
            </div>
            <label className="text-[10px] font-extrabold text-[#5B534C]">Марафон күні<input type="number" min="1" max="21" value={marathonDay} onChange={(event) => setMarathonDay(event.target.value)} className={staffInputClass + " mt-1.5"} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-[10px] font-extrabold text-[#5B534C]">Ашылу уақыты</p><div className="mt-1.5"><StaffDateTimeField value={startsAt} onChange={setStartsAt} label="Ашылу уақыты" /></div></div>
            <div><p className="text-[10px] font-extrabold text-[#5B534C]">Соңғы мерзім</p><div className="mt-1.5"><StaffDateTimeField value={deadlineAt} onChange={setDeadlineAt} label="Соңғы мерзім" /></div></div>
          </div>
          <label className="flex items-center gap-2 text-[10px] font-extrabold text-[#5B534C]"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />Жарияланған</label>
          {message ? <p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-bold text-[#B95D00]">{message}</p> : null}
          <div className="flex justify-end"><PrimaryButton type="button" onClick={() => void save()} disabled={loading}>{loading ? "Сақталуда..." : <><Check size={13} />Сақтау</>}</PrimaryButton></div>
        </div>
      </StaffModal>
    </>
  );
}
