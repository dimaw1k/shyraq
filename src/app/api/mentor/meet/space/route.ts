import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { createMeetSpace } from "@/lib/google-meet";

export async function POST(request: Request) {
  const { profile, supabase } = await getAuthenticatedStaff("MENTOR");
  const body = await request.json().catch(() => ({}));
  const displayName =
    typeof body?.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 120)
      : "Shyraq — Google Meet";

  const { data: team } = await supabase
    .from("teams")
    .select("id,name,status")
    .eq("mentor_id", profile.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Белсенді команда табылмады." }, { status: 404 });
  }

  try {
    const accessToken = await getGoogleAccessToken(profile.id);
    const space = await createMeetSpace(accessToken);

    if (!space.name || !space.meetingUri) {
      return NextResponse.json(
        { error: "Google Meet кеңістігі жасалды, бірақ сілтемесі қайтарылмады." },
        { status: 502 },
      );
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("meet_spaces")
      .upsert(
        {
          team_id: team.id,
          external_space_id: space.name,
          meeting_url: space.meetingUri,
          display_name: displayName,
          active: true,
        },
        { onConflict: "team_id" },
      )
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Google Meet жасалды, бірақ Shyraq-та сақтау сәтсіз аяқталды." },
        { status: 500 },
      );
    }

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
      },
    });

    return NextResponse.json({
      ok: true,
      space: data,
      meetingUrl: space.meetingUri,
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
