import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { shiftDate, todayInTimezone } from "@/lib/streak";

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ habitId: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { habitId } = await context.params;
  const body = await request.json().catch(() => null);
  const dateKey = validDate(body?.dateKey) ? body.dateKey : todayInTimezone();

  const today = todayInTimezone("Asia/Almaty");
  const oldestAllowed = shiftDate(today, -90);

  if (dateKey > today || dateKey < oldestAllowed) {
    return NextResponse.json({ error: "Бұл күнге белгі қоюға болмайды." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: habit } = await admin
    .from("habits")
    .select("id,student_id,active")
    .eq("id", habitId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!habit?.active) {
    return NextResponse.json({ error: "Әдет табылмады." }, { status: 404 });
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
      return NextResponse.json({ error: "Белгіні алып тастау мүмкін болмады." }, { status: 400 });
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
    return NextResponse.json({ error: "Әдетті белгілеу мүмкін болмады." }, { status: 400 });
  }

  return NextResponse.json({ checked: true, dateKey });
}
