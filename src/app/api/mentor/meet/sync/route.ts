import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncTeamMeet } from "@/lib/google-meet-sync";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

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

  const rateLimit = await consumeRateLimit("google-meet:mentor-sync", user.id, 8, 10 * 60, 10 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Meet синхрондауы тым жиі орындалды. Кейінірек қайта көріңіз.");
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Сұраныс деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Сұраныс деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;
  const teamId = typeof body.teamId === "string" ? body.teamId.trim() : "";
  if (!teamId || teamId.length > 100) return NextResponse.json({ error: "teamId is invalid" }, { status: 400 });

  const hasStartTime = typeof body.startTime === "string" && body.startTime.length > 0;
  const hasEndTime = typeof body.endTime === "string" && body.endTime.length > 0;
  if ((hasStartTime && !hasEndTime) || (!hasStartTime && hasEndTime)) {
    return NextResponse.json({ error: "startTime мен endTime бірге берілуі керек." }, { status: 400 });
  }
  if (hasStartTime && hasEndTime) {
    const startMs = Date.parse(body.startTime as string);
    const endMs = Date.parse(body.endTime as string);
    const nowMs = Date.now();
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      startMs >= endMs ||
      endMs > nowMs + 5 * 60 * 1000 ||
      endMs - startMs > 90 * 24 * 60 * 60 * 1000
    ) {
      return NextResponse.json({ error: "Синхрондау аралығы 90 күннен аспайтын дұрыс күндер болуы керек." }, { status: 400 });
    }
  }

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
