import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await context.params;
  const body = await request.json().catch(() => null);
  const textAnswer = typeof body?.textAnswer === "string" ? body.textAnswer.trim() : null;
  const linkUrl = typeof body?.linkUrl === "string" ? body.linkUrl.trim() : null;
  if (linkUrl && !/^https?:\\/\\//i.test(linkUrl)) return NextResponse.json({ error: "Сілтеме http:// немесе https:// арқылы басталуы керек." }, { status: 400 });
  const finalize = body?.finalize !== false;

  const { data: task } = await supabase.from("tasks").select("id,team_id,active,starts_at,deadline,points,attachment_required,max_files").eq("id", taskId).maybeSingle();
  if (!task?.active) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const now = Date.now();
  if (task.starts_at && new Date(task.starts_at).getTime() > now) return NextResponse.json({ error: "Task has not started yet" }, { status: 409 });

  const { data: membership } = await supabase.from("team_members").select("team_id,status").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle();
  if (task.team_id !== null && task.team_id !== membership?.team_id) return NextResponse.json({ error: "Task is not assigned to your team" }, { status: 403 });

  const { data: existing } = await supabase.from("task_submissions").select("id,status").eq("task_id", taskId).eq("student_id", user.id).maybeSingle();
  if (existing?.status === "REVIEWED") return NextResponse.json({ error: "Тексерілген тапсырманы өзгертуге болмайды." }, { status: 409 });
  if (existing?.status === "SUBMITTED" && finalize) return NextResponse.json({ error: "Тапсырма тексеруде. Қайта ашуды ментор жасайды." }, { status: 409 });

  let existingFileCount = 0;
  if (existing?.id) {
    const { count } = await supabase.from("submission_files").select("id", { count: "exact", head: true }).eq("submission_id", existing.id);
    existingFileCount = count ?? 0;
  }
  if (finalize && task.attachment_required && existingFileCount === 0) return NextResponse.json({ error: "Файл міндетті." }, { status: 409 });

  const late = Boolean(task.deadline && new Date(task.deadline).getTime() < now);
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("task_submissions").upsert({
    task_id: taskId,
    student_id: user.id,
    status: finalize ? "SUBMITTED" : "DRAFT",
    text_answer: textAnswer,
    link_url: linkUrl || null,
    submitted_at: finalize ? new Date().toISOString() : null,
    submitted_late: finalize ? late : false,
  }, { onConflict: "task_id,student_id" }).select("id,task_id,student_id,status,text_answer,link_url,submitted_at,submitted_late,review_comment,resubmission_deadline").single();

  if (error) return NextResponse.json({ error: "Submission failed" }, { status: 400 });
  return NextResponse.json({ submission: data });
}
