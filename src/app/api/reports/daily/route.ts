import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const REPORT_TYPES = new Set(["MORNING", "EVENING"]);

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reportDate =
    typeof body?.reportDate === "string" ? body.reportDate : "";
  const reportType =
    typeof body?.reportType === "string" && REPORT_TYPES.has(body.reportType)
      ? body.reportType
      : "EVENING";
  const marathonDay =
    typeof body?.marathonDay === "number" && Number.isInteger(body.marathonDay)
      ? body.marathonDay
      : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    return NextResponse.json(
      { error: "Есеп күні дұрыс емес." },
      { status: 400 },
    );
  }

  if (marathonDay !== null && (marathonDay < 1 || marathonDay > 21)) {
    return NextResponse.json(
      { error: "Марафон күні дұрыс емес." },
      { status: 400 },
    );
  }

  const answers =
    body?.answers &&
    typeof body.answers === "object" &&
    !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};

  const { data: questions, error: questionError } = await supabase
    .from("daily_report_questions")
    .select("field_key,required")
    .eq("active", true)
    .eq("report_type", reportType)
    .or(
      "marathon_day.is.null,marathon_day.eq." +
        (marathonDay ?? 0),
    );

  if (questionError) {
    return NextResponse.json(
      { error: "Есеп сұрақтарын тексеру мүмкін болмады." },
      { status: 500 },
    );
  }

  const missing = (questions ?? []).filter(
    (question) =>
      question.required &&
      (answers[question.field_key] === undefined ||
        answers[question.field_key] === null ||
        String(answers[question.field_key]).trim() === ""),
  );

  if (missing.length) {
    return NextResponse.json(
      { error: "Міндетті есеп сұрақтарына толық жауап беріңіз." },
      { status: 400 },
    );
  }

  const studyMinutes = Number(body?.studyMinutes ?? 0);
  const completedTaskCount = Number(body?.completedTaskCount ?? 0);

  const { data, error } = await supabase
    .from("daily_reports")
    .upsert(
      {
        student_id: user.id,
        report_date: reportDate,
        report_type: reportType,
        marathon_day: marathonDay,
        study_minutes: Number.isFinite(studyMinutes)
          ? Math.max(0, Math.floor(studyMinutes))
          : 0,
        completed_task_count: Number.isFinite(completedTaskCount)
          ? Math.max(0, Math.floor(completedTaskCount))
          : 0,
        reflection:
          typeof body?.reflection === "string"
            ? body.reflection.trim() || null
            : null,
        difficulties:
          typeof body?.difficulties === "string"
            ? body.difficulties.trim() || null
            : null,
        next_day_goal:
          typeof body?.nextDayGoal === "string"
            ? body.nextDayGoal.trim() || null
            : null,
        answers,
        status: "SUBMITTED",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "student_id,report_date,report_type" },
    )
    .select(
      "id,student_id,report_date,report_type,marathon_day,study_minutes,completed_task_count,reflection,difficulties,next_day_goal,answers,status,submitted_at",
    )
    .single();

  if (error) {
    console.error("[reports] save failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "Есепті сақтау мүмкін болмады." },
      { status: 400 },
    );
  }

  return NextResponse.json({ report: data });
}
