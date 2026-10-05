import { notFound, redirect } from "next/navigation";
import { Clock3, LockKeyhole } from "lucide-react";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { TaskSubmissionForm } from "@/components/tasks/TaskSubmissionForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentTranslator } from "@/lib/student-server-language";

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { t } = await getStudentTranslator();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { taskId } = await params;
  const [{ data: profile }, { data: membership }, { data: task }, { data: submission }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("team_members").select("team_id").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
    supabase.from("tasks").select("id,title,description,instructions,deadline,starts_at,points,late_points_percent,attachment_required,max_files,team_id,marathon_day").eq("id", taskId).eq("active", true).maybeSingle(),
    supabase.from("task_submissions").select("id,status,text_answer,submitted_at,submitted_late,link_url,review_comment,resubmission_deadline").eq("task_id", taskId).eq("student_id", user.id).maybeSingle(),
  ]);
  if (!task) notFound();

  const role = profile?.role ?? "STUDENT";
  if (role === "STUDENT" && task.team_id && task.team_id !== membership?.team_id) notFound();

  const now = new Date().getTime();
  const locked = Boolean(task.starts_at && new Date(task.starts_at).getTime() > now);

  if (locked) {
    return (
      <AppShell role={role} userName={profile?.full_name ?? undefined} title={t("taskClosed")} right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
        <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <div className="rounded-[24px] border border-[#E8E1DA] bg-white p-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F6F2ED] text-[#8D837B]"><LockKeyhole size={22} /></span>
            <h2 className="mt-4 text-xl font-extrabold text-[#172235]">{task.title}</h2>
            <p className="mt-2 text-sm text-[#8B8179]">{t("taskNotOpen")}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFF0E8] px-4 py-2 text-xs font-extrabold text-[#C85E2F]"><Clock3 size={14} />{new Date(task.starts_at!).toLocaleString("kk-KZ")}</p>
          </div>
        </main>
      </AppShell>
    );
  }

  const { count: existingFileCount } = submission?.id
    ? await supabase.from("submission_files").select("id", { count: "exact", head: true }).eq("submission_id", submission.id)
    : { count: 0 };

  const late = Boolean(task.deadline && new Date(task.deadline).getTime() < now);

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title={t("task")} description={task.marathon_day ? task.marathon_day + " " + t("dayResponse") + t("finishAnswer") : t("attachFiles")} right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C25100]">{t("taskLabel")}</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{task.title}</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">{task.description}</p>
          {task.instructions ? <div className="mt-4 rounded-xl bg-[#FAFAFA] p-3.5 text-sm leading-6 text-gray-700"><p className="mb-1 text-xs font-semibold text-gray-900">{t("instructions")}</p>{task.instructions}</div> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg bg-[#C25100]/10 px-2.5 py-1.5 text-xs font-semibold text-[#C25100]">{task.points} {t("pointsShort")}</span>{late&&Number(task.late_points_percent)<100?<span className="rounded-lg bg-[#F6F2ED] px-2.5 py-1.5 text-xs font-semibold text-[#7C7168]">{t("lateLabel")}: {task.late_points_percent}%</span>:null}
            <span className={"rounded-lg px-2.5 py-1.5 text-xs font-medium " + (late ? "bg-[#FFF0E8] text-[#C85E2F]" : "bg-[#FAFAFA] text-gray-500")}>{late ? t("deadlineExpiredSubmit") : task.deadline ? new Date(task.deadline).toLocaleString("kk-KZ") : t("deadlineNone")}</span>
            {submission?.submitted_late ? <span className="rounded-lg bg-[#FFF0E8] px-2.5 py-1.5 text-xs font-semibold text-[#C85E2F]">{t("lateSubmittedLabel")}</span> : null}
          </div>
        </div>
        <div className="mt-4">
          <TaskSubmissionForm taskId={task.id} attachmentRequired={task.attachment_required} maxFiles={task.max_files} initialSubmission={submission} existingFileCount={existingFileCount ?? 0} />
        </div>
      </main>
    </AppShell>
  );
}
