import { ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer } from "@/components/ui/ShyraqUI";
import { MentorTaskRequestForm } from "@/components/mentor/MentorTaskRequestForm";
import { TaskSubmissionReviewActions } from "@/components/staff/TaskSubmissionReviewActions";
import { getMentorPageData } from "@/lib/mentor/auth";

export default async function MentorTasksPage() {
  const { profile, workspace } = await getMentorPageData();

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title="Тапсырмалар" description={workspace?.team.name}>
      <PageContainer>
        {!workspace ? <Card className="p-8 text-center"><EmptyState title="Команда бекітілмеген." /></Card> : (
          <div className="space-y-5">
            <section className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">ТАПСЫРМАЛАР</p>
                <h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Тексеру және сұраныс</h2>
                <p className="mt-1 text-[10px] font-medium text-[#9A9189]">{workspace.pendingReviewCount} жаңа жұмыс тексеруді күтуде.</p>
              </div>
              <MentorTaskRequestForm />
            </section>

            <section className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E2] text-[#FF8000]"><ClipboardCheck size={16} /></span>
                  <div>
                    <p className="text-[13px] font-extrabold text-[#172235]">Белсенді тапсырмалар</p>
                    <p className="text-[9px] font-semibold text-[#9A9189]">{workspace.tasks.length} тапсырма</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {workspace.tasks.map((task) => (
                    <div key={task.id} className="rounded-[12px] border border-[#EFE8E1] bg-[#FFFCF9] px-3.5 py-3">
                      <p className="text-[10px] font-extrabold text-[#263247]">{task.title}</p>
                      <p className="mt-1 text-[9px] font-semibold text-[#8F857D]">{task.points} ұпай · {task.deadline ? new Date(task.deadline).toLocaleDateString("kk-KZ") : "Дедлайн жоқ"}</p>
                    </div>
                  ))}
                  {!workspace.tasks.length ? <EmptyState title="Белсенді тапсырма жоқ." /> : null}
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="border-b border-[#EFE8E1] px-5 py-4">
                  <p className="text-[13px] font-extrabold text-[#172235]">Оқушы жұмыстары</p>
                  <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">Команда бойынша соңғы тапсырмалар</p>
                </div>
                <div className="divide-y divide-[#EFE8E1]">
                  {workspace.submissions.map((submission) => (
                    <div key={submission.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-extrabold text-[#263247]">{submission.student_name}</p>
                        <p className="mt-1 truncate text-[9px] font-semibold text-[#8F857D]">{submission.task_title} · +{submission.task_points}</p>
                        {submission.submitted_late ? <p className="mt-1 text-[8px] font-extrabold text-[#B54D2B]">Кеш тапсырылды</p> : null}
                      </div>
                      <TaskSubmissionReviewActions submissionId={submission.id} status={submission.status} points={submission.task_points} />
                    </div>
                  ))}
                  {!workspace.submissions.length ? <div className="p-8"><EmptyState title="Тапсырма жіберілмеген." /></div> : null}
                </div>
              </Card>
            </section>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
