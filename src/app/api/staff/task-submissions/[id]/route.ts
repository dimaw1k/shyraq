import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const ALLOWED_STATUSES = new Set(["REVIEWED", "REJECTED", "DRAFT"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["MENTOR", "CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Submission өзгеріс деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Submission өзгеріс деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;

  if (typeof body.status !== "string" || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Жарамсыз submission статусы." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: submission, error: submissionError } = await admin
    .from("task_submissions")
    .select("id,task_id,student_id,status,submitted_at,submitted_late,review_comment,resubmission_deadline")
    .eq("id", id)
    .maybeSingle();

  if (submissionError) return NextResponse.json({ error: "Submission жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Submission табылмады." }, { status: 404 });

  const { data: task } = await admin
    .from("tasks")
    .select("id,title,team_id,points,late_points_percent")
    .eq("id", submission.task_id)
    .maybeSingle();

  if (!task) return NextResponse.json({ error: "Тапсырма табылмады." }, { status: 404 });

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
    if (!team) return NextResponse.json({ error: "Бұл submission сіздің командаңызға тиесілі емес." }, { status: 403 });
  }

  const comment = typeof body.reviewComment === "string" ? body.reviewComment.trim().slice(0, 3000) : null;
  const resubmissionDeadline =
    typeof body.resubmissionDeadline === "string" && body.resubmissionDeadline
      ? body.resubmissionDeadline
      : null;

  if (body.status === "DRAFT") {
    if (submission.status !== "REJECTED") {
      return NextResponse.json({ error: "Тек қайтарылған тапсырманы қайта ашуға болады." }, { status: 409 });
    }

    const { data: updated, error } = await admin.from("task_submissions").update({
      status: "DRAFT",
      reviewed_at: null,
      reviewed_by: null,
      review_comment: comment ?? submission.review_comment,
      resubmission_deadline: resubmissionDeadline ?? submission.resubmission_deadline,
    }).eq("id", id).select(
      "id,task_id,student_id,status,submitted_at,reviewed_at,reviewed_by,review_comment,resubmission_deadline",
    ).single();

    if (error || !updated) return NextResponse.json({ error: "Тапсырманы қайта ашу сәтсіз аяқталды." }, { status: 500 });

    await admin.from("audit_logs").insert({
      actor_id: profile.id,
      actor_role: profile.role,
      action: "TASK_SUBMISSION_REOPENED",
      entity_type: "TASK_SUBMISSION",
      entity_id: id,
      metadata: { student_id: submission.student_id, task_id: task.id },
    });

    return NextResponse.json({ submission: updated, scoreAwarded: false });
  }

  if (body.status === "REJECTED" && !comment) {
    return NextResponse.json({ error: "Қайтару кезінде комментарий міндетті." }, { status: 400 });
  }
  if (submission.status === "REVIEWED" && body.status === "REJECTED") {
    return NextResponse.json({ error: "Тексерілген submission-ды кейін қайтаруға болмайды." }, { status: 409 });
  }
  if (submission.status === body.status) return NextResponse.json({ submission });

  const nextStatus = body.status as "REVIEWED" | "REJECTED";
  const { data: updated, error: updateError } = await admin.from("task_submissions").update({
    status: nextStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: profile.id,
    review_comment: comment,
    resubmission_deadline: resubmissionDeadline,
  }).eq("id", id).select(
    "id,task_id,student_id,status,submitted_at,reviewed_at,reviewed_by,review_comment,resubmission_deadline",
  ).single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Submission статусын өзгерту сәтсіз аяқталды." }, { status: 500 });
  }

  let scoreAwarded = false;
  const latePointsPercent = Number(task.late_points_percent ?? 100);
  const awardedPoints = submission.submitted_late
    ? Math.round(Number(task.points) * latePointsPercent / 100)
    : Number(task.points);

  if (nextStatus === "REVIEWED" && Number(task.points) > 0) {
    const { data: scoreEvent, error: scoreError } = await admin.from("score_events").insert({
      student_id: submission.student_id,
      team_id: task.team_id,
      source_code: "TASK_REVIEW",
      source_id: submission.id,
      points: awardedPoints,
      metadata: {
        task_id: task.id,
        task_title: task.title,
        submission_id: submission.id,
        reviewed_by: profile.id,
        base_points: Number(task.points),
        awarded_points: awardedPoints,
        late_points_percent: latePointsPercent,
        submitted_late: Boolean(submission.submitted_late),
      },
    }).select("id").maybeSingle();

    if (scoreError && scoreError.code !== "23505") {
      await admin.from("task_submissions").update({
        status: submission.status,
        reviewed_at: null,
        reviewed_by: null,
        review_comment: null,
        resubmission_deadline: null,
      }).eq("id", id);

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
      points: nextStatus === "REVIEWED" ? awardedPoints : 0,
    },
  });

  return NextResponse.json({ submission: updated, scoreAwarded });
}
