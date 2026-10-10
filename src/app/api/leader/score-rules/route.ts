import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const ALLOWED_CODES = ["TASKS", "TESTS", "VIDEO", "ATTENDANCE", "REPORTS", "STREAK"] as const;
type ScoreCode = (typeof ALLOWED_CODES)[number];

function isAllowedCode(value: string): value is ScoreCode {
  return ALLOWED_CODES.includes(value as ScoreCode);
}

export async function GET() {
  const { supabase } = await getAuthenticatedStaff("LEADER");
  const { data, error } = await supabase
    .from("score_rules")
    .select("id,code,label,weight,active,updated_at")
    .in("code", ALLOWED_CODES)
    .order("code");

  if (error) {
    return NextResponse.json({ error: "Ұпай ережелерін жүктеу сәтсіз аяқталды." }, { status: 500 });
  }

  return NextResponse.json({ rules: data ?? [] });
}

export async function PATCH(request: Request) {
  const { profile } = await getAuthenticatedStaff("LEADER");
  const rateLimit = await consumeRateLimit("leader:score-rules", profile.id, 10, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Ұпай ережелерін өзгерту әрекеттері уақытша шектелді.");
  }
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Ұпай ережелерінің деректері тым үлкен." : "JSON деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const body = parsedBody.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Деректер форматы дұрыс емес." }, { status: 400 });
  }
  const admin = createAdminSupabaseClient();

  const rawRules = (body as Record<string, unknown>).rules;
  if (!Array.isArray(rawRules) || rawRules.length === 0 || rawRules.length > ALLOWED_CODES.length) {
    return NextResponse.json({ error: "1–6 аралығында ұпай ережесін жіберіңіз." }, { status: 400 });
  }

  const submitted = new Map<ScoreCode, { code: ScoreCode; weight: number; active: boolean }>();

  for (const item of rawRules) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return NextResponse.json({ error: "Ұпай ережесінің форматы дұрыс емес." }, { status: 400 });
    }

    const input = item as Record<string, unknown>;
    const code = typeof input.code === "string" ? input.code : "";

    if (!isAllowedCode(code)) {
      return NextResponse.json({ error: "Жарамсыз score rule коды." }, { status: 400 });
    }

    if (submitted.has(code)) {
      return NextResponse.json({ error: "Ұпай ережесінің коды қайталанды." }, { status: 400 });
    }

    if (typeof input.weight !== "number" || !Number.isFinite(input.weight) || input.weight < 0 || input.weight > 10000) {
      return NextResponse.json({ error: code + " үшін weight 0 мен 10000 арасында сан болуы керек." }, { status: 400 });
    }

    if (typeof input.active !== "boolean") {
      return NextResponse.json({ error: code + " үшін active true немесе false болуы керек." }, { status: 400 });
    }

    submitted.set(code, {
      code,
      weight: Number(input.weight.toFixed(2)),
      active: input.active,
    });
  }

  const rows = ALLOWED_CODES
    .map((code) => submitted.get(code))
    .filter((value): value is { code: ScoreCode; weight: number; active: boolean } => Boolean(value))
    .map((rule) => ({
      code: rule.code,
      weight: rule.weight,
      active: rule.active,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }));

  const { data, error } = await admin
    .from("score_rules")
    .upsert(rows, { onConflict: "code" })
    .select("id,code,label,weight,active,updated_at")
    .order("code");

  if (error) {
    console.error("[leader/score-rules] update failed", { code: error.code });
    return NextResponse.json({ error: "Ұпай ережелерін сақтау сәтсіз аяқталды." }, { status: 500 });
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "SCORE_RULES_UPDATED",
    entity_type: "SCORE_RULES",
    metadata: {
      rules: rows.map((row) => ({ code: row.code, weight: row.weight, active: row.active })),
    },
  });

  if (auditError) {
    console.error("[leader/score-rules] audit log failed", { code: auditError.code });
  }

  return NextResponse.json({ rules: data ?? [] });
}
