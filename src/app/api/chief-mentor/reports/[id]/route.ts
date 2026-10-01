import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { calculateCurrentStreak, getReviewedReportDates, todayInTimezone } from "@/lib/streak";

const ALLOWED_STATUSES = new Set(["REVIEWED", "REJECTED"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Жарамсыз есеп статусы." }, { status: 400 });
  }

  const nextStatus = body.status as "REVIEWED" | "REJECTED";
  const admin = createAdminSupabaseClient();

  const { data: existing, error: existingError } = await admin
    .from("daily_reports")
    .select("id,student_id,status,report_date,reviewed_at,reviewed_by")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Есепті жүктеу сәтсіз аяқталды." }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Есеп табылмады." }, { status: 404 });
  }

  if (existing.status === nextStatus) {
    return NextResponse.json({ report: existing });
  }

  if (existing.status === "REVIEWED" && nextStatus === "REJECTED") {
    return NextResponse.json(
      { error: "Қаралған есепті кері қайтаруға болмайды." },
      { status: 409 },
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("daily_reports")
    .update({
      status: nextStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
    })
    .eq("id", id)
    .select("id,student_id,report_date,status,reviewed_at,reviewed_by")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Есеп статусын өзгерту сәтсіз аяқталды." }, { status: 500 });
  }

  let scoreAwarded = false;
  let reportPoints = 0;
  let streakPoints = 0;
  const team = await admin
    .from("team_members")
    .select("team_id")
    .eq("student_id", existing.student_id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (nextStatus === "REVIEWED") {
    const { data: rules, error: rulesError } = await admin
      .from("score_rules")
      .select("code,weight,active")
      .in("code", ["REPORTS", "STREAK"]);

    if (rulesError) {
      await admin.from("daily_reports").update({
        status: existing.status,
        reviewed_at: existing.reviewed_at,
        reviewed_by: existing.reviewed_by,
      }).eq("id", id);
      return NextResponse.json({ error: "Ұпай ережелерін оқу сәтсіз аяқталды." }, { status: 500 });
    }

    const reportRule = (rules ?? []).find((rule) => rule.code === "REPORTS");
    if (reportRule?.active && Number(reportRule.weight) !== 0) {
      reportPoints = Number(reportRule.weight);
      const { error: scoreError } = await admin.from("score_events").insert({
        student_id: existing.student_id,
        team_id: team.data?.team_id ?? null,
        source_code: "REPORTS",
        source_id: existing.id,
        points: reportPoints,
        metadata: {
          reportDate: existing.report_date,
          reviewerId: profile.id,
        },
      });

      if (scoreError && scoreError.code !== "23505") {
        await admin.from("daily_reports").update({
          status: existing.status,
          reviewed_at: existing.reviewed_at,
          reviewed_by: existing.reviewed_by,
        }).eq("id", id);
        return NextResponse.json({ error: "Есеп ұпайын есептеу сәтсіз аяқталды." }, { status: 500 });
      }

      scoreAwarded = scoreAwarded || !scoreError || scoreError.code === "23505";
    }

    const { data: recentReports, error: recentReportsError } = await admin
      .from("daily_reports")
      .select("report_date,status")
      .eq("student_id", existing.student_id)
      .eq("status", "REVIEWED")
      .order("report_date", { ascending: false })
      .limit(370);

    if (recentReportsError) {
      await admin.from("daily_reports").update({
        status: existing.status,
        reviewed_at: existing.reviewed_at,
        reviewed_by: existing.reviewed_by,
      }).eq("id", id);
      return NextResponse.json({ error: "Streak деректерін оқу сәтсіз аяқталды." }, { status: 500 });
    }

    const currentStreak = calculateCurrentStreak(
      getReviewedReportDates(recentReports ?? []),
      todayInTimezone("Asia/Almaty"),
    );

    const streakRule = (rules ?? []).find((rule) => rule.code === "STREAK");
    if (currentStreak >= 2 && streakRule?.active && Number(streakRule.weight) !== 0) {
      streakPoints = Number(streakRule.weight);
      const { error: streakError } = await admin.from("score_events").insert({
        student_id: existing.student_id,
        team_id: team.data?.team_id ?? null,
        source_code: "STREAK",
        source_id: existing.id,
        points: streakPoints,
        metadata: {
          reportDate: existing.report_date,
          currentStreak,
          reviewerId: profile.id,
        },
      });

      if (streakError && streakError.code !== "23505") {
        await admin.from("daily_reports").update({
          status: existing.status,
          reviewed_at: existing.reviewed_at,
          reviewed_by: existing.reviewed_by,
        }).eq("id", id);
        return NextResponse.json({ error: "Streak ұпайын есептеу сәтсіз аяқталды." }, { status: 500 });
      }

      scoreAwarded = scoreAwarded || !streakError || streakError.code === "23505";
    }
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "DAILY_REPORT_REVIEWED",
    entity_type: "DAILY_REPORT",
    entity_id: id,
    metadata: {
      student_id: existing.student_id,
      from_status: existing.status,
      to_status: nextStatus,
      score_awarded: scoreAwarded,
      report_points: reportPoints,
      streak_points: streakPoints,
    },
  });

  return NextResponse.json({ report: updated });
}
