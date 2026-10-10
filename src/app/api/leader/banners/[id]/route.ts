import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 5000;

function isSafeHref(value: string) {
  const href = value.trim();
  if (!href || href.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(href)) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function parseOptionalDate(value: unknown): string | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return undefined;
  return new Date(Date.parse(value)).toISOString();
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff("LEADER");
  const rateLimit = await consumeRateLimit("leader:banner-mutate", profile.id, 30, 600, 120);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Banner өзгерту әрекеттері тым жиі орындалды.");
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Banner идентификаторы дұрыс емес." }, { status: 400 });
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Banner деректері тым үлкен." : "Banner деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Banner деректері дұрыс емес." }, { status: 400 });
  }

  const input = parsedBody.value as Record<string, unknown>;
  if (input.title !== undefined && (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.trim().length > MAX_TITLE_LENGTH
  )) {
    return NextResponse.json({ error: "Banner атауы 1–120 таңба болуы керек." }, { status: 400 });
  }
  if (input.description !== undefined && input.description !== null && (
    typeof input.description !== "string" || input.description.length > MAX_DESCRIPTION_LENGTH
  )) {
    return NextResponse.json({ error: "Banner сипаттамасы 5000 таңбадан аспауы керек." }, { status: 400 });
  }
  if (input.href !== undefined && input.href !== null && (
    typeof input.href !== "string" || !isSafeHref(input.href)
  )) {
    return NextResponse.json({ error: "Banner сілтемесі қауіпсіз HTTPS немесе ішкі жол болуы керек." }, { status: 400 });
  }
  if (input.published !== undefined && typeof input.published !== "boolean") {
    return NextResponse.json({ error: "Banner жариялану күйі дұрыс емес." }, { status: 400 });
  }
  if (input.sortOrder !== undefined && (
    typeof input.sortOrder !== "number" || !Number.isInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 10000
  )) {
    return NextResponse.json({ error: "Banner реті 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }

  const startsAt = input.startsAt === undefined ? undefined : parseOptionalDate(input.startsAt);
  const endsAt = input.endsAt === undefined ? undefined : parseOptionalDate(input.endsAt);
  if ((input.startsAt !== undefined && startsAt === undefined) || (input.endsAt !== undefined && endsAt === undefined)) {
    return NextResponse.json({ error: "Banner жариялану уақыты дұрыс емес." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from("marathon_banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "Banner тексеру сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Banner табылмады." }, { status: 404 });

  const nextStartsAt = startsAt === undefined ? current.starts_at : startsAt;
  const nextEndsAt = endsAt === undefined ? current.ends_at : endsAt;
  if (nextStartsAt && nextEndsAt && Date.parse(nextStartsAt) > Date.parse(nextEndsAt)) {
    return NextResponse.json({ error: "Banner аяқталу уақыты басталу уақытынан бұрын болмауы керек." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("marathon_banners")
    .update({
      title: input.title === undefined ? current.title : (input.title as string).trim(),
      description: input.description === undefined ? current.description :
        input.description === null ? null : (input.description as string).trim() || null,
      href: input.href === undefined ? current.href :
        input.href === null ? null : (input.href as string).trim() || null,
      published: input.published === undefined ? current.published : input.published,
      starts_at: nextStartsAt,
      ends_at: nextEndsAt,
      sort_order: input.sortOrder === undefined ? current.sort_order : input.sortOrder,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return NextResponse.json({ error: "Banner жаңартылмады." }, { status: 500 });

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "BANNER_UPDATED",
    entity_type: "MARATHON_BANNER",
    entity_id: id,
    metadata: { published: data.published },
  });
  if (auditError) console.error("[leader/banners] audit log failed", { code: auditError.code });

  return NextResponse.json({ banner: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff("LEADER");
  const rateLimit = await consumeRateLimit("leader:banner-mutate", profile.id, 30, 600, 120);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Banner өзгерту әрекеттері тым жиі орындалды.");
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Banner идентификаторы дұрыс емес." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from("marathon_banners")
    .select("id,image_path")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "Banner тексеру сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Banner табылмады." }, { status: 404 });

  const { error } = await admin.from("marathon_banners").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Banner өшірілмеді." }, { status: 500 });

  if (current.image_path) {
    const { error: storageError } = await admin.storage.from("banners").remove([current.image_path]);
    if (storageError) console.error("[leader/banners] image cleanup failed", { code: storageError.name });
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "BANNER_DELETED",
    entity_type: "MARATHON_BANNER",
    entity_id: id,
    metadata: {},
  });
  if (auditError) console.error("[leader/banners] audit log failed", { code: auditError.code });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
