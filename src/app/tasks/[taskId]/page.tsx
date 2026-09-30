import { notFound, redirect } from "next/navigation";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { TaskSubmissionForm } from "@/components/tasks/TaskSubmissionForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { taskId } = await params;
  const [{ data: profile }, { data: task }, { data: submission }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("tasks").select("id,title,description,instructions,deadline,points,attachment_required,team_id").eq("id", taskId).eq("active", true).maybeSingle(),
    supabase.from("task_submissions").select("id,status,text_answer,submitted_at").eq("task_id", taskId).eq("student_id", user.id).maybeSingle(),
  ]);

  if (!task) notFound();
  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Тапсырма" description="Жауапты аяқтап, қажет файлдарды тіркеңіз." right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C25100]">TASK</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{task.title}</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">{task.description}</p>

          {task.instructions ? (
            <div className="mt-4 rounded-xl bg-[#FAFAFA] p-3.5 text-sm leading-6 text-gray-700">
              <p className="mb-1 text-xs font-semibold text-gray-900">Нұсқаулық</p>
              {task.instructions}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg bg-[#C25100]/10 px-2.5 py-1.5 text-xs font-semibold text-[#C25100]">{task.points} ұпай</span>
            <span className="rounded-lg bg-[#FAFAFA] px-2.5 py-1.5 text-xs font-medium text-gray-500">
              {task.deadline ? new Date(task.deadline).toLocaleString("kk-KZ") : "Deadline жоқ"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <TaskSubmissionForm taskId={task.id} attachmentRequired={task.attachment_required} initialSubmission={submission} />
        </div>
      </main>
    </AppShell>
  );
}
