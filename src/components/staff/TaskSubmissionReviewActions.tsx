"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

export function TaskSubmissionReviewActions({
  submissionId,
  status,
  points,
}: {
  submissionId: string;
  status: string;
  points: number;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState<"REVIEWED" | "REJECTED" | null>(null);
  const [message, setMessage] = useState("");

  async function review(nextStatus: "REVIEWED" | "REJECTED") {
    setLoading(nextStatus);
    setMessage("");

    try {
      const response = await fetch(`/api/staff/task-submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Review сәтсіз аяқталды.");
      }

      setCurrentStatus(data?.submission?.status ?? nextStatus);
      setMessage(
        nextStatus === "REVIEWED"
          ? data?.scoreAwarded
            ? `Тексерілді · +${points} ұпай`
            : "Тексерілді"
          : "Қайтарылды",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Белгісіз қате.");
    } finally {
      setLoading(null);
    }
  }

  if (currentStatus === "REVIEWED") {
    return (
      <div className="text-right">
        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#3D7A4B]">
          <Check size={11} />
          Тексерілді
        </span>
        {message ? <p className="mt-1 text-[8px] font-semibold text-[#7F756D]">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
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
          className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E9D8CF] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#B54D2B] transition hover:bg-[#FFF0E8] disabled:opacity-50"
          disabled={loading !== null}
          onClick={() => void review("REJECTED")}
        >
          <RotateCcw size={11} />
          Қайтару
        </button>
      </div>

      {message ? <p className="max-w-[190px] text-right text-[8px] font-semibold text-[#7F756D]">{message}</p> : null}
    </div>
  );
}
