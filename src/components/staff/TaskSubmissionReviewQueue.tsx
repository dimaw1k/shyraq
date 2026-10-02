import { FileCheck2 } from "lucide-react";
import { Card, EmptyState, StatusPill } from "@/components/ui/ShyraqUI";
import { TaskSubmissionReviewActions } from "@/components/staff/TaskSubmissionReviewActions";
import type { StaffTaskSubmissionRow } from "@/lib/staff/task-submissions";

function statusLabel(status: string) {
  if (status === "SUBMITTED") return "Жіберілді";
  if (status === "REVIEWED") return "Тексерілді";
  if (status === "REJECTED") return "Қайтарылды";
  return status;
}

function statusTone(status: string) {
  if (status === "REVIEWED") return "green" as const;
  if (status === "REJECTED") return "red" as const;
  return "orange" as const;
}

export function TaskSubmissionReviewQueue({ submissions }: { submissions: StaffTaskSubmissionRow[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="hidden grid-cols-[1.05fr_1fr_110px_110px_250px] gap-3 border-b border-[#EFE8E1] bg-[#FCFAF8] px-6 py-3 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#9A9189] lg:grid">
        <span>Оқушы</span>
        <span>Тапсырма</span>
        <span>Материал</span>
        <span>Статус</span>
        <span className="text-right">Әрекет</span>
      </div>

      <div className="divide-y divide-[#EFE8E1]">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="grid gap-4 px-5 py-4 lg:grid-cols-[1.05fr_1fr_110px_110px_250px] lg:items-center lg:px-6"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]">
                <FileCheck2 size={14} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-extrabold text-[#354153]">{submission.student_name}</p>
                <p className="mt-1 text-[9px] text-[#9A9189]">
                  {submission.submitted_at
                    ? new Date(submission.submitted_at).toLocaleString("kk-KZ")
                    : "Уақыт жоқ"}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold text-[#4B433C]">{submission.task_title}</p>
              <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">+{submission.task_points} ұпай</p>
            </div>

            <div className="text-[9px] font-semibold text-[#8B8179]">
              {submission.file_count} файл{submission.text_answer ? " · мәтін бар" : ""}{submission.link_url ? " · сілтеме бар" : ""}{submission.submitted_late ? " · кеш" : ""}
            </div>

            <StatusPill tone={statusTone(submission.status)}>
              {statusLabel(submission.status)}
            </StatusPill>

            <div className="lg:justify-self-end">
              <TaskSubmissionReviewActions
                submissionId={submission.id}
                status={submission.status}
                points={submission.task_points}
              />
            </div>

            {submission.text_answer ? (
              <div className="rounded-[12px] bg-[#FFFCF9] px-3 py-2.5 text-[9px] leading-5 text-[#655B53] lg:col-span-4">
                <span className="font-extrabold text-[#4B433C]">Жауап: </span>
                {submission.text_answer}
              </div>
            ) : null}

            {submission.link_url ? (
              <div className="rounded-[12px] bg-[#FFFCF9] px-3 py-2.5 text-[9px] leading-5 text-[#655B53] lg:col-span-4">
                <span className="font-extrabold text-[#4B433C]">Сілтеме: </span>
                <a href={submission.link_url} target="_blank" rel="noreferrer" className="underline">{submission.link_url}</a>
              </div>
            ) : null}
          </div>
        ))}

        {!submissions.length ? (
          <div className="p-8">
            <EmptyState title="Тексерілетін тапсырма жұмысы жоқ." description="Оқушы тапсырма жібергенде осы жерде пайда болады." />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
