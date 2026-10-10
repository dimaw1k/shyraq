import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();
  if (meError) return NextResponse.json({ error: "Аккаунтты тексеру мүмкін болмады." }, { status: 500 });
  if (me?.role !== "MENTOR" || me.status !== "ACTIVE") {
    return NextResponse.json({ error: "Active Mentor access required" }, { status: 403 });
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Meet қосылым деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Meet қосылым деректері дұрыс емес." }, { status: 400 });
  }

  const body = parsedBody.value as Record<string, unknown>;
  const teamId = typeof body.teamId === "string" ? body.teamId.trim() : "";
  const spaceInput = typeof body.space === "string" ? body.space.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const studyTime: StudyTime | null =
    body.studyTime === undefined ? "MORNING" :
    body.studyTime === "MORNING" || body.studyTime === "EVENING" || body.studyTime === "EXTRA"
      ? body.studyTime
      : null;

  if (!UUID_RE.test(teamId)) return NextResponse.json({ error: "teamId дұрыс емес." }, { status: 400 });
  if (!isGoogleSpaceName(spaceInput.startsWith("spaces/") ? spaceInput : "spaces/" + spaceInput)) {
    return NextResponse.json({ error: "Google Meet space ID дұрыс емес." }, { status: 400 });
  }
  if (body.displayName !== undefined && (typeof body.displayName !== "string" || displayName.length > 120)) {
    return NextResponse.json({ error: "Meet атауы 120 таңбадан аспауы керек." }, { status: 400 });
  }
  if (!studyTime) return NextResponse.json({ error: "Meet түрі дұрыс емес." }, { status: 400 });

  const rateLimit = await consumeRateLimit("mentor:meet-connect", user.id, 10, 10 * 60, 10 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Meet қосылымын тексеру тым жиі орындалды. Кейінірек қайта көріңіз.");
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id,mentor_id,status")
    .eq("id", teamId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (teamError) return NextResponse.json({ error: "Команданы тексеру сәтсіз аяқталды." }, { status: 500 });
  if (!team) return NextResponse.json({ error: "Белсенді команда табылмады." }, { status: 404 });
  if (team.mentor_id !== user.id) return NextResponse.json({ error: "Бұл команда сізге бекітілмеген." }, { status: 403 });

  const accessToken = await getGoogleAccessToken(user.id);
  const resource = spaceInput.startsWith("spaces/") ? spaceInput : "spaces/" + spaceInput;

  let space: Record<string, unknown>;
  try {
    space = await getMeetSpace(accessToken, resource);
  } catch {
    return NextResponse.json({ error: "Google Meet space табылмады немесе оған қолжетімділік жоқ." }, { status: 400 });
  }

  const canonical = typeof space.name === "string" ? space.name : "";
  const meetingUri = typeof space.meetingUri === "string" ? space.meetingUri : "";
  if (!isGoogleSpaceName(canonical) || !isSafeMeetUrl(meetingUri)) {
    return NextResponse.json({ error: "Google Meet жарамды сілтемесін растау мүмкін болмады." }, { status: 502 });
  }

  const { data, error } = await supabase.from("meet_spaces").upsert({
    team_id: teamId,
    study_time: studyTime,
    external_space_id: canonical,
    google_user_id: user.id,
    meeting_url: meetingUri,
    display_name: displayName || null,
    active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "team_id,study_time" }).select("*").single();

  if (error || !data) return NextResponse.json({ error: "Meet кеңістігін сақтау сәтсіз аяқталды." }, { status: 500 });
  return NextResponse.json({ meetSpace: data }, { headers: { "Cache-Control": "no-store" } });
}
