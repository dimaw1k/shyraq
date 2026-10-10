import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { getMeetSpace } from "@/lib/google-meet";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (me?.status !== "ACTIVE" || (me.role !== "MENTOR" && me.role !== "LEADER")) return NextResponse.json({ error: "Mentor access required" }, { status: 403 });

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
  const teamId = typeof body?.teamId === "string" ? body.teamId : "";
  const spaceInput = typeof body?.space === "string" ? body.space.trim() : "";
  if (!teamId || !spaceInput) return NextResponse.json({ error: "teamId and space are required" }, { status: 400 });
  const rateLimit = await consumeRateLimit("mentor:meet-connect", user.id, 10, 10 * 60, 10 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Meet қосылымын тексеру тым жиі орындалды. Кейінірек қайта көріңіз.");
  }

  const { data: team } = await supabase.from("teams").select("id,mentor_id").eq("id", teamId).maybeSingle();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (me.role === "MENTOR" && team.mentor_id !== user.id) return NextResponse.json({ error: "You do not manage this team" }, { status: 403 });

  const accessToken = await getGoogleAccessToken(team.mentor_id ?? user.id);
  const resource = spaceInput.startsWith("spaces/")
    ? spaceInput
    : "spaces/" + spaceInput;

  let space: Record<string, unknown>;
  try {
    space = await getMeetSpace(accessToken, resource);
  } catch {
    return NextResponse.json({ error: "Google Meet space was not found or is not accessible" }, { status: 400 });
  }

  const canonical = typeof space.name === "string" ? space.name : resource;
  const meetingUri = typeof space.meetingUri === "string" ? space.meetingUri : (typeof body.meetingUrl === "string" ? body.meetingUrl : null);

  const { data, error } = await supabase.from("meet_spaces").upsert({
    team_id: teamId,
    external_space_id: canonical,
    meeting_url: meetingUri,
    display_name: typeof body.displayName === "string" ? body.displayName.trim() : null,
    active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "team_id" }).select("*").single();

  if (error) return NextResponse.json({ error: "Meet space save failed" }, { status: 400 });
  return NextResponse.json({ meetSpace: data });
}
