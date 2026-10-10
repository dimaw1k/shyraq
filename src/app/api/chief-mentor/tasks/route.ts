import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TASK_TITLE_LENGTH = 120;
const MAX_TASK_DESCRIPTION_LENGTH = 5000;
const MAX_TASK_INSTRUCTIONS_LENGTH = 10000;

function parseOptionalDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return undefined;
  return new Date(Date.parse(value)).toISOString();
}

export async function POST(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const rateLimit = await consumeRateLimit("chief-mentor:task-create", profile.id, 20, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Тапсырма құру әрекеттері тым жиі орындалды.");
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Тапсырма деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Тапсырма деректері дұрыс емес." }, { status: 400 });
  }

  const body = parsedBody.value as Record<string, unknown>;
  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > MAX_TASK_TITLE_LENGTH) {
    return NextResponse.json({ error: "Тапсырма атауы 1–120 таңба болуы керек." }, { status: 400 });
  }
  if (
    typeof body.description !== "string" ||
    !body.description.trim() ||
    body.description.trim().length > MAX_TASK_DESCRIPTION_LENGTH
  ) {
    return NextResponse.json({ error: "Тапсырма сипаттамасы 1–5000 таңба болуы керек." }, { status: 400 });
  }
  if (body.instructions !== undefined && body.instructions !== null && (
    typeof body.instructions !== "string" || body.instructions.length > MAX_TASK_INSTRUCTIONS_LENGTH
  )) {
    return NextResponse.json({ error: "Нұсқаулық 10000 таңбадан аспауы керек." }, { status: 400 });
  }
  if (body.points !== undefined && (
    typeof body.points !== "number" || !Number.isFinite(body.points) || body.points < 0 || body.points > 10000
  )) {
    return NextResponse.json({ error: "Ұпай 0–10000 аралығында болуы керек." }, { status: 400 });
  }
  if (body.attachmentRequired !== undefined && typeof body.attachmentRequired !== "boolean") {
    return NextResponse.json({ error: "Файл міндеттілігі параметрі дұрыс емес." }, { status: 400 });
  }
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Тапсырма күйі дұрыс емес." }, { status: 400 });
  }

  const maxFiles = body.maxFiles === undefined || body.maxFiles === "" ? 5 : body.maxFiles;
  if (typeof maxFiles !== "number" || !Number.isInteger(maxFiles) || maxFiles < 1 || maxFiles > 10) {
    return NextResponse.json({ error: "Файл саны 1–10 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }

  const latePointsPercent = body.latePointsPercent === undefined || body.latePointsPercent === "" ? 100 : body.latePointsPercent;
  if (
    typeof latePointsPercent !== "number" ||
    !Number.isFinite(latePointsPercent) ||
    latePointsPercent < 0 ||
    latePointsPercent > 100
  ) {
    return NextResponse.json({ error: "Кеш тапсырғандағы ұпай пайызы 0–100 аралығында болуы керек." }, { status: 400 });
  }

  const marathonDay =
    body.marathonDay === null || body.marathonDay === undefined || body.marathonDay === ""
      ? null
      : body.marathonDay;
  if (marathonDay !== null && (
    typeof marathonDay !== "number" || !Number.isInteger(marathonDay) || marathonDay < 1 || marathonDay > 21
  )) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }

  const taskOrder = body.taskOrder === undefined || body.taskOrder === "" ? 0 : body.taskOrder;
  if (typeof taskOrder !== "number" || !Number.isInteger(taskOrder) || taskOrder < 0 || taskOrder > 10000) {
    return NextResponse.json({ error: "Тапсырма реті 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }

  const rawTeamId = body.teamId;
  let teamId: string | null = null;
  if (rawTeamId !== undefined && rawTeamId !== null && rawTeamId !== "") {
    if (typeof rawTeamId !== "string" || !UUID_RE.test(rawTeamId)) {
      return NextResponse.json({ error: "Команда идентификаторы дұрыс емес." }, { status: 400 });
    }
    teamId = rawTeamId;
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id,status")
      .eq("id", teamId)
      .maybeSingle();
    if (teamError) return NextResponse.json({ error: "Команданы тексеру сәтсіз аяқталды." }, { status: 500 });
    if (!team || team.status !== "ACTIVE") {
      return NextResponse.json({ error: "Белсенді команда табылмады." }, { status: 400 });
    }
  }

  const startsAt = parseOptionalDate(body.startsAt);
  const deadline = parseOptionalDate(body.deadline);
  if ((body.startsAt !== undefined && startsAt === undefined) || (body.deadline !== undefined && deadline === undefined)) {
    return NextResponse.json({ error: "Тапсырма уақыты дұрыс емес." }, { status: 400 });
  }
  if (startsAt && deadline && Date.parse(startsAt) > Date.parse(deadline)) {
    return NextResponse.json({ error: "Соңғы мерзім басталу уақытынан бұрын болмауы керек." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("tasks").insert({
    title: body.title.trim(),
    description: body.description.trim(),
    instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : null,
    team_id: teamId,
    starts_at: startsAt ?? null,
    deadline: deadline ?? null,
    points: typeof body.points === "number" ? body.points : 0,
    attachment_required: body.attachmentRequired === true,
    max_files: maxFiles,
    late_points_percent: latePointsPercent,
    marathon_day: marathonDay,
    task_order: taskOrder,
    active: body.active !== false,
    created_by: profile.id,
  }).select("*").single();

  if (error || !data) {
    console.error("[chief-mentor/tasks] create failed", { code: error?.code ?? "NO_ROW" });
    return NextResponse.json({ error: "Тапсырманы сақтау сәтсіз аяқталды." }, { status: 500 });
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "TASK_CREATED",
    entity_type: "TASK",
    entity_id: data.id,
    metadata: {
      title: data.title,
      points: data.points,
      marathon_day: data.marathon_day,
      starts_at: data.starts_at,
      deadline: data.deadline,
      late_points_percent: data.late_points_percent,
    },
  });
  if (auditError) {
    console.error("[chief-mentor/tasks] audit log failed", { code: auditError.code });
  }

  return NextResponse.json({ task: data }, { status: 201 });
}
