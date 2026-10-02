"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import { parseKzDateTime, StaffDateTimeField, StaffModal, StaffSelectMenu, staffInputClass } from "@/components/staff/StaffUI";

function extractKinescopeId(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!url.hostname.includes("kinescope.io")) return raw;
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? raw;
  } catch {
    return raw;
  }
}

type TeamOption = { id: string; name: string };\n\nexport function StaffCreateLessonForm({ teams = [] }: { teams?: TeamOption[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
  const [description, setDescription] = useState("");
  const [marathonDay, setMarathonDay] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [teamId, setTeamId] = useState("");

  function reset() {
    setTitle("");
    setVideo("");
    setDescription("");
    setMarathonDay("");
    setStartsAt("");
    setDeadlineAt("");
    setTeamId("");
    setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const startsAtIso = parseKzDateTime(startsAt);
      const deadlineAtIso = parseKzDateTime(deadlineAt);
      if (startsAtIso === undefined || deadlineAtIso === undefined) {
        setMessage("Күн мен уақытты 12.09.2026 15:00:00 форматында енгізіңіз.");
        return;
      }
      const response = await fetch("/api/chief-mentor/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          kinescopeVideo: extractKinescopeId(video),
          durationSeconds: 360,
          marathonDay: marathonDay ? Number(marathonDay) : null,
          teamId: teamId || null,
          startsAt: startsAtIso,
          deadlineAt: deadlineAtIso,
          published: false,
          materials: [],
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Сабақ сақталмады.");
        return;
      }

      setMessage("Сабақ қосылды.");
      setOpen(false);
      reset();
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PrimaryButton type="button" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Сабақ қосу
      </PrimaryButton>

      <StaffModal
        open={open}
        onClose={() => { if (!loading) setOpen(false); }}
        title="Жаңа сабақ"
        description="Сабақ атауы, бейне сілтемесі және ашылу уақытын енгізіңіз."
      >
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Сабақ атауы
              <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Мысалы: Күн тәртібі" className={staffInputClass + " mt-1.5"} />
            </label>

            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Сипаттама
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Сабақ туралы толық сипаттаманы еркін жазыңыз."
                className="mt-1.5 w-full resize-y rounded-[14px] border border-[#E8E1DA] bg-white px-3.5 py-3 text-[11px] font-semibold leading-5 outline-none focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
              />
            </label>

            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Бейне сілтемесі
              <input value={video} onChange={(event) => setVideo(event.target.value)} required placeholder="Бейне сілтемесін енгізіңіз" className={staffInputClass + " mt-1.5"} />
            </label>

            <div>
              <p className="text-[10px] font-extrabold text-[#5B534C]">Команда</p>
              <div className="mt-1.5">
                <StaffSelectMenu
                  value={teamId}
                  onChange={setTeamId}
                  placeholder="Барлық командалар"
                  options={[{ value: "", label: "Барлық командалар" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]}
                />
              </div>
            </div>

            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Марафон күні
              <input type="number" min="1" max="21" value={marathonDay} onChange={(event) => setMarathonDay(event.target.value)} placeholder="1–21" className={staffInputClass + " mt-1.5"} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-extrabold text-[#5B534C]">Ашылу уақыты</p>
              <div className="mt-1.5"><StaffDateTimeField value={startsAt} onChange={setStartsAt} label="Ашылу уақыты" /></div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#5B534C]">Соңғы мерзім</p>
              <div className="mt-1.5"><StaffDateTimeField value={deadlineAt} onChange={setDeadlineAt} label="Соңғы мерзім" /></div>
            </div>
          </div>

          {message ? <p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-bold text-[#B95D00]">{message}</p> : null}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} disabled={loading} className="h-11 rounded-[13px] border border-[#E8E1DA] bg-white px-4 text-[10px] font-extrabold text-[#6B625B]">Бас тарту</button>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Сабақты сақтау
            </PrimaryButton>
          </div>
        </form>
      </StaffModal>
    </>
  );
}
