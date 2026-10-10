import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { syncTeamMeet } from "@/lib/google-meet-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const [{ data: teams, error: teamsError }, { data: spaces, error: spacesError }] = await Promise.all([
    admin
      .from("teams")
      .select("id,name,mentor_id")
      .eq("status", "ACTIVE"),
    admin
      .from("meet_spaces")
      .select("team_id")
      .eq("active", true),
  ]);

  if (teamsError || spacesError) {
    return NextResponse.json({ error: "Meet синхрондауы үшін командалар мен кеңістіктерді жүктеу сәтсіз аяқталды." }, { status: 500 });
  }

  // Space ownership can belong to a Chief Mentor or the team's own mentor.
  // The sync library resolves the account stored on each space, including
  // legacy rows whose Google owner has not yet been confirmed.
  const teamsWithActiveSpaces = new Set((spaces ?? []).map((space) => space.team_id));
  const eligibleTeams = (teams ?? []).filter((team) => teamsWithActiveSpaces.has(team.id));

  const startTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const endTime = new Date().toISOString();
  const results: Array<Record<string, unknown>> = [];

  for (const team of eligibleTeams) {
    try {
      const result = await syncTeamMeet(team.id, startTime, endTime);
      results.push({ ok: true, teamName: team.name, ...result });
    } catch (error) {
      results.push({
        ok: false,
        teamId: team.id,
        teamName: team.name,
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checkedTeams: eligibleTeams.length,
    range: { startTime, endTime },
    results,
  });
}
