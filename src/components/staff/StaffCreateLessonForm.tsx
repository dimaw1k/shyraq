"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import { StaffDateTimeField, StaffModal, staffInputClass } from "@/components/staff/StaffUI";

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

export function StaffCreateLessonForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
  const [duration, setDuration] = useState("360");
  const [marathonDay, setMarathonDay] = useState("");
  const [lessonOrder, setLessonOrder] = useState("0");
  const [startsAt, setStartsAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [materials, setMaterials] = useState("");

  function reset() {
    setTitle("");
    setVideo("");
    setDuration("360");
    setMarathonDay("");
    setLessonOrder("0");
    setStartsAt("");
    setDeadlineAt("");
    setMaterials("");
    setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          kinescopeVideo: extractKinescopeId(video),
          durationSeconds: Number(duration),
          marathonDay: marathonDay ? Number(marathonDay) : null,
          lessonOrder: Number(lessonOrder || 0),
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : null,
          published: false,
          materials: materials
            .split("\n")
            .map((line) => {
              const [label, ...rest] = line.split("|");
              return { label: label?.trim(), url: rest.join("|").trim(), type: "LINK" };
            })
            .filter((item) => item.label && item.url),
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
        description="Сабақ атауы, Kinescope бейнесі және ашылу уақытын енгізіңіз."
      >
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Сабақ атауы
              <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Мысалы: Күн тәртібі" className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Kinescope бейнесінің сілтемесі
              <input value={video} onChange={(event) => setVideo(event.target.value)} required placeholder="https://kinescope.io/..." className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Ұзақтығы, секунд
              <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Марафон күні
              <input type="number" min="1" max="21" value={marathonDay} onChange={(event) => setMarathonDay(event.target.value)} placeholder="1–21" className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Реті
              <input type="number" min="0" value={lessonOrder} onChange={(event) => setLessonOrder(event.target.value)} className={staffInputClass + " mt-1.5"} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Ашылу уақыты
              <span className="mt-1.5 block"><StaffDateTimeField value={startsAt} onChange={setStartsAt} label="Ашу уақытын таңдау" /></span>
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Дедлайн
              <span className="mt-1.5 block"><StaffDateTimeField value={deadlineAt} onChange={setDeadlineAt} label="Дедлайнды таңдау" /></span>
            </label>
          </div>

          <label className="text-[10px] font-extrabold text-[#5B534C]">
            Қосымша материалдар
            <textarea value={materials} onChange={(event) => setMaterials(event.target.value)} rows={3} placeholder={"Әдістеме | https://...\nҚосымша | https://..."} className="mt-1.5 w-full resize-none rounded-[14px] border border-[#E8E1DA] bg-white px-3.5 py-3 text-[11px] font-semibold outline-none focus:border-[#FF8000]" />
          </label>

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
