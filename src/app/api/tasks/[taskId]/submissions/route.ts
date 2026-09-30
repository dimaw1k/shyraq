import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { recordScoreEvent } from "@/lib/scoring-events";

export async function POST(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await context.params;
  const body = await request.json().catch(() => null);
  const textAnswer = typeof body?.textAnswer === "string" ? body.textAnswer.trim() : null;
  const finalize = body?.finalize !== false;

  const { data: task } = await supabase.from("tasks")
    .select("id,team_id,active,starts_at,deadline,points,attachment_required")
    .eq("id", taskId)
    .maybeSingle();

  if (!task?.active) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const now = Date.now();
  if (task.starts_at && new Date(task.starts_at).getTime() > now) {
    return NextResponse.json({ error: "Task has not started yet" }, { status: 409 });
  }
  if (task.deadline && new Date(task.deadline).getTime() < now) {
    return NextResponse.json({ error: "Task deadline has passed" }, { status: 409 });
  }

  const { data: membership } = await supabase.from("team_members")
    .select("team_id,status")
    .eq("student_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const allowed = task.team_id === null || task.team_id === membership?.team_id;
  if (!allowed) return NextResponse.json({ error: "Task is not assigned to your team" }, { status: 403 });

  const { data: existing } = await supabase.from("task_submissions")
    .select("id,status")
    .eq("task_id", taskId)
    .eq("student_id", user.id)
    .maybeSingle();

  const submissionId = existing?.id;
  let existingFileCount = 0;

  if (submissionId) {
    const { count } = await supabase.from("submission_files")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", submissionId);
    existingFileCount = count ?? 0;
  }

  if (finalize && task.attachment_required && existingFileCount === 0) {
    return NextResponse.json(
      { error: "This task requires an evidence file before submission" },
      { status: 409 },
    );
  }

  const nextStatus = finalize ? "SUBMITTED" : "DRAFT";
  const submittedAt = finalize ? new Date().toISOString() : (existing?.status === "SUBMITTED" ? new Date().toISOString() : null);
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin.from("task_submissions").upsert({
    task_id: taskId,
    student_id: user.id,
    status: nextStatus,
    text_answer: textAnswer,
    submitted_at: submittedAt,
  }, { onConflict: "task_id,student_id" })
    .select("id,task_id,student_id,status,text_answer,submitted_at")
    .single();

  if (error) return NextResponse.json({ error: "Submission failed" }, { status: 400 });

  if (finalize && existing?.status !== "SUBMITTED" && Number(task.points) !== 0) {
    try {
      await recordScoreEvent(supabase, {
        studentId: user.id,
        teamId: membership?.team_id ?? task.team_id,
        sourceCode: "TASKS",
        sourceId: taskId,
        points: Number(task.points),
      });
    } catch (scoreError) {
      console.error("Task score event failed", scoreError);
    }
  }

  return NextResponse.json({ submission: data });
}
