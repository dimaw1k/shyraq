import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  cleanWeekdays,
  isAllowedHabitIcon,
  isHabitFrequency,
  isHabitRepeatUnit,
} from "@/lib/habits";
import { todayInTimezone } from "@/lib/streak";

const SECTIONS = ["Таңертең", "Күндіз", "Кешке", "Басқа"] as const;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validTime(value: unknown): value is string {
  return value === null || value === "" || (
    typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Әдеттер бөлімі тек оқушыларға арналған." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);

  const name = cleanText(body?.name);
  const description = cleanText(body?.description);
  const icon = cleanText(body?.icon) || "Sparkles";
  const goal = cleanText(body?.goal);
  const section = cleanText(body?.section) || "Күндіз";
  const startDate = body?.startDate;
  const frequency = body?.frequency;
  const repeatUnit = body?.repeatUnit;
  const reminderTime = body?.reminderTime ?? null;
  const repeatInterval = Number(body?.repeatInterval ?? 1);
  const rawGoalDays = body?.goalDays;

  if (name.length < 2 || name.length > 60) {
    return NextResponse.json(
      { error: "Әдет атауы 2–60 таңба аралығында болуы керек." },
      { status: 400 },
    );
  }

  if (description.length > 140) {
    return NextResponse.json(
      { error: "Сипаттама 140 таңбадан аспауы керек." },
      { status: 400 },
    );
  }

  if (goal.length > 100) {
    return NextResponse.json(
      { error: "Мақсат 100 таңбадан аспауы керек." },
      { status: 400 },
    );
  }

  if (!isAllowedHabitIcon(icon)) {
    return NextResponse.json(
      { error: "Әдет белгішесі дұрыс емес." },
      { status: 400 },
    );
  }

  if (!isHabitFrequency(frequency)) {
    return NextResponse.json(
      { error: "Қайталау түрі дұрыс емес." },
      { status: 400 },
    );
  }

  if (!validDate(startDate)) {
    return NextResponse.json(
      { error: "Басталу күні дұрыс көрсетілмеген." },
      { status: 400 },
    );
  }

  const today = todayInTimezone("Asia/Almaty");
  if (startDate < today) {
    return NextResponse.json(
      { error: "Басталу күні бүгіннен ерте болмауы керек." },
      { status: 400 },
    );
  }

  if (!SECTIONS.includes(section as (typeof SECTIONS)[number])) {
    return NextResponse.json(
      { error: "Бөлім дұрыс таңдалмаған." },
      { status: 400 },
    );
  }

  if (!validTime(reminderTime)) {
    return NextResponse.json(
      { error: "Еске салу уақыты дұрыс емес." },
      { status: 400 },
    );
  }

  const weekdays = cleanWeekdays(body?.weekdays);
  if (!weekdays) {
    return NextResponse.json(
      { error: "Кемінде бір күнді таңдау керек." },
      { status: 400 },
    );
  }

  const normalizedWeekdays =
    frequency === "DAILY" || frequency === "REPEAT"
      ? [1, 2, 3, 4, 5, 6, 7]
      : weekdays;

  let goalDays: number | null = null;
  if (rawGoalDays !== null && rawGoalDays !== undefined && rawGoalDays !== "") {
    const parsed = Number(rawGoalDays);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
      return NextResponse.json(
        { error: "Мақсат мерзімі 1–999 күн аралығында болуы керек." },
        { status: 400 },
      );
    }
    goalDays = parsed;
  }

  if (frequency === "REPEAT") {
    if (!Number.isInteger(repeatInterval) || repeatInterval < 1 || repeatInterval > 365) {
      return NextResponse.json(
        { error: "Қайталау аралығы 1–365 аралығында болуы керек." },
        { status: 400 },
      );
    }

    if (!isHabitRepeatUnit(repeatUnit)) {
      return NextResponse.json(
        { error: "Қайталау бірлігі дұрыс емес." },
        { status: 400 },
      );
    }
  }

  const admin = createAdminSupabaseClient();

  const { data: existing } = await admin
    .from("habits")
    .select("id")
    .eq("student_id", user.id)
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Мұндай әдет бұрыннан бар." },
      { status: 409 },
    );
  }

  const { data, error } = await admin
    .from("habits")
    .insert({
      student_id: user.id,
      name,
      description: description || null,
      icon,
      is_default: false,
      active: true,
      sort_order: 1000,
      frequency,
      weekdays: normalizedWeekdays,
      goal: goal || null,
      start_date: startDate,
      goal_days: goalDays,
      section,
      reminder_time: reminderTime || null,
      repeat_interval: frequency === "REPEAT" ? repeatInterval : 1,
      repeat_unit: frequency === "REPEAT" ? repeatUnit : "DAY",
    })
    .select(
      "id,name,description,icon,is_default,sort_order,frequency,weekdays,goal,start_date,goal_days,section,reminder_time,repeat_interval,repeat_unit",
    )
    .single();

  if (error) {
    console.error("[habits] create failed", {
      code: error.code,
      message: error.message,
    });

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Мұндай әдет бұрыннан бар." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Әдетті сақтау мүмкін болмады." },
      { status: 400 },
    );
  }

  return NextResponse.json({ habit: data }, { status: 201 });
}
