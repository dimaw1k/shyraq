"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

type StaffLessonEditFormProps = {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    kinescope_video_id: string;
    duration_seconds: number;
    required_watch_percent: number;
    sort_order: number;
    published: boolean;
    starts_at: string | null;
  };
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function StaffLessonEditForm({ lesson }: StaffLessonEditFormProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description ?? "");
  const [videoId, setVideoId] = useState(lesson.kinescope_video_id);
  const [duration, setDuration] = useState(String(lesson.duration_seconds));
  const [requiredWatch, setRequiredWatch] = useState(String(lesson.required_watch_percent));
  const [sortOrder, setSortOrder] = useState(String(lesson.sort_order));
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(lesson.starts_at));
  const [published, setPublished] = useState(lesson.published);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/chief-mentor/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          kinescopeVideoId: videoId,
          durationSeconds: Number(duration),
          requiredWatchPercent: Number(requiredWatch),
          sortOrder: Number(sortOrder),
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          published,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ?? "Сабақты сақтау сәтсіз аяқталды.");
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
    <div className="w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 sm:w-[460px]">
      <div className="grid gap-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]" placeholder="Сабақ атауы" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="resize-none rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]" placeholder="Сипаттама" />

        <div className="grid grid-cols-2 gap-2">
          <input value={videoId} onChange={(event) => setVideoId(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold" placeholder="Kinescope video ID" />
          <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold" placeholder="Секунд" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <input type="number" min="0" max="100" value={requiredWatch} onChange={(event) => setRequiredWatch(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold" placeholder="Watch %" />
          <input type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold" placeholder="Рет" />
          <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold" />
        </div>

        <label className="flex items-center gap-2 text-[9px] font-bold text-[#5B534C]">
          <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
          PUBLISHED
        </label>

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
