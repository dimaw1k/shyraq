import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { getMeetSpace } from "@/lib/google-meet";
import { readLimitedJson } from "@/lib/http/read-limited-json";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (me?.status !== "ACTIVE" || (me.role !== "MENTOR" && me.role !== "LEADER")) return NextResponse.json({ error: "Mentor access required" }, { status: 403 });

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) return NextResponse.json({ error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Meet деректері дұрыс емес." }, { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } });
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) return NextResponse.json({ error: "Meet деректері дұрыс емес." }, { status: 400 });
  const body = parsedBody.value as Record<string, unknown>;
  const teamId = typeof body.teamId === "string" ? body.teamId.trim() : "";
  const spaceInput = typeof body.space === "string" ? body.space.trim() : "";
  const rawStudyTime = body.studyTime === undefined ? "MORNING" : body.studyTime;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teamId) || !spaceInput || spaceInput.length > 200 || /[\u0000-\u001f\u007f]/.test(spaceInput)) {
    return NextResponse.json({ error: "teamId және Google Meet space ID дұрыс болуы керек." }, { status: 400 });
  }
  if (typeof rawStudyTime !== "string" || !["MORNING", "EVENING", "EXTRA"].includes(rawStudyTime)) {
    return NextResponse.json({ error: "Meet түрі дұрыс емес." }, { status: 400 });
  }
  const studyTime = rawStudyTime;
  if (typeof body.meetingUrl === "string" && body.meetingUrl.length > 2048) {
    return NextResponse.json({ error: "Meet URL тым ұзын." }, { status: 400 });
  }
  if (typeof body.displayName === "string" && body.displayName.trim().length > 120) {
    return NextResponse.json({ error: "Meet атауы 120 таңбадан аспауы керек." }, { status: 400 });
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
  if (meetingUri) {
    try {
      const parsed = new URL(meetingUri);
      if (parsed.protocol !== "https:" || parsed.hostname !== "meet.google.com" || !/^\/[a-z0-9-]+\/?$/i.test(parsed.pathname)) throw new Error("invalid meet URL");
    } catch {
      return NextResponse.json({ error: "Google Meet URL дұрыс емес." }, { status: 400 });
    }
  }

  const { data, error } = await supabase.from("meet_spaces").upsert({
    team_id: teamId,
    study_time: studyTime,
    external_space_id: canonical,
    meeting_url: meetingUri,
    display_name: typeof body.displayName === "string" ? body.displayName.trim() : null,
    active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "team_id,study_time" }).select("*").single();

  if (error) return NextResponse.json({ error: "Meet space save failed" }, { status: 400 });
  return NextResponse.json({ meetSpace: data });
}
