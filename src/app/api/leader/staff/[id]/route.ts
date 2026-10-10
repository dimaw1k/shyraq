import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const ROLES = new Set(["MENTOR", "CHIEF_MENTOR", "LEADER"]);
const STATUSES = new Set(["REGISTERED", "WAITING_FOR_TEAM", "ACTIVE", "INACTIVE", "COMPLETED"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff("LEADER");
  const rateLimit = await consumeRateLimit("leader:staff-role-status-update", profile.id, 10, 900, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Қызметкерлердің рөлі мен мәртебесін өзгерту әрекеттері уақытша шектелді.");
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Профиль идентификаторы дұрыс емес." }, { status: 400 });
  }
  if (id === profile.id) {
    return NextResponse.json({ error: "Өз рөліңізді өзіңіз өзгерте алмайсыз." }, { status: 400 });
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "JSON деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Деректер дұрыс емес." }, { status: 400 });
  }

  const input = parsedBody.value as Record<string, unknown>;
  if (input.role !== undefined && (typeof input.role !== "string" || !ROLES.has(input.role))) {
    return NextResponse.json({ error: "Жарамсыз staff рөлі." }, { status: 400 });
  }
  if (input.status !== undefined && (typeof input.status !== "string" || !STATUSES.has(input.status))) {
    return NextResponse.json({ error: "Жарамсыз статус." }, { status: 400 });
  }
  if (input.role === undefined && input.status === undefined) {
    return NextResponse.json({ error: "Өзгертілетін өріс жіберілмеді." }, { status: 400 });
  }

  const body: { role?: string; status?: string } = {};
  if (typeof input.role === "string") body.role = input.role;
  if (typeof input.status === "string") body.status = input.status;

  const admin = createAdminSupabaseClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id,role,status")
    .eq("id", id)
    .maybeSingle();

  if (targetError) {
    console.error("[leader/staff] target lookup failed", { code: targetError.code });
    return NextResponse.json({ error: "Профильді тексеру мүмкін болмады." }, { status: 500 });
  }
  if (!target) return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });

  if (body.role !== undefined && target.role === "STUDENT") {
    // Membership removal + role/status promotion run in one database transaction.
    const { error: promotionError } = await admin.rpc("leader_promote_student_to_staff", {
      p_target_user_id: id,
      p_requesting_actor_id: profile.id,
      p_new_role: body.role,
      p_new_status: body.status ?? null,
    });

    if (promotionError) {
      if (promotionError.code === "P0002") {
        return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });
      }
      if (promotionError.code === "42501") {
        return NextResponse.json({ error: "Белсенді Leader рұқсаты қажет." }, { status: 403 });
      }
      if (promotionError.code === "22023") {
        return NextResponse.json({ error: "Бұл профильді осы әрекетпен өзгерту мүмкін емес." }, { status: 400 });
      }
      console.error("[leader/staff] atomic student promotion failed", { code: promotionError.code });
      return NextResponse.json({ error: "Пайдаланушы рөлін өзгерту сәтсіз аяқталды." }, { status: 500 });
    }
  } else if (body.role !== undefined) {
    // Keep role + optional status in one conditional update for existing staff.
    let updateQuery = admin
      .from("profiles")
      .update({
        role: body.role,
        ...(body.status !== undefined ? { status: body.status } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("role", target.role)
      .eq("status", target.status)
      .select("id")
      .maybeSingle();

    const { data: changed, error: changeError } = await updateQuery;
    if (changeError) return NextResponse.json({ error: "Рөлді өзгерту сәтсіз аяқталды." }, { status: 500 });
    if (!changed) return NextResponse.json({ error: "Профиль басқа қызметкермен өзгертілді. Бетті жаңартыңыз." }, { status: 409 });

    const { error: roleAuditError } = await admin.from("audit_logs").insert({
      actor_id: profile.id,
      actor_role: "LEADER",
      action: "PROFILE_ROLE_CHANGED",
      entity_type: "PROFILE",
      entity_id: id,
      metadata: { from_role: target.role, to_role: body.role },
    });
    if (roleAuditError) console.error("[leader/staff] role audit failed", { code: roleAuditError.code });

    if (body.status !== undefined) {
      const { error: statusAuditError } = await admin.from("audit_logs").insert({
        actor_id: profile.id,
        actor_role: "LEADER",
        action: "PROFILE_STATUS_CHANGED",
        entity_type: "PROFILE",
        entity_id: id,
        metadata: { from_status: target.status, to_status: body.status },
      });
      if (statusAuditError) console.error("[leader/staff] status audit failed", { code: statusAuditError.code });
    }
  } else if (body.status !== undefined) {
    const { data: changed, error: changeError } = await admin
      .from("profiles")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("role", target.role)
      .eq("status", target.status)
      .select("id")
      .maybeSingle();

    if (changeError) return NextResponse.json({ error: "Статусты өзгерту сәтсіз аяқталды." }, { status: 500 });
    if (!changed) return NextResponse.json({ error: "Профиль басқа қызметкермен өзгертілді. Бетті жаңартыңыз." }, { status: 409 });

    const { error: statusAuditError } = await admin.from("audit_logs").insert({
      actor_id: profile.id,
      actor_role: "LEADER",
      action: "PROFILE_STATUS_CHANGED",
      entity_type: "PROFILE",
      entity_id: id,
      metadata: { from_status: target.status, to_status: body.status },
    });
    if (statusAuditError) console.error("[leader/staff] status audit failed", { code: statusAuditError.code });
  }

  const { data: updated, error } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,role,status,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json({ error: "Профиль жаңартылғаннан кейін табылмады." }, { status: 500 });
  }

  return NextResponse.json({ profile: updated }, { headers: { "Cache-Control": "no-store" } });
}
