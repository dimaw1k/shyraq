import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recordScoreEvent } from "@/lib/scoring-events";

export async function POST(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await context.params;
  const body = await request.json().catch(() => null);
  const textAnswer = typeof body?.textAnswer === "string" ? body.textAnswer.trim() : null;

  const { data: task } = await supabase.from("tasks")
    .select("id,team_id,active,deadline,points").eq("id", taskId).maybeSingle();
  if (!task?.active) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { data: membership } = await supabase.from("team_members")
    .select("team_id,status").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle();

  const allowed = task.team_id === null || task.team_id === membership?.team_id;
  if (!allowed) return NextResponse.json({ error: "Task is not assigned to your team" }, { status: 403 });

  const { data: existing } = await supabase.from("task_submissions")
    .select("id,status").eq("task_id", taskId).eq("student_id", user.id).maybeSingle();

  const { data, error } = await supabase.from("task_submissions").upsert({
    task_id: taskId,
    student_id: user.id,
    status: "SUBMITTED",
    text_answer: textAnswer,
    submitted_at: new Date().toISOString(),
  }, { onConflict: "task_id,student_id" })
    .select("id,task_id,student_id,status,text_answer,submitted_at").single();

  if (error) return NextResponse.json({ error: "Submission failed" }, { status: 400 });

  if (existing?.status !== "SUBMITTED" && Number(task.points) !== 0) {
    await recordScoreEvent(supabase, {
      studentId: user.id,
      teamId: membership?.team_id ?? task.team_id,
      sourceCode: "TASKS",
      sourceId: taskId,
      points: Number(task.points),
    });
  }

  return NextResponse.json({ submission: data });
}
