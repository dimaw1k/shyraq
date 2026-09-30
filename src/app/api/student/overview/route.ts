import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: profile }, { data: membership }, { data: reports }, { data: scores }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,status").eq("id", user.id).maybeSingle(),
    supabase.from("team_members").select("team_id,teams(id,name,mentor_id)").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
    supabase.from("daily_reports").select("report_date,status").eq("student_id", user.id).order("report_date", { ascending: false }).limit(30),
    supabase.from("score_events").select("points").eq("student_id", user.id),
    supabase.from("video_progress").select("lesson_id,watched_percent,test_unlocked").eq("student_id", user.id),
  ]);

  const score = (scores ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0);
  const team = Array.isArray(membership?.teams) ? membership.teams[0] ?? null : membership?.teams ?? null;

  return NextResponse.json({
    profile,
    team,
    score,
    reports: reports ?? [],
    videoProgress: progress ?? [],
  });
}
