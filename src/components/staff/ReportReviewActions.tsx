"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

type ReportReviewActionsProps = {
  reportId: string;
  status: string;
};

export function ReportReviewActions({ reportId, status }: ReportReviewActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState<"REVIEWED" | "REJECTED" | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: "REVIEWED" | "REJECTED") {
    setLoading(nextStatus);
    setError("");

    try {
      const response = await fetch(`/api/chief-mentor/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Есеп статусын өзгерту сәтсіз аяқталды.");
      }

      setCurrentStatus(data?.report?.status ?? nextStatus);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Белгісіз қате.");
    } finally {
      setLoading(null);
    }
  }

  if (currentStatus === "REVIEWED") {
    return <span className="text-[9px] font-extrabold text-[#3D7A4B]">Тексерілді</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <PrimaryButton
          type="button"
          className="!min-h-8 !rounded-[10px] !px-3 !py-1.5 !text-[9px]"
          onClick={() => updateStatus("REVIEWED")}
          disabled={loading !== null}
        >
          {loading === "REVIEWED" ? "..." : "Тексерілді"}
        </PrimaryButton>
        <button
          type="button"
          className="min-h-8 rounded-[10px] border border-[#E9D8CF] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#B54D2B] transition hover:bg-[#FFF0E8] disabled:opacity-50"
          onClick={() => updateStatus("REJECTED")}
          disabled={loading !== null}
        >
          {loading === "REJECTED" ? "..." : "Қайтару"}
        </button>
      </div>
      {error ? <p className="max-w-[180px] text-right text-[8px] font-semibold text-[#B54D2B]">{error}</p> : null}
    </div>
  );
}
