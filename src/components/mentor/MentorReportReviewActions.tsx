"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

export function MentorReportReviewActions({
  reportId,
  status,
  reviewComment,
  onReviewed,
}: {
  reportId: string;
  status: string;
  reviewComment: string | null;
  onReviewed?: (status: "REVIEWED" | "REJECTED", comment: string) => void;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [comment, setComment] = useState(reviewComment ?? "");
  const [loading, setLoading] = useState<"REVIEWED" | "REJECTED" | null>(null);
  const [message, setMessage] = useState("");

  async function review(nextStatus: "REVIEWED" | "REJECTED") {
    if (nextStatus === "REJECTED" && !comment.trim()) {
      setMessage("Қайтару кезінде комментарий жазыңыз.");
      return;
    }

    setLoading(nextStatus);
    setMessage("");
    try {
      const response = await fetch("/api/mentor/reports/" + reportId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, comment }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Есепті тексеру сәтсіз аяқталды.");
      setCurrentStatus(data?.report?.status ?? nextStatus);
      setMessage(nextStatus === "REVIEWED" ? "Тексерілді" : "Қайтарылды");
      onReviewed?.(nextStatus, comment);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(null);
    }
  }

  if (currentStatus === "REVIEWED") {
    return <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#3D7A4B]"><Check size={11} />Тексерілді</span>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
        placeholder="Комментарий"
        className="w-full min-w-[190px] rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[var(--accent)]"
      />
      <div className="flex gap-2">
        <PrimaryButton
          type="button"
          className="!min-h-8 !rounded-[10px] !px-3 !py-1.5 !text-[9px]"
          disabled={loading !== null}
          onClick={() => void review("REVIEWED")}
        >
          {loading === "REVIEWED" ? "..." : "Тексеру"}
        </PrimaryButton>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void review("REJECTED")}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E9D8CF] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#B54D2B] disabled:opacity-50"
        >
          <RotateCcw size={11} />{loading === "REJECTED" ? "..." : "Қайтару"}
        </button>
      </div>
      {message ? <p className="text-right text-[8px] font-semibold text-[#7F756D]">{message}</p> : null}
    </div>
  );
}
