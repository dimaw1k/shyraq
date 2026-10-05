import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const DEFAULT_REMINDERS = {
  enabled: true,
  morningMeet: true,
  morningMeetTime: "08:00",
  morningReport: true,
  morningReportTime: "10:00",
  eveningMeet: true,
  eveningMeetTime: "19:00",
  eveningReport: true,
  eveningReportTime: "21:00",
  habits: true,
  habitsTime: "20:30",
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isLanguage(value: unknown): value is "kk" | "ru" | "en" {
  return value === "kk" || value === "ru" || value === "en";
}

function cleanTime(value: unknown, fallback: string) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback;
}

function cleanReminders(value: unknown) {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    enabled: source.enabled !== false,
    morningMeet: source.morningMeet !== false,
    morningMeetTime: cleanTime(source.morningMeetTime, DEFAULT_REMINDERS.morningMeetTime),
    morningReport: source.morningReport !== false,
    morningReportTime: cleanTime(source.morningReportTime, DEFAULT_REMINDERS.morningReportTime),
    eveningMeet: source.eveningMeet !== false,
    eveningMeetTime: cleanTime(source.eveningMeetTime, DEFAULT_REMINDERS.eveningMeetTime),
    eveningReport: source.eveningReport !== false,
    eveningReportTime: cleanTime(source.eveningReportTime, DEFAULT_REMINDERS.eveningReportTime),
    habits: source.habits !== false,
    habitsTime: cleanTime(source.habitsTime, DEFAULT_REMINDERS.habitsTime),
  };
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("student_settings")
    .select("language,reminders,notifications_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[student/settings] GET failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Баптауларды жүктеу мүмкін болмады." }, { status: 500 });
  }

  return NextResponse.json({
    settings: {
      language: isLanguage(data?.language) ? data.language : "kk",
      reminders: cleanReminders(data?.reminders),
      notificationsEnabled: data?.notifications_enabled === true,
    },
  });
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const language = isLanguage(body.language) ? body.language : "kk";
  const reminders = cleanReminders(body.reminders);
  const notificationsEnabled = body.notificationsEnabled === true;

  const { data, error } = await supabase
    .from("student_settings")
    .upsert(
      {
        user_id: user.id,
        language,
        reminders,
        notifications_enabled: notificationsEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("language,theme,reminders,notifications_enabled")
    .single();

  if (error) {
    console.error("[student/settings] PUT failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Баптауларды сақтау мүмкін болмады." }, { status: 500 });
  }

  return NextResponse.json({
    settings: {
      language: data.language,
      reminders: cleanReminders(data.reminders),
      notificationsEnabled: data.notifications_enabled,
    },
  });
}


export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (!isLanguage(body.language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("student_settings")
    .upsert(
      {
        user_id: user.id,
        language: body.language,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("language,theme,reminders,notifications_enabled")
    .single();

  if (error) {
    console.error("[student/settings] PATCH failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "Тілді сақтау мүмкін болмады." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    settings: {
      language: data.language,
      reminders: cleanReminders(data.reminders),
      notificationsEnabled: data.notifications_enabled === true,
    },
  });
}
