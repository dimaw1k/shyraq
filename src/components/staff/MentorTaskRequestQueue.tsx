"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, RefreshCw, X } from "lucide-react";
import { Card, StatusPill } from "@/components/ui/ShyraqUI";

type RequestRow = {
  id: string;
  mentor_name: string;
  team_name: string;
  title: string;
  description: string;
  deadline: string | null;
  points: number;
};
type Draft = { title: string; description: string; deadline: string; points: string };

export function MentorTaskRequestQueue() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    const response = await fetch("/api/staff/task-requests", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error ?? "Сұраныстарды жүктеу сәтсіз аяқталды.");
    }
    return (data.requests ?? []) as RequestRow[];
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setRequests(await fetchRequests());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  useEffect(() => {
    let cancelled = false;

    void fetchRequests()
      .then((nextRequests) => {
        if (!cancelled) setRequests(nextRequests);
      })
      .catch((error) => {
        if (!cancelled) setError(error instanceof Error ? error.message : "Қате");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRequests]);

  function beginEdit(item: RequestRow) {
    setEditingId(item.id);
    setDrafts((current) => ({
      ...current,
      [item.id]: {
        title: item.title,
        description: item.description,
        deadline: item.deadline ? new Date(item.deadline).toISOString().slice(0, 16) : "",
        points: String(item.points),
      },
    }));
  }

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    setActionId(id);
    setError("");

    try {
      const draft = drafts[id];
      const response = await fetch("/api/staff/task-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          status,
          reviewComment: comments[id] ?? "",
          updates:
            status === "APPROVED" && draft
              ? {
                  title: draft.title,
                  description: draft.description,
                  deadline: draft.deadline ? new Date(draft.deadline).toISOString() : null,
                  points: Number(draft.points),
                }
              : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Сұранысты өңдеу сәтсіз аяқталды.");

      setRequests((current) => current.filter((item) => item.id !== id));
      setEditingId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Қате");
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <Card className="p-4 text-[10px] font-semibold text-[#8F857D]">Жүктелуде...</Card>;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#EEE8E1] px-4 py-3.5">
        <div>
          <p className="text-[13px] font-extrabold text-[#172235]">Ментор сұраныстары</p>
          <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">Бекіту / Қайтару / Өңдеу</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-[#FF8000]"
        >
          <RefreshCw size={12} /> Жаңарту
        </button>
      </div>

      {error ? <p className="border-b border-[#EEE8E1] px-4 py-3 text-[9px] font-semibold text-[#B54D2B]">{error}</p> : null}

      <div className="divide-y divide-[#F0EBE5]">
        {!requests.length ? (
          <div className="p-6 text-center text-[10px] font-extrabold text-[#3F3832]">Жаңа сұраныс жоқ</div>
        ) : (
          requests.map((item) => {
            const draft = drafts[item.id];

            return (
              <div key={item.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">✓</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-extrabold text-[#263247]">
                        {editingId === item.id && draft ? (
                          <input
                            value={draft.title}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, title: event.target.value },
                              }))
                            }
                            className="w-full rounded-[9px] border border-[#E8E1DA] bg-white px-2 py-1 text-[10px] font-bold"
                          />
                        ) : (
                          item.title
                        )}
                      </p>
                      <StatusPill tone="orange">Күтуде</StatusPill>
                    </div>

                    <p className="mt-1 text-[9px] text-[#8F857D]">{item.mentor_name} · {item.team_name}</p>

                    {editingId === item.id && draft ? (
                      <div className="mt-2 grid gap-2">
                        <textarea
                          value={draft.description}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [item.id]: { ...draft, description: event.target.value },
                            }))
                          }
                          rows={2}
                          className="rounded-[9px] border border-[#E8E1DA] bg-white px-2.5 py-2 text-[9px]"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="number"
                            value={draft.points}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, points: event.target.value },
                              }))
                            }
                            className="rounded-[9px] border border-[#E8E1DA] bg-white px-2.5 py-2 text-[9px]"
                          />
                          <input
                            type="datetime-local"
                            value={draft.deadline}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, deadline: event.target.value },
                              }))
                            }
                            className="rounded-[9px] border border-[#E8E1DA] bg-white px-2.5 py-2 text-[9px]"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-[9px] leading-5 text-[#5F5750]">{item.description}</p>
                        <p className="mt-1 text-[8px] font-semibold text-[#9A9189]">
                          {item.points} ұпай
                          {item.deadline ? " · " + new Date(item.deadline).toLocaleString("kk-KZ") : ""}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <textarea
                  value={comments[item.id] ?? ""}
                  onChange={(event) => setComments((current) => ({ ...current, [item.id]: event.target.value }))}
                  rows={2}
                  placeholder="Комментарий"
                  className="mt-3 w-full rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[var(--accent)]"
                />

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => beginEdit(item)}
                    disabled={actionId === item.id}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-1.5 text-[9px] font-extrabold"
                  >
                    <Pencil size={11} /> Өңдеу
                  </button>
                  <button
                    type="button"
                    onClick={() => void review(item.id, "REJECTED")}
                    disabled={actionId === item.id}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E9D8CF] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#B54D2B]"
                  >
                    <X size={11} /> Қайтару
                  </button>
                  <button
                    type="button"
                    onClick={() => void review(item.id, "APPROVED")}
                    disabled={actionId === item.id}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] bg-[#FF8000] px-3 py-1.5 text-[9px] font-extrabold text-white"
                  >
                    <Check size={11} /> Бекіту
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
