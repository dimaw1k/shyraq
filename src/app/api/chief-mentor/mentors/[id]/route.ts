import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const STATUS = new Set(["ACTIVE", "INACTIVE", "COMPLETED"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function profileNotFound() {
  return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile: actor } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const rateLimit = await consumeRateLimit("chief-mentor:mentor-status-change", actor.id, 10, 900, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Ментор рөлін немесе мәртебесін өзгерту әрекеттері тым жиі орындалды.");
  }
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Профиль идентификаторы дұрыс емес." }, { status: 400 });
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Өзгеріс деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Өзгеріс деректері дұрыс емес." }, { status: 400 });
  }

  const body = parsedBody.value as Record<string, unknown>;
  if (body.role !== undefined && body.role !== "MENTOR") {
    return NextResponse.json({ error: "Chief Mentor тек MENTOR рөлін тағайындай алады." }, { status: 403 });
  }
  if (body.status !== undefined && (typeof body.status !== "string" || !STATUS.has(body.status))) {
    return NextResponse.json({ error: "Жарамсыз статус." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id,role,status")
    .eq("id", id)
    .maybeSingle();

  if (targetError) {
    console.error("[chief-mentor/mentors] target lookup failed", { code: targetError.code });
    return NextResponse.json({ error: "Профильді тексеру мүмкін болмады." }, { status: 500 });
  }
  if (!target) return profileNotFound();

  // Only STUDENT -> MENTOR is a valid promotion. Existing senior staff must not
  // be silently demoted by the mentor-management screen.
  if (target.role === "STUDENT") {
    if (body.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Тек оқушыны ментор ретінде қосуға болады." },
        { status: 403 },
      );
    }
    if (body.status !== undefined && body.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Жаңа ментор белсенді мәртебемен қосылуы керек." },
        { status: 400 },
      );
    }

    // The database function verifies the actor again and atomically removes
    // the student's active team memberships, promotes the profile and audits it.
    const { error: promotionError } = await admin.rpc("chief_mentor_promote_student", {
      p_target_user_id: id,
      p_requesting_actor_id: actor.id,
    });

    if (promotionError) {
      if (promotionError.code === "P0002") return profileNotFound();
      if (promotionError.code === "42501") {
        return NextResponse.json({ error: "Chief Mentor рұқсаты қажет." }, { status: 403 });
      }
      if (promotionError.code === "22023") {
        return NextResponse.json({ error: "Бұл аккаунтты ментор ретінде қосу мүмкін емес." }, { status: 400 });
      }
      console.error("[chief-mentor/mentors] atomic promotion failed", { code: promotionError.code });
      return NextResponse.json({ error: "Ментор ретінде қосу сәтсіз аяқталды." }, { status: 500 });
    }
  } else if (target.role === "MENTOR") {
    if (typeof body.status !== "string") {
      return NextResponse.json({ error: "Өзгеріс дерегі жіберілмеді." }, { status: 400 });
    }
    const { error: updateError } = await admin
      .from("profiles")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("[chief-mentor/mentors] status update failed", { code: updateError.code });
      return NextResponse.json({ error: "Ментор мәртебесін жаңарту сәтсіз аяқталды." }, { status: 500 });
    }

    const { error: auditError } = await admin.from("audit_logs").insert({
      actor_id: actor.id,
      actor_role: actor.role,
      action: "CHIEF_MENTOR_PROFILE_UPDATED",
      entity_type: "PROFILE",
      entity_id: id,
      metadata: { changes: { status: body.status } },
    });
    if (auditError) {
      console.error("[chief-mentor/mentors] status audit failed", { code: auditError.code });
    }
  } else {
    return NextResponse.json(
      { error: "Тек оқушыны ментор ретінде қосуға немесе бар менторды басқаруға болады." },
      { status: 403 },
    );
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,role,status,avatar_path,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[chief-mentor/mentors] profile refresh failed", { code: error.code });
    return NextResponse.json({ error: "Ментор деректерін жүктеу сәтсіз аяқталды." }, { status: 500 });
  }
  if (!data) return profileNotFound();

  const avatar_url = data.avatar_path
    ? admin.storage.from("avatars").getPublicUrl(data.avatar_path).data.publicUrl
    : null;

  return NextResponse.json({ profile: { ...data, avatar_url } });
}
