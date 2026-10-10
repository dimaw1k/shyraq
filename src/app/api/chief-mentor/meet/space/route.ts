import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { createMeetSpace } from "@/lib/google-meet";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Meet space деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Meet space деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;
  const allTeamsRequested = body.allTeams === true;
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
    return NextResponse.json(
      { error: "Команданы таңдаңыз." },
      { status: 400 },
    );
  }

  const rateLimit = await consumeRateLimit(
    allTeamsRequested ? "chief-mentor:meet-space-all-teams" : "chief-mentor:meet-space-create",
    profile.id,
    allTeamsRequested ? 2 : 8,
    allTeamsRequested ? 15 * 60 : 10 * 60,
    allTeamsRequested ? 15 * 60 : 10 * 60,
  );
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Meet кеңістіктерін құру тым жиі орындалды. Кейінірек қайта көріңіз.");
  }

  const admin = createAdminSupabaseClient();

  const { data: selectedTeams } = allTeams
    ? await admin
        .from("teams")
        .select("id,name,status")
        .eq("status", "ACTIVE")
        .order("name")
    : await admin
        .from("teams")
        .select("id,name,status")
        .eq("id", teamId)
        .eq("status", "ACTIVE");

  if (!selectedTeams?.length) {
    return NextResponse.json(
      { error: "Белсенді команда табылмады." },
      { status: 404 },
    );
  }

  try {
    const accessToken = await getGoogleAccessToken(profile.id);
    const spaces = [];
    let createdCount = 0;
    let reusedCount = 0;

    for (const team of selectedTeams) {
      const { data: existingSpace, error: existingError } = await admin
        .from("meet_spaces")
        .select("*")
        .eq("team_id", team.id)
        .eq("study_time", studyTime)
        .eq("active", true)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json(
          {
            error:
              team.name +
              " командасының бұрынғы Meet сілтемесін тексеру сәтсіз аяқталды.",
          },
          { status: 500 },
        );
      }

      if (existingSpace) {
        if (displayName && displayName !== existingSpace.display_name) {
          const { data: updatedSpace } = await admin
            .from("meet_spaces")
            .update({ display_name: displayName })
            .eq("id", existingSpace.id)
            .select("*")
            .single();

          spaces.push(updatedSpace ?? existingSpace);
        } else {
          spaces.push(existingSpace);
        }

        reusedCount += 1;

        await admin.from("audit_logs").insert({
          actor_id: profile.id,
          actor_role: profile.role,
          action: "GOOGLE_MEET_SPACE_REUSED",
          entity_type: "MEET_SPACE",
          entity_id: existingSpace.id,
          metadata: {
            teamId: team.id,
            externalSpaceId: existingSpace.external_space_id,
            studyTime,
          },
        });

        continue;
      }

      const space = await createMeetSpace(accessToken);

      if (!space.name || !space.meetingUri) {
        return NextResponse.json(
          {
            error:
              team.name +
              " командасы үшін Google Meet сілтемесі қайтарылмады.",
          },
          { status: 502 },
        );
      }

      const { data, error } = await admin
        .from("meet_spaces")
        .insert({
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
        })
        .select("*")
        .single();

      if (error || !data) {
        const { data: recoveredSpace } = await admin
          .from("meet_spaces")
          .select("*")
          .eq("team_id", team.id)
          .eq("study_time", studyTime)
          .eq("active", true)
          .maybeSingle();

        if (recoveredSpace) {
          spaces.push(recoveredSpace);
          reusedCount += 1;
          continue;
        }

        return NextResponse.json(
          {
            error:
              team.name +
              " командасы үшін Meet сақтау сәтсіз аяқталды.",
          },
          { status: 500 },
        );
      }

      spaces.push(data);
      createdCount += 1;

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
      spaces,
      count: spaces.length,
      createdCount,
      reusedCount,
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
