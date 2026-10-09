import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncTeamMeet } from "@/lib/google-meet-sync";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "MENTOR" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Mentor access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const teamId = typeof body?.teamId === "string" ? body.teamId : "";
  if (!teamId) return NextResponse.json({ error: "teamId is required" }, { status: 400 });

  const { data: team } = await supabase
    .from("teams")
    .select("id,mentor_id")
    .eq("id", teamId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.mentor_id !== user.id) {
    return NextResponse.json({ error: "You do not manage this team" }, { status: 403 });
  }

  try {
    const result = await syncTeamMeet(
      teamId,
      typeof body?.startTime === "string" ? body.startTime : undefined,
      typeof body?.endTime === "string" ? body.endTime : undefined,
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Google Meet sync failed", error);
    return NextResponse.json({
      error: "Google Meet синхрондауы сәтсіз аяқталды. Кейінірек қайта көріңіз.",
    }, { status: 500 });
  }
}
