import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { shiftDate, todayInTimezone } from "@/lib/streak";

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dayDiff(start: string, end: string) {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);
  return Math.floor((endMs - startMs) / 86_400_000);
}

function weekdayOneBased(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (date.getUTCDay() + 6) % 7 + 1;
}

function isScheduled(
  habit: {
    frequency: string;
    weekdays: number[];
    start_date: string;
    goal_days: number | null;
    repeat_interval: number;
    repeat_unit: string;
  },
  dateKey: string,
) {
  if (dateKey < habit.start_date) return false;

  const elapsed = dayDiff(habit.start_date, dateKey);
  if (habit.goal_days !== null && elapsed >= habit.goal_days) return false;

  if (habit.frequency === "DAILY") return true;

  if (habit.frequency === "WEEKLY") {
    return habit.weekdays.includes(weekdayOneBased(dateKey));
  }

  const intervalDays =
    habit.repeat_unit === "WEEK"
      ? habit.repeat_interval * 7
      : habit.repeat_interval;

  return elapsed % intervalDays === 0;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ habitId: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }

  const { habitId } = await context.params;
  const body = await request.json().catch(() => null);
  const dateKey = validDate(body?.dateKey) ? body.dateKey : todayInTimezone("Asia/Almaty");

  const today = todayInTimezone("Asia/Almaty");
  const oldestAllowed = shiftDate(today, -90);

  if (dateKey > today || dateKey < oldestAllowed) {
    return NextResponse.json(
      { error: "Бұл күнге белгі қоюға болмайды." },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();

  const { data: habit } = await admin
    .from("habits")
    .select(
      "id,student_id,active,frequency,weekdays,start_date,goal_days,repeat_interval,repeat_unit",
    )
    .eq("id", habitId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!habit?.active) {
    return NextResponse.json({ error: "Әдет табылмады." }, { status: 404 });
  }

  if (!isScheduled(habit, dateKey)) {
    return NextResponse.json(
      { error: "Бұл күн әдет кестесіне кірмейді." },
      { status: 400 },
    );
  }

  const { data: existing } = await admin
    .from("habit_checkins")
    .select("id")
    .eq("habit_id", habitId)
    .eq("student_id", user.id)
    .eq("completed_date", dateKey)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("habit_checkins")
      .delete()
      .eq("id", existing.id)
      .eq("student_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Белгіні алып тастау мүмкін болмады." },
        { status: 400 },
      );
    }

    return NextResponse.json({ checked: false, dateKey });
  }

  const { error } = await admin.from("habit_checkins").insert({
    habit_id: habitId,
    student_id: user.id,
    completed_date: dateKey,
  });

  if (error) {
    console.error("[habits] checkin failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "Әдетті белгілеу мүмкін болмады." },
      { status: 400 },
    );
  }

  return NextResponse.json({ checked: true, dateKey });
}
