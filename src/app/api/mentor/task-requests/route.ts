import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const MAX_TASK_TITLE_LENGTH = 120;
const MAX_TASK_DESCRIPTION_LENGTH = 5000;
const MAX_TASK_INSTRUCTIONS_LENGTH = 5000;
const MAX_TASK_POINTS = 10000;
const MAX_TASK_ORDER = 10000;

function parseOptionalDate(value: unknown): { valid: boolean; value: string | null } | null {
  if (value === undefined) return null;
  if (value === null || value === "") return { valid: true, value: null };
  if (typeof value !== "string") return { valid: false, value: null };
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return { valid: false, value: null };
  return { valid: true, value: new Date(timestamp).toISOString() };
}


export async function GET() {
  const { profile } = await getAuthenticatedStaff("MENTOR");
  const admin = createAdminSupabaseClient();

  const { data: rows, error } = await admin
    .from("mentor_task_requests")
    .select("id,team_id,title,description,instructions,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,status,review_comment,reviewed_at,created_task_id,created_at")
    .eq("mentor_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Сұраныстарды жүктеу сәтсіз аяқталды." }, { status: 500 });
  return NextResponse.json({ requests: rows ?? [] });
}

export async function POST(request: Request) {
  const { profile } = await getAuthenticatedStaff("MENTOR");
  const rateLimit = await consumeRateLimit("mentor:task-request-create", profile.id, 10, 60 * 60, 60 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Тапсырма сұраныстары тым жиі жіберілді. Кейінірек қайта көріңіз.");
  }
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Тапсырма сұранысының деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Тапсырма сұранысының деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;
  const admin = createAdminSupabaseClient();

  const { data: team, error: teamError } = await admin
    .from("teams")
    .select("id")
    .eq("mentor_id", profile.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (teamError) return NextResponse.json({ error: "Команданы тексеру сәтсіз аяқталды." }, { status: 500 });
  if (!team) return NextResponse.json({ error: "Белсенді команда жоқ." }, { status: 409 });

  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > MAX_TASK_TITLE_LENGTH) {
    return NextResponse.json({ error: "Тапсырма атауы 1–120 таңба болуы керек." }, { status: 400 });
  }
  if (typeof body.description !== "string" || !body.description.trim() || body.description.trim().length > MAX_TASK_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: "Тапсырма сипаттамасы 1–5000 таңба болуы керек." }, { status: 400 });
  }

  if (body.instructions !== undefined && body.instructions !== null && (
    typeof body.instructions !== "string" || body.instructions.trim().length > MAX_TASK_INSTRUCTIONS_LENGTH
  )) {
    return NextResponse.json({ error: "Нұсқаулық 5000 таңбадан аспауы керек." }, { status: 400 });
  }
  const instructions = typeof body.instructions === "string" ? body.instructions.trim() || null : null;

  const marathonDay =
    body.marathonDay === null || body.marathonDay === undefined || body.marathonDay === ""
      ? null
      : body.marathonDay;
  if (marathonDay !== null && (
    typeof marathonDay !== "number" || !Number.isInteger(marathonDay) || marathonDay < 1 || marathonDay > 21
  )) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }

  const maxFiles = body.maxFiles === undefined || body.maxFiles === "" ? 5 : body.maxFiles;
  if (typeof maxFiles !== "number" || !Number.isInteger(maxFiles) || maxFiles < 1 || maxFiles > 10) {
    return NextResponse.json({ error: "Файл саны 1–10 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }

  const latePointsPercent = body.latePointsPercent === undefined || body.latePointsPercent === "" ? 100 : body.latePointsPercent;
  if (
    typeof latePointsPercent !== "number" || !Number.isFinite(latePointsPercent) ||
    latePointsPercent < 0 || latePointsPercent > 100
  ) {
    return NextResponse.json({ error: "Кеш тапсырғандағы ұпай пайызы 0–100 аралығында болуы керек." }, { status: 400 });
  }

  const points = body.points === undefined || body.points === "" ? 0 : body.points;
  if (typeof points !== "number" || !Number.isFinite(points) || points < 0 || points > MAX_TASK_POINTS) {
    return NextResponse.json({ error: "Ұпай 0–10000 аралығында болуы керек." }, { status: 400 });
  }

  const attachmentRequired = body.attachmentRequired === undefined ? false : body.attachmentRequired;
  if (typeof attachmentRequired !== "boolean") {
    return NextResponse.json({ error: "Файл міндеттілігі параметрі дұрыс емес." }, { status: 400 });
  }

  const taskOrder = body.taskOrder === undefined || body.taskOrder === "" ? 0 : body.taskOrder;
  if (typeof taskOrder !== "number" || !Number.isInteger(taskOrder) || taskOrder < 0 || taskOrder > MAX_TASK_ORDER) {
    return NextResponse.json({ error: "Тапсырма реті 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }

  const startDate = parseOptionalDate(body.startsAt);
  const deadlineDate = parseOptionalDate(body.deadline);
  if ((startDate && !startDate.valid) || (deadlineDate && !deadlineDate.valid)) {
    return NextResponse.json({ error: "Тапсырма уақыты дұрыс емес." }, { status: 400 });
  }
  const startsAt = startDate?.value ?? null;
  const deadline = deadlineDate?.value ?? null;
  if (startsAt && deadline && Date.parse(startsAt) > Date.parse(deadline)) {
    return NextResponse.json({ error: "Соңғы мерзім басталу уақытынан бұрын болмауы керек." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("mentor_task_requests")
    .insert({
      mentor_id: profile.id,
      team_id: team.id,
      title: body.title.trim(),
      description: body.description.trim().slice(0, 5000),
      instructions,
      starts_at: startsAt,
      deadline,
      points,
      attachment_required: attachmentRequired,
      max_files: maxFiles,
      late_points_percent: latePointsPercent,
      marathon_day: marathonDay,
      task_order: typeof body.taskOrder === "number" ? Math.floor(body.taskOrder) : 0,
    })
    .select("id,team_id,title,description,instructions,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,status,review_comment,reviewed_at,created_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Тапсырма сұранысын сақтау сәтсіз аяқталды." }, { status: 500 });

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "MENTOR_TASK_REQUESTED",
    entity_type: "MENTOR_TASK_REQUEST",
    entity_id: data.id,
    metadata: { team_id: team.id, title: data.title },
  });

  return NextResponse.json({ request: data });
}
