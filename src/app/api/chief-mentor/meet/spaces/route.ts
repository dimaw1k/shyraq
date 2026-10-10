import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { getMeetSpace } from "@/lib/google-meet";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type StudyTime = "MORNING" | "EVENING" | "EXTRA";

function isSafeMeetUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "meet.google.com"
      && !url.username
      && !url.password
      && !url.port
      && url.pathname !== "/";
  } catch {
    return false;
  }
}

function isGoogleSpaceName(value: string) {
  return /^spaces\/[A-Za-z0-9_-]{1,180}$/.test(value);
}

export async function POST(request: Request) {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");

  const rateLimit = await consumeRateLimit(
    "chief-mentor:legacy-meet-space-upsert",
    profile.id,
    8,
    10 * 60,
    10 * 60,
  );
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Meet сілтемесін сақтау тым жиі орындалды. Кейінірек қайта көріңіз.");
  }

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
  const teamId = typeof body.teamId === "string" ? body.teamId.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const meetingUrl = typeof body.meetingUrl === "string" ? body.meetingUrl.trim() : "";
  const externalSpaceId = typeof body.externalSpaceId === "string" ? body.externalSpaceId.trim() : "";
  const studyTime: StudyTime | null =
    body.studyTime === undefined ? "MORNING" :
    body.studyTime === "MORNING" || body.studyTime === "EVENING" || body.studyTime === "EXTRA"
      ? body.studyTime
      : null;

  if (!UUID_RE.test(teamId)) {
    return NextResponse.json({ error: "Команда идентификаторы дұрыс емес." }, { status: 400 });
  }
  if (!displayName || displayName.length > 120) {
    return NextResponse.json({ error: "Meet атауы 1–120 таңба болуы керек." }, { status: 400 });
  }
  if (meetingUrl.length > 500 || !isSafeMeetUrl(meetingUrl)) {
    return NextResponse.json({ error: "Тек жарамды HTTPS Google Meet сілтемесіне рұқсат етіледі." }, { status: 400 });
  }
  if (!isGoogleSpaceName(externalSpaceId)) {
    return NextResponse.json({ error: "Google Meet space ID дұрыс емес." }, { status: 400 });
  }
  if (!studyTime) {
    return NextResponse.json({ error: "Meet түрі дұрыс емес." }, { status: 400 });
  }

  const accessToken = await getGoogleAccessToken(profile.id);
  let verifiedSpace: Record<string, unknown>;
  try {
    verifiedSpace = await getMeetSpace(accessToken, externalSpaceId);
  } catch {
    return NextResponse.json({ error: "Бұл Google Meet кеңістігі қосылған аккаунттан қолжетімсіз." }, { status: 400 });
  }
  const verifiedSpaceId = typeof verifiedSpace.name === "string" ? verifiedSpace.name : "";
  const verifiedMeetingUrl = typeof verifiedSpace.meetingUri === "string" ? verifiedSpace.meetingUri : "";
  if (verifiedSpaceId !== externalSpaceId || !isSafeMeetUrl(verifiedMeetingUrl) || meetingUrl !== verifiedMeetingUrl) {
    return NextResponse.json({ error: "Meet ID және сілтеме Google тарапынан расталмады." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: team, error: teamError } = await admin
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (teamError) return NextResponse.json({ error: "Команданы тексеру сәтсіз аяқталды." }, { status: 500 });
  if (!team) return NextResponse.json({ error: "Белсенді команда табылмады." }, { status: 404 });

  const { data, error } = await admin
    .from("meet_spaces")
    .upsert({
      team_id: teamId,
      study_time: studyTime,
      external_space_id: verifiedSpaceId,
      google_user_id: profile.id,
      meeting_url: verifiedMeetingUrl,
      display_name: displayName,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "team_id,study_time" })
    .select("*")
    .single();

  if (error || !data) return NextResponse.json({ error: "Meet space сақталмады." }, { status: 500 });

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "MEET_SPACE_UPSERTED",
    entity_type: "MEET_SPACE",
    entity_id: data.id,
    metadata: { teamId, studyTime, externalSpaceId },
  });
  if (auditError) {
    console.error("[chief-mentor/meet/spaces] audit log failed", { code: auditError.code });
  }

  return NextResponse.json({ space: data }, { headers: { "Cache-Control": "no-store" } });
}
