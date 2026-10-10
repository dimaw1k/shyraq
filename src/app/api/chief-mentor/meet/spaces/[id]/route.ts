import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Meet space ID дұрыс емес." }, { status: 400 });
  }

  const rateLimit = await consumeRateLimit("chief-mentor:legacy-meet-space-update", profile.id, 20, 10 * 60, 10 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Meet параметрлері тым жиі өзгертілді. Кейінірек қайта көріңіз.");
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
  const updates: { display_name?: string; meeting_url?: string; external_space_id?: string; active?: boolean } = {};

  if (Object.prototype.hasOwnProperty.call(body, "displayName")) {
    if (typeof body.displayName !== "string" || !body.displayName.trim() || body.displayName.trim().length > 120) {
      return NextResponse.json({ error: "Meet атауы 1–120 таңба болуы керек." }, { status: 400 });
    }
    updates.display_name = body.displayName.trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "meetingUrl")) {
    if (typeof body.meetingUrl !== "string" || body.meetingUrl.length > 500 || !isSafeMeetUrl(body.meetingUrl.trim())) {
      return NextResponse.json({ error: "Тек жарамды HTTPS Google Meet сілтемесіне рұқсат етіледі." }, { status: 400 });
    }
    updates.meeting_url = body.meetingUrl.trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "externalSpaceId")) {
    if (typeof body.externalSpaceId !== "string" || !isGoogleSpaceName(body.externalSpaceId.trim())) {
      return NextResponse.json({ error: "Google Meet space ID дұрыс емес." }, { status: 400 });
    }
    updates.external_space_id = body.externalSpaceId.trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "active")) {
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Meet белсенділік параметрі дұрыс емес." }, { status: 400 });
    }
    updates.active = body.active;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Өзгертілетін дерек жіберілмеді." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("meet_spaces")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Meet space жаңартылмады." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Meet space табылмады." }, { status: 404 });

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "MEET_SPACE_UPDATED",
    entity_type: "MEET_SPACE",
    entity_id: id,
    metadata: { changes: updates },
  });
  if (auditError) {
    console.error("[chief-mentor/meet/spaces] audit log failed", { code: auditError.code });
  }

  return NextResponse.json({ space: data }, { headers: { "Cache-Control": "no-store" } });
}
