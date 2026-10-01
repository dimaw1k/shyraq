import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const ALLOWED_STATUSES = new Set(["REVIEWED", "REJECTED"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["MENTOR", "CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Жарамсыз submission статусы." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: submission, error: submissionError } = await admin
    .from("task_submissions")
    .select("id,task_id,student_id,status,submitted_at")
    .eq("id", id)
    .maybeSingle();

  if (submissionError) {
    return NextResponse.json({ error: "Submission жүктеу сәтсіз аяқталды." }, { status: 500 });
  }

  if (!submission) {
    return NextResponse.json({ error: "Submission табылмады." }, { status: 404 });
  }

  const { data: task } = await admin
    .from("tasks")
    .select("id,title,team_id,points")
    .eq("id", submission.task_id)
    .maybeSingle();

  if (!task) {
    return NextResponse.json({ error: "Тапсырма табылмады." }, { status: 404 });
  }

  if (profile.role === "MENTOR") {
    if (!task.team_id) {
      return NextResponse.json({ error: "Жалпы тапсырманы бұл mentor review жасай алмайды." }, { status: 403 });
    }

    const { data: team } = await admin
      .from("teams")
      .select("id")
      .eq("id", task.team_id)
      .eq("mentor_id", profile.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!team) {
      return NextResponse.json({ error: "Бұл submission сіздің командаңызға тиесілі емес." }, { status: 403 });
    }
  }

  if (submission.status === "REVIEWED" && body.status === "REJECTED") {
    return NextResponse.json(
      { error: "Тексерілген submission-ды кейін қайтаруға болмайды." },
      { status: 409 },
    );
  }

  if (submission.status === body.status) {
    return NextResponse.json({ submission });
  }

  const nextStatus = body.status as "REVIEWED" | "REJECTED";
  const { data: updated, error: updateError } = await admin
    .from("task_submissions")
    .update({
      status: nextStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
    })
    .eq("id", id)
    .select("id,task_id,student_id,status,submitted_at,reviewed_at,reviewed_by")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Submission статусын өзгерту сәтсіз аяқталды." }, { status: 500 });
  }

  let scoreAwarded = false;

  if (nextStatus === "REVIEWED" && Number(task.points) > 0) {
    const { data: scoreEvent, error: scoreError } = await admin
      .from("score_events")
      .insert({
        student_id: submission.student_id,
        team_id: task.team_id,
        source_code: "TASK_REVIEW",
        source_id: submission.id,
        points: Number(task.points),
        metadata: {
          task_id: task.id,
          task_title: task.title,
          submission_id: submission.id,
          reviewed_by: profile.id,
        },
      })
      .select("id")
      .maybeSingle();

    if (scoreError && scoreError.code !== "23505") {
      await admin
        .from("task_submissions")
        .update({
          status: submission.status,
          reviewed_at: null,
          reviewed_by: null,
        })
        .eq("id", id);

      return NextResponse.json({ error: "Ұпайды тіркеу сәтсіз аяқталды." }, { status: 500 });
    }

    scoreAwarded = Boolean(scoreEvent) || scoreError?.code === "23505";
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "TASK_SUBMISSION_REVIEWED",
    entity_type: "TASK_SUBMISSION",
    entity_id: submission.id,
    metadata: {
      task_id: task.id,
      student_id: submission.student_id,
      from_status: submission.status,
      to_status: nextStatus,
      score_awarded: scoreAwarded,
      points: nextStatus === "REVIEWED" ? Number(task.points) : 0,
    },
  });

  return NextResponse.json({
    submission: updated,
    scoreAwarded,
  });
}
