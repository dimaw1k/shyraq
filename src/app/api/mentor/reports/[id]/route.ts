import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { calculateCurrentStreak, getReviewedReportDates, todayInTimezone } from "@/lib/streak";

const ALLOWED_STATUSES = new Set(["REVIEWED", "REJECTED"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff("MENTOR");
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body?.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Жарамсыз есеп статусы." }, { status: 400 });
  }

  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 3000) : null;
  if (body.status === "REJECTED" && !comment) {
    return NextResponse.json({ error: "Қайтару кезінде комментарий міндетті." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: team } = await admin
    .from("teams")
    .select("id")
    .eq("mentor_id", profile.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Белсенді команда жоқ." }, { status: 409 });

  const { data: member } = await admin
    .from("team_members")
    .select("student_id")
    .eq("team_id", team.id)
    .eq("status", "ACTIVE")
    .eq("student_id", existing.student_id)
    .maybeSingle();

  const { data: existing, error: existingError } = await admin
    .from("daily_reports")
    .select("id,student_id,status,report_date,reviewed_at,reviewed_by,review_comment")
    .eq("id", id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: "Есепті жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Есеп табылмады." }, { status: 404 });

  if (!member || member.student_id !== existing.student_id) {
    return NextResponse.json({ error: "Бұл есеп сіздің командаңызға тиесілі емес." }, { status: 403 });
  }

  if (existing.status === "REVIEWED" && body.status === "REJECTED") {
    return NextResponse.json({ error: "Тексерілген есепті кері қайтаруға болмайды." }, { status: 409 });
  }

  if (existing.status === body.status && existing.review_comment === comment) {
    return NextResponse.json({ report: existing });
  }

  const nextStatus = body.status as "REVIEWED" | "REJECTED";
  const { data: updated, error: updateError } = await admin
    .from("daily_reports")
    .update({
      status: nextStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
      review_comment: comment,
    })
    .eq("id", id)
    .select("id,student_id,report_date,status,reviewed_at,reviewed_by,review_comment")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Есеп статусын өзгерту сәтсіз аяқталды." }, { status: 500 });
  }

  if (nextStatus === "REVIEWED") {
    const { data: rules } = await admin
      .from("score_rules")
      .select("code,weight,active")
      .in("code", ["REPORTS", "STREAK"]);

    const reportRule = (rules ?? []).find((rule) => rule.code === "REPORTS");
    if (reportRule?.active && Number(reportRule.weight) !== 0) {
      const { error: scoreError } = await admin.from("score_events").insert({
        student_id: existing.student_id,
        team_id: team.id,
        source_code: "REPORTS",
        source_id: existing.id,
        points: Number(reportRule.weight),
        metadata: { reportDate: existing.report_date, reviewerId: profile.id },
      });
      if (scoreError && scoreError.code !== "23505") {
        return NextResponse.json({ error: "Есеп ұпайын есептеу сәтсіз аяқталды." }, { status: 500 });
      }
    }

    const { data: recentReports } = await admin
      .from("daily_reports")
      .select("report_date,status")
      .eq("student_id", existing.student_id)
      .eq("status", "REVIEWED")
      .order("report_date", { ascending: false })
      .limit(370);

    const currentStreak = calculateCurrentStreak(
      getReviewedReportDates(recentReports ?? []),
      todayInTimezone("Asia/Almaty"),
    );

    const streakRule = (rules ?? []).find((rule) => rule.code === "STREAK");
    if (currentStreak >= 2 && streakRule?.active && Number(streakRule.weight) !== 0) {
      const { error: streakError } = await admin.from("score_events").insert({
        student_id: existing.student_id,
        team_id: team.id,
        source_code: "STREAK",
        source_id: existing.id,
        points: Number(streakRule.weight),
        metadata: { reportDate: existing.report_date, currentStreak, reviewerId: profile.id },
      });
      if (streakError && streakError.code !== "23505") {
        return NextResponse.json({ error: "Streak ұпайын есептеу сәтсіз аяқталды." }, { status: 500 });
      }
    }
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "DAILY_REPORT_REVIEWED",
    entity_type: "DAILY_REPORT",
    entity_id: id,
    metadata: { student_id: existing.student_id, from_status: existing.status, to_status: nextStatus, comment },
  });

  return NextResponse.json({ report: updated });
}
