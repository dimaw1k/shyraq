import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/streak";
import { isReportOpen, formatReportOpenTime } from "@/lib/report-schedule";

const REPORT_TYPES = new Set(["MORNING", "EVENING"]);

function shiftDateKey(value: string, delta: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status === "INACTIVE") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
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

  const today = todayInTimezone("Asia/Almaty");

  const { data: reportSettings, error: reportSettingsError } = await supabase
    .from("marathon_settings")
    .select("morning_report_open_time,evening_report_open_time")
    .eq("id", true)
    .maybeSingle();

  if (reportSettingsError || !reportSettings) {
    return NextResponse.json(
      { error: "Есеп уақытының баптауларын жүктеу мүмкін болмады." },
      { status: 500 },
    );
  }

  const openTime =
    reportType === "MORNING"
      ? reportSettings.morning_report_open_time
      : reportSettings.evening_report_open_time;

  if (!isReportOpen(openTime)) {
    return NextResponse.json(
      {
        error:
          (reportType === "MORNING" ? "Таңғы" : "Кешкі") +
          " есеп " +
          formatReportOpenTime(openTime) +
          " бастап ашылады.",
      },
      { status: 423 },
    );
  }
  if (reportDate !== today) {
    return NextResponse.json(
      { error: "Күндік есепті тек бүгінгі күнге жіберуге болады." },
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

  const startOfDay = `${reportDate}T00:00:00+05:00`;
  const startOfNextDay = `${shiftDateKey(reportDate, 1)}T00:00:00+05:00`;

  const [{ data: attendanceRows, error: attendanceError }, { count: completedTaskCount, error: taskCountError }] =
    await Promise.all([
      supabase
        .from("attendance_records")
        .select("attended_seconds,started_at,ended_at")
        .eq("student_id", user.id)
        .gte("started_at", startOfDay)
        .lt("started_at", startOfNextDay),
      supabase
        .from("task_submissions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id)
        .in("status", ["SUBMITTED", "REVIEWED"])
        .gte("submitted_at", startOfDay)
        .lt("submitted_at", startOfNextDay),
    ]);

  if (attendanceError || taskCountError) {
    return NextResponse.json(
      { error: "Study Time немесе тапсырма статистикасын есептеу мүмкін болмады." },
      { status: 500 },
    );
  }

  const studyMinutes = Math.round(
    (attendanceRows ?? [])
      .filter((row) => {
        const stamp = row.started_at ?? row.ended_at;
        if (!stamp) return false;
        const hour = Number(
          new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Almaty",
            hour: "2-digit",
            hour12: false,
          }).format(new Date(stamp)),
        );
        return reportType === "MORNING" ? hour < 14 : hour >= 14;
      })
      .reduce((sum, row) => sum + Number(row.attended_seconds ?? 0), 0) / 60,
  );

  const derivedCompletedTaskCount = Math.max(0, Number(completedTaskCount ?? 0));

  const { data, error } = await supabase
    .from("daily_reports")
    .upsert(
      {
        student_id: user.id,
        report_date: reportDate,
        report_type: reportType,
        marathon_day: marathonDay,
        study_minutes: Math.max(0, Math.floor(studyMinutes)),
        completed_task_count: derivedCompletedTaskCount,
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
