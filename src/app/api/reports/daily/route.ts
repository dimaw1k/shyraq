import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { calculateCurrentStreak, getSubmittedReportDates, todayInTimezone } from "@/lib/streak";
import { recordScoreEvent } from "@/lib/scoring-events";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  let query = supabase
    .from("daily_reports")
    .select("*")
    .eq("student_id", user.id)
    .order("report_date", { ascending: false })
    .limit(30);

  if (date) query = query.eq("report_date", date);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Unable to load reports" }, { status: 400 });

  return NextResponse.json({ reports: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const reportDate = typeof body?.reportDate === "string" ? body.reportDate : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    return NextResponse.json({ error: "Invalid reportDate" }, { status: 400 });
  }

  const today = todayInTimezone("Asia/Almaty");
  if (reportDate > today) {
    return NextResponse.json({ error: "A daily report cannot be submitted for a future date" }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("id,status")
    .eq("student_id", user.id)
    .eq("report_date", reportDate)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id,status")
    .eq("student_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const payload = {
    student_id: user.id,
    report_date: reportDate,
    study_minutes: typeof body.studyMinutes === "number" ? Math.max(0, Math.floor(body.studyMinutes)) : null,
    completed_task_count: typeof body.completedTaskCount === "number" ? Math.max(0, Math.floor(body.completedTaskCount)) : null,
    reflection: typeof body.reflection === "string" ? body.reflection.trim() : null,
    difficulties: typeof body.difficulties === "string" ? body.difficulties.trim() : null,
    next_day_goal: typeof body.nextDayGoal === "string" ? body.nextDayGoal.trim() : null,
    status: "SUBMITTED" as const,
    submitted_at: new Date().toISOString(),
  };

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("daily_reports")
    .upsert(payload, { onConflict: "student_id,report_date" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Report submission failed" }, { status: 400 });

  if (existing?.status !== "SUBMITTED") {
    const { data: rules } = await supabase
      .from("score_rules")
      .select("code,weight,active")
      .in("code", ["REPORTS", "STREAK"]);

    const reportRule = (rules ?? []).find((rule) => rule.code === "REPORTS");
    if (reportRule?.active && Number(reportRule.weight) !== 0) {
      try {
        await recordScoreEvent(supabase, {
          studentId: user.id,
          teamId: membership?.team_id ?? null,
          sourceCode: "REPORTS",
          sourceId: data.id,
          points: Number(reportRule.weight),
          metadata: { reportDate },
        });
      } catch (scoreError) {
        console.error("Report score event failed", scoreError);
      }
    }

    const { data: recentReports } = await supabase
      .from("daily_reports")
      .select("report_date,status")
      .eq("student_id", user.id)
      .neq("status", "DRAFT")
      .order("report_date", { ascending: false })
      .limit(370);

    const currentStreak = calculateCurrentStreak(
      getSubmittedReportDates(recentReports ?? []),
      today,
    );
    const streakRule = (rules ?? []).find((rule) => rule.code === "STREAK");

    if (currentStreak >= 2 && streakRule?.active && Number(streakRule.weight) !== 0) {
      try {
        await recordScoreEvent(supabase, {
          studentId: user.id,
          teamId: membership?.team_id ?? null,
          sourceCode: "STREAK",
          sourceId: data.id,
          points: Number(streakRule.weight),
          metadata: { reportDate, currentStreak },
        });
      } catch (scoreError) {
        console.error("Streak score event failed", scoreError);
      }
    }
  }

  return NextResponse.json({ report: data });
}
