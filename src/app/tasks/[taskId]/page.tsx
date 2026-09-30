import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { TaskSubmissionForm } from "@/components/tasks/TaskSubmissionForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { taskId } = await params;
  const [{ data: profile }, { data: task }, { data: submission }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("tasks").select("id,title,description,instructions,deadline,points,attachment_required,team_id").eq("id", taskId).eq("active", true).maybeSingle(),
    supabase.from("task_submissions").select("id,status,text_answer,submitted_at").eq("task_id", taskId).eq("student_id", user.id).maybeSingle(),
  ]);
  if (!task) notFound();

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role={profile?.role ?? "STUDENT"} />
      <section className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm font-semibold text-[var(--accent)]">TASK</p>
        <h1 className="mt-2 text-3xl font-semibold">{task.title}</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">{task.description}</p>
        {task.instructions ? <div className="mt-6 rounded-2xl bg-zinc-50 p-5 text-sm leading-6">{task.instructions}</div> : null}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white px-3 py-2 ring-1 ring-black/5">{task.points} ұпай</span>
          <span className="rounded-full bg-white px-3 py-2 ring-1 ring-black/5">{task.deadline ? new Date(task.deadline).toLocaleString("kk-KZ") : "Deadline жоқ"}</span>
        </div>
        <div className="mt-8"><TaskSubmissionForm taskId={task.id} attachmentRequired={task.attachment_required} initialSubmission={submission} /></div>
      </section>
    </main>
  );
}
