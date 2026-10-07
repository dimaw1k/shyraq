import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { createMeetSpace } from "@/lib/google-meet";

export async function POST(request: Request) {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const body = await request.json().catch(() => ({}));

  const teamId = typeof body?.teamId === "string" ? body.teamId : "";
  const displayName =
    typeof body?.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 120)
      : "";
  const studyTime =
    body?.studyTime === "EVENING"
      ? "EVENING"
      : body?.studyTime === "EXTRA"
        ? "EXTRA"
        : "MORNING";
  const allTeams = body?.allTeams === true;

  if (!teamId && !allTeams) {
    return NextResponse.json({ error: "Команданы таңдаңыз." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: selectedTeams } = allTeams
    ? await admin.from("teams").select("id,name,status").eq("status", "ACTIVE").order("name")
    : await admin
        .from("teams")
        .select("id,name,status")
        .eq("id", teamId)
        .eq("status", "ACTIVE");

  if (!selectedTeams?.length) {
    return NextResponse.json({ error: "Белсенді команда табылмады." }, { status: 404 });
  }

  try {
    const accessToken = await getGoogleAccessToken(profile.id);
    const createdSpaces = [];

    for (const team of selectedTeams) {
      const space = await createMeetSpace(accessToken);

      if (!space.name || !space.meetingUri) {
        return NextResponse.json(
          { error: team.name + " командасы үшін Google Meet сілтемесі қайтарылмады." },
          { status: 502 },
        );
      }

      const { data, error } = await admin
        .from("meet_spaces")
        .upsert(
          {
            team_id: team.id,
            external_space_id: space.name,
            meeting_url: space.meetingUri,
            display_name:
              displayName ||
              team.name +
                " — " +
                (studyTime === "MORNING"
                  ? "Morning Study Time"
                  : studyTime === "EVENING"
                    ? "Evening Study Time"
                    : "Extra Meet"),
            study_time: studyTime,
            active: true,
          },
          { onConflict: "team_id,study_time" },
        )
        .select("*")
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: team.name + " командасы үшін Meet сақтау сәтсіз аяқталды." },
          { status: 500 },
        );
      }

      createdSpaces.push(data);

      await admin.from("audit_logs").insert({
        actor_id: profile.id,
        actor_role: profile.role,
        action: "GOOGLE_MEET_SPACE_CREATED",
        entity_type: "MEET_SPACE",
        entity_id: data.id,
        metadata: {
          teamId: team.id,
          externalSpaceId: space.name,
          meetingUri: space.meetingUri,
          studyTime,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      spaces: createdSpaces,
      count: createdSpaces.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Google Meet кеңістігін жасау сәтсіз аяқталды.",
      },
      { status: 500 },
    );
  }
}
