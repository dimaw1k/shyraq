"use client";

import { useState } from "react";
import { X } from "lucide-react";

type TaskRequest = {
  id: string;
  title: string;
  status: string;
  review_comment: string | null;
  created_at: string;
};

export function MentorTaskRequestForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [points, setPoints] = useState("0");
  const [marathonDay, setMarathonDay] = useState("");
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      const response = await fetch("/api/mentor/task-requests", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setRequests(data.requests ?? []);
    } catch {
      // The main form remains usable even when status history fails.
    }
  }

  function openForm() {
    setOpen(true);
    setError("");
    void loadRequests();
  }

  async function submit() {
    if (!title.trim() || !description.trim()) {
      setError("Атауы мен сипаттамасын толтырыңыз.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mentor/task-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          instructions,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          points: Number(points) || 0,
          marathonDay: marathonDay ? Number(marathonDay) : null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Сұраныс жіберу сәтсіз аяқталды.");
      setRequests((current) => [data.request, ...current]);
      setTitle("");
      setDescription("");
      setInstructions("");
      setDeadline("");
      setPoints("0");
      setMarathonDay("");
      setError("Сұраныс жіберілді.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openForm} className="inline-flex min-h-8 items-center rounded-[10px] bg-[var(--accent)] px-3 py-1.5 text-[9px] font-extrabold text-white">
        Тапсырма сұрау
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#172235]/20 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[560px] overflow-hidden rounded-[18px] border border-[#E8E1DA] bg-[#FAF9F7] shadow-[0_30px_90px_rgba(23,34,53,.18)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E1DA] px-4 py-3.5">
              <div>
                <p className="text-[14px] font-extrabold text-[#172235]">Тапсырма сұрау</p>
                <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">Сұраныс Leader немесе Chief Mentor бекіткеннен кейін өз командаңызға тапсырма болып шығады.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-[10px] border border-[var(--border)] bg-white"><X size={14} /></button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-4">
              <div className="grid gap-2.5">
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Тапсырма атауы" className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-[10px] font-semibold outline-none focus:border-[var(--accent)]" />
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Сипаттама" className="rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-[10px] font-semibold outline-none focus:border-[var(--accent)]" />
                <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={2} placeholder="Нұсқаулық" className="rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-[10px] font-semibold outline-none focus:border-[var(--accent)]" />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-2.5 text-[9px] font-semibold" />
                  <input type="number" min="0" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="Ұпай" className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-2.5 text-[9px] font-semibold" />
                  <input type="number" min="1" max="21" value={marathonDay} onChange={(event) => setMarathonDay(event.target.value)} placeholder="Марафон күні" className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-2.5 text-[9px] font-semibold" />
                </div>
              </div>

              {error ? <p className={"mt-3 text-[9px] font-semibold " + (error.includes("жіберілді") ? "text-[#3D7A4B]" : "text-[#B54D2B]")}>{error}</p> : null}

              <div className="mt-5">
                <p className="text-[9px] font-extrabold uppercase tracking-[.09em] text-[#9A9189]">Соңғы сұраныстар</p>
                <div className="mt-2 space-y-2">
                  {requests.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-[11px] border border-[#EEE8E1] bg-white px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-extrabold text-[#263247]">{item.title}</p>
                        {item.review_comment ? <p className="mt-0.5 truncate text-[8px] font-semibold text-[#8F857D]">{item.review_comment}</p> : null}
                      </div>
                      <span className={"shrink-0 rounded-full px-2 py-1 text-[8px] font-extrabold " + (item.status === "APPROVED" ? "bg-[#EDF8F2] text-[#2E7E58]" : item.status === "REJECTED" ? "bg-[#FFF0EE] text-[#B54D2B]" : "bg-[#FFF3E6] text-[#B95D00]")}>
                        {item.status === "APPROVED" ? "Бекітілді" : item.status === "REJECTED" ? "Қайтарылды" : "Күтуде"}
                      </span>
                    </div>
                  ))}
                  {!requests.length ? <p className="text-[9px] text-[#9A9189]">Сұраныс жоқ</p> : null}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E8E1DA] px-4 py-3">
              <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-9 items-center rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-[9px] font-extrabold text-[#5F5750]">Жабу</button>
              <button type="button" onClick={() => void submit()} disabled={loading} className="inline-flex min-h-9 items-center rounded-[10px] bg-[var(--accent)] px-3 py-2 text-[9px] font-extrabold text-white disabled:opacity-50">{loading ? "Жіберілуде..." : "Жіберу"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
