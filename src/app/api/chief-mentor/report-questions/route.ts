import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_QUESTION_LENGTH = 1000;
const MAX_SORT_ORDER = 10000;

function parseMarathonDay(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 21) return undefined;
  return value;
}

function parseSortOrder(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_SORT_ORDER) return undefined;
  return value;
}

type ParsedBodyResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: Response };

type MutationAuthorizationResult =
  | { ok: true; profile: Awaited<ReturnType<typeof getAuthenticatedStaff>>["profile"] }
  | { ok: false; response: Response };

async function readLimitedBody(request: Request): Promise<ParsedBodyResult> {
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Есеп сұрағының деректері дұрыс емес." },
        { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return { ok: false, response: NextResponse.json({ error: "Есеп сұрағының деректері дұрыс емес." }, { status: 400 }) };
  }
  return { ok: true, body: parsedBody.value as Record<string, unknown> };
}

async function authorizeMutation(): Promise<MutationAuthorizationResult> {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const rateLimit = await consumeRateLimit("chief-mentor:report-question-write", profile.id, 30, 600, 300);
  if (!rateLimit.available) return { ok: false, response: rateLimitUnavailableResponse() };
  if (!rateLimit.allowed) {
    return { ok: false, response: rateLimitResponse(rateLimit.retryAfterSeconds, "Есеп сұрақтарын өзгерту әрекеттері тым жиі орындалды.") };
  }
  return { ok: true, profile };
}

export async function GET() {
  const { profile } = await getAuthenticatedStaff(["MENTOR", "CHIEF_MENTOR", "LEADER"]);
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("daily_report_questions")
    .select("*")
    .order("marathon_day")
    .order("sort_order");
  if (error) return NextResponse.json({ error: "Report сұрақтарын жүктеу сәтсіз." }, { status: 500 });
  return NextResponse.json({ actor: profile.role, questions: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const authorization = await authorizeMutation();
  if (!authorization.ok) return authorization.response;
  const { profile } = authorization;

  const parsed = await readLimitedBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const fieldKey = typeof body.fieldKey === "string"
    ? body.fieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 80)
    : "";
  const fieldType = body.fieldType;

  if (!question || question.length > MAX_QUESTION_LENGTH || !fieldKey) {
    return NextResponse.json({ error: "Сұрақ 1–1000 таңба және key міндетті." }, { status: 400 });
  }
  if (typeof fieldType !== "string" || !["SHORT_TEXT", "LONG_TEXT", "NUMBER"].includes(fieldType)) {
    return NextResponse.json({ error: "Сұрақ түрі дұрыс емес." }, { status: 400 });
  }
  const marathonDay = parseMarathonDay(body.marathonDay);
  if (marathonDay === undefined) {
    return NextResponse.json({ error: "Күн 1–21 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  const sortOrder = body.sortOrder === undefined ? 0 : parseSortOrder(body.sortOrder);
  if (sortOrder === undefined) {
    return NextResponse.json({ error: "Сұрақ реті 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  if (body.required !== undefined && typeof body.required !== "boolean") {
    return NextResponse.json({ error: "Міндеттілік параметрі дұрыс емес." }, { status: 400 });
  }
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Сұрақ күйі дұрыс емес." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("daily_report_questions")
    .insert({
      question,
      field_key: fieldKey,
      field_type: fieldType,
      marathon_day: marathonDay ?? null,
      required: body.required === true,
      sort_order: sortOrder,
      active: body.active !== false,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.code === "23505" ? "Бұл key осы күнге бұрыннан бар." : "Сұрақ сақталмады." }, { status: error.code === "23505" ? 409 : 500 });
  }
  if (!data) return NextResponse.json({ error: "Сұрақ сақталмады." }, { status: 500 });

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "REPORT_QUESTION_CREATED",
    entity_type: "DAILY_REPORT_QUESTION",
    entity_id: data.id,
    metadata: { field_key: data.field_key, marathon_day: data.marathon_day },
  });
  if (auditError) console.error("[report-questions] create audit failed", { code: auditError.code });

  return NextResponse.json({ question: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const authorization = await authorizeMutation();
  if (!authorization.ok) return authorization.response;
  const { profile } = authorization;

  const parsed = await readLimitedBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const id = typeof body.id === "string" ? body.id : "";
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Question ID дұрыс емес." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.question !== undefined) {
    if (typeof body.question !== "string" || !body.question.trim() || body.question.trim().length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: "Сұрақ 1–1000 таңба болуы керек." }, { status: 400 });
    }
    updates.question = body.question.trim();
  }
  if (body.required !== undefined) {
    if (typeof body.required !== "boolean") return NextResponse.json({ error: "Міндеттілік параметрі дұрыс емес." }, { status: 400 });
    updates.required = body.required;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") return NextResponse.json({ error: "Сұрақ күйі дұрыс емес." }, { status: 400 });
    updates.active = body.active;
  }
  if (body.sortOrder !== undefined) {
    const sortOrder = parseSortOrder(body.sortOrder);
    if (sortOrder === undefined) return NextResponse.json({ error: "Сұрақ реті 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
    updates.sort_order = sortOrder;
  }
  if (body.marathonDay !== undefined) {
    const marathonDay = parseMarathonDay(body.marathonDay);
    if (marathonDay === undefined) return NextResponse.json({ error: "Күн 1–21 аралығындағы бүтін сан болуы керек." }, { status: 400 });
    updates.marathon_day = marathonDay;
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Өзгертілетін өріс жіберілмеді." }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("daily_report_questions")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Сұрақ жаңартылмады." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Сұрақ табылмады." }, { status: 404 });

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "REPORT_QUESTION_UPDATED",
    entity_type: "DAILY_REPORT_QUESTION",
    entity_id: id,
    metadata: { changes: Object.keys(updates), active: data.active },
  });
  if (auditError) console.error("[report-questions] update audit failed", { code: auditError.code });

  return NextResponse.json({ question: data });
}

export async function DELETE(request: Request) {
  const authorization = await authorizeMutation();
  if (!authorization.ok) return authorization.response;
  const { profile } = authorization;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Question ID дұрыс емес." }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from("daily_report_questions")
    .select("id,field_key,marathon_day")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "Сұрақты тексеру сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Сұрақ табылмады." }, { status: 404 });

  const { data: deleted, error } = await admin
    .from("daily_report_questions")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Сұрақ өшірілмеді." }, { status: 500 });
  if (!deleted) return NextResponse.json({ error: "Сұрақ басқа қызметкермен өңделді." }, { status: 409 });

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "REPORT_QUESTION_DELETED",
    entity_type: "DAILY_REPORT_QUESTION",
    entity_id: id,
    metadata: { field_key: current.field_key, marathon_day: current.marathon_day },
  });
  if (auditError) console.error("[report-questions] delete audit failed", { code: auditError.code });

  return NextResponse.json({ ok: true });
}
