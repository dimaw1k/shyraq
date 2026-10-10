import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const MAX_SETTINGS_BODY_BYTES = 32 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_TEAM_CAPACITY = 1000;
const ALLOWED_RULE_CODES = ["TASKS", "TESTS", "VIDEO", "ATTENDANCE", "REPORTS", "STREAK"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validReportTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function GET() {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const admin = createAdminSupabaseClient();

  const [{ data: settings, error: settingsError }, { data: rules, error: rulesError }] =
    await Promise.all([
      admin
        .from("marathon_settings")
        .select("name,default_video_watch_percent,default_team_capacity,morning_report_open_time,evening_report_open_time,updated_at")
        .eq("id", true)
        .maybeSingle(),
      admin
        .from("score_rules")
        .select("id,code,label,weight,active,updated_at")
        .in("code", [...ALLOWED_RULE_CODES])
        .order("code"),
    ]);

  if (settingsError || rulesError) {
    console.error("[chief-mentor/settings] load failed", {
      settingsCode: settingsError?.code,
      rulesCode: rulesError?.code,
    });
    return NextResponse.json({ error: "Баптауларды жүктеу сәтсіз аяқталды." }, { status: 500 });
  }
  if (!settings) {
    return NextResponse.json({ error: "Марафон баптаулары табылмады." }, { status: 404 });
  }

  return NextResponse.json({ profile, settings, rules: rules ?? [] });
}

export async function PATCH(request: Request) {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const rateLimit = await consumeRateLimit("chief-mentor:settings-update", profile.id, 10, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Баптауларды өзгерту әрекеттері уақытша шектелді.");
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_SETTINGS_BODY_BYTES)
  ) {
    return NextResponse.json(
      { error: "Баптау деректері тым үлкен." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsedBody = await readLimitedJson(request, MAX_SETTINGS_BODY_BYTES);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Баптау деректері тым үлкен." : "Баптау деректерінің пішімі дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!isObject(parsedBody.value)) {
    return NextResponse.json({ error: "Баптау деректерінің пішімі дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value;

  const admin = createAdminSupabaseClient();
  let settingsUpdate: Record<string, string | number> | null = null;

  if (body.settings !== undefined) {
    if (!isObject(body.settings)) {
      return NextResponse.json({ error: "Марафон баптауларының пішімі дұрыс емес." }, { status: 400 });
    }

    const input = body.settings;
    const next: Record<string, string | number> = {};

    if (input.name !== undefined) {
      if (typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > MAX_NAME_LENGTH) {
        return NextResponse.json({ error: "Атауы 1–120 таңба аралығында болуы керек." }, { status: 400 });
      }
      next.name = input.name.trim();
    }

    if (input.defaultVideoWatchPercent !== undefined) {
      if (!validNumber(input.defaultVideoWatchPercent) || input.defaultVideoWatchPercent < 1 || input.defaultVideoWatchPercent > 100) {
        return NextResponse.json({ error: "Видео көру пайызы 1–100 аралығында болуы керек." }, { status: 400 });
      }
      next.default_video_watch_percent = input.defaultVideoWatchPercent;
    }

    if (input.defaultTeamCapacity !== undefined) {
      if (!validNumber(input.defaultTeamCapacity) || !Number.isInteger(input.defaultTeamCapacity) || input.defaultTeamCapacity < 1 || input.defaultTeamCapacity > MAX_TEAM_CAPACITY) {
        return NextResponse.json({ error: "Команда сыйымдылығы 1–1000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
      }
      next.default_team_capacity = input.defaultTeamCapacity;
    }

    if (input.morningReportOpenTime !== undefined) {
      if (!validReportTime(input.morningReportOpenTime)) {
        return NextResponse.json({ error: "Таңғы есеп уақыты дұрыс емес." }, { status: 400 });
      }
      next.morning_report_open_time = input.morningReportOpenTime;
    }

    if (input.eveningReportOpenTime !== undefined) {
      if (!validReportTime(input.eveningReportOpenTime)) {
        return NextResponse.json({ error: "Кешкі есеп уақыты дұрыс емес." }, { status: 400 });
      }
      next.evening_report_open_time = input.eveningReportOpenTime;
    }

    if (Object.keys(next).length === 0) {
      return NextResponse.json({ error: "Өзгертілетін марафон баптаулары жіберілмеді." }, { status: 400 });
    }

    settingsUpdate = next;
  }

  let validatedRules: Array<{ id: string; code: (typeof ALLOWED_RULE_CODES)[number]; weight: number; active: boolean }> | null = null;

  if (body.rules !== undefined) {
    if (!Array.isArray(body.rules) || body.rules.length === 0 || body.rules.length > ALLOWED_RULE_CODES.length) {
      return NextResponse.json({ error: "Ұпай ережелерінің тізімі дұрыс емес." }, { status: 400 });
    }

    const { data: currentRules, error: currentRulesError } = await admin
      .from("score_rules")
      .select("id,code")
      .in("code", [...ALLOWED_RULE_CODES]);

    if (currentRulesError) {
      console.error("[chief-mentor/settings] rule lookup failed", { code: currentRulesError.code });
      return NextResponse.json({ error: "Ұпай ережелерін тексеру мүмкін болмады." }, { status: 500 });
    }

    const idByCode = new Map((currentRules ?? []).map((rule) => [rule.code, rule.id]));
    const seenCodes = new Set<string>();
    const normalized: Array<{ id: string; code: (typeof ALLOWED_RULE_CODES)[number]; weight: number; active: boolean }> = [];

    for (const item of body.rules) {
      if (!isObject(item) || typeof item.code !== "string" || typeof item.id !== "string") {
        return NextResponse.json({ error: "Ұпай ережесінің пішімі дұрыс емес." }, { status: 400 });
      }

      if (!ALLOWED_RULE_CODES.includes(item.code as (typeof ALLOWED_RULE_CODES)[number]) || seenCodes.has(item.code)) {
        return NextResponse.json({ error: "Ұпай ережесінің коды жарамсыз немесе қайталанған." }, { status: 400 });
      }
      if (idByCode.get(item.code) !== item.id) {
        return NextResponse.json({ error: "Ұпай ережесінің идентификаторы сәйкес келмейді." }, { status: 400 });
      }
      if (!validNumber(item.weight) || item.weight < 0 || item.weight > 10000) {
        return NextResponse.json({ error: "Ұпай салмағы 0–10000 аралығында болуы керек." }, { status: 400 });
      }
      if (typeof item.active !== "boolean") {
        return NextResponse.json({ error: "Ұпай ережесінің белсенді күйі дұрыс емес." }, { status: 400 });
      }

      seenCodes.add(item.code);
      normalized.push({
        id: item.id,
        code: item.code as (typeof ALLOWED_RULE_CODES)[number],
        weight: Number(item.weight.toFixed(2)),
        active: item.active,
      });
    }

    validatedRules = normalized;
  }

  if (!settingsUpdate && !validatedRules) {
    return NextResponse.json({ error: "Сақталатын өзгеріс жоқ." }, { status: 400 });
  }

  if (settingsUpdate) {
    const { data: updatedSettings, error: settingsError } = await admin
      .from("marathon_settings")
      .update({ ...settingsUpdate, updated_at: new Date().toISOString() })
      .eq("id", true)
      .select("id")
      .maybeSingle();

    if (settingsError || !updatedSettings) {
      console.error("[chief-mentor/settings] update failed", { code: settingsError?.code });
      return NextResponse.json({ error: "Марафон баптауларын сақтау сәтсіз аяқталды." }, { status: 500 });
    }
  }

  if (validatedRules) {
    for (const rule of validatedRules) {
      const { data: updatedRule, error: ruleError } = await admin
        .from("score_rules")
        .update({
          weight: rule.weight,
          active: rule.active,
          updated_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rule.id)
        .eq("code", rule.code)
        .select("id")
        .maybeSingle();

      if (ruleError || !updatedRule) {
        console.error("[chief-mentor/settings] rule update failed", {
          code: ruleError?.code,
          ruleCode: rule.code,
        });
        return NextResponse.json({ error: "Ұпай ережесін сақтау сәтсіз аяқталды." }, { status: 500 });
      }
    }
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "CHIEF_MENTOR_SETTINGS_UPDATED",
    entity_type: "MARATHON_SETTINGS",
    entity_id: null,
    metadata: {
      settings: settingsUpdate ?? null,
      rulesUpdated: validatedRules?.map((rule) => ({
        code: rule.code,
        weight: rule.weight,
        active: rule.active,
      })) ?? [],
    },
  });

  if (auditError) {
    console.error("[chief-mentor/settings] audit log failed", { code: auditError.code });
  }

  return GET();
}
