import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TASK_TITLE_LENGTH = 120;
const MAX_TASK_DESCRIPTION_LENGTH = 5000;
const MAX_TASK_INSTRUCTIONS_LENGTH = 10000;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const rateLimit = await consumeRateLimit("chief-mentor:task-update", profile.id, 30, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Тапсырма өзгерістері тым жиі жіберілді.");
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Тапсырма идентификаторы дұрыс емес." }, { status: 400 });
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

  if (body.title !== undefined && (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > MAX_TASK_TITLE_LENGTH
  )) {
    return NextResponse.json({ error: "Тапсырма атауы 1–120 таңба болуы керек." }, { status: 400 });
  }
  if (body.description !== undefined && body.description !== null && (
    typeof body.description !== "string" || body.description.length > MAX_TASK_DESCRIPTION_LENGTH
  )) {
    return NextResponse.json({ error: "Тапсырма сипаттамасы 5000 таңбадан аспауы керек." }, { status: 400 });
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
  if (body.maxFiles !== undefined && (
    typeof body.maxFiles !== "number" || !Number.isInteger(body.maxFiles) || body.maxFiles < 1 || body.maxFiles > 10
  )) {
    return NextResponse.json({ error: "Файл саны 1–10 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  if (body.latePointsPercent !== undefined && (
    typeof body.latePointsPercent !== "number" || !Number.isInteger(body.latePointsPercent) || body.latePointsPercent < 0 || body.latePointsPercent > 100
  )) {
    return NextResponse.json({ error: "Кеш тапсырғандағы ұпай пайызы 0–100 аралығында болуы керек." }, { status: 400 });
  }
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Тапсырма күйі дұрыс емес." }, { status: 400 });
  }
  if (body.taskOrder !== undefined && (
    typeof body.taskOrder !== "number" || !Number.isInteger(body.taskOrder) || body.taskOrder < 0 || body.taskOrder > 10000
  )) {
    return NextResponse.json({ error: "Тапсырма реті 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  if (body.marathonDay !== undefined && body.marathonDay !== null && body.marathonDay !== "" && (
    typeof body.marathonDay !== "number" || !Number.isInteger(body.marathonDay) || body.marathonDay < 1 || body.marathonDay > 21
  )) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  for (const field of ["startsAt", "deadline"] as const) {
    const value = body[field];
    if (value !== undefined && value !== null && value !== "" && (
      typeof value !== "string" || !Number.isFinite(Date.parse(value))
    )) {
      return NextResponse.json({ error: field === "startsAt" ? "Басталу уақыты дұрыс емес." : "Соңғы мерзім дұрыс емес." }, { status: 400 });
    }
  }

  const rawTeamId = body.teamId;
  if (rawTeamId !== undefined && rawTeamId !== null && rawTeamId !== "" && (
    typeof rawTeamId !== "string" || !UUID_RE.test(rawTeamId)
  )) {
    return NextResponse.json({ error: "Команда идентификаторы дұрыс емес." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: current, error: currentError } = await admin
    .from("tasks")
    .select("id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,active")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "Тапсырманы жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Тапсырма табылмады." }, { status: 404 });

  const nextTeamId =
    body?.teamId === null || body?.teamId === ""
      ? null
      : typeof body?.teamId === "string"
        ? body.teamId
        : current.team_id;

  const nextDay =
    body?.marathonDay === null || body?.marathonDay === ""
      ? null
      : typeof body?.marathonDay === "number"
        ? Math.floor(body.marathonDay)
        : current.marathon_day;

  if (nextDay !== null && (nextDay < 1 || nextDay > 21)) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығында болуы керек." }, { status: 400 });
  }

  if (nextTeamId && body.teamId !== undefined) {
    const { data: team, error: teamError } = await admin
      .from("teams")
      .select("id,status")
      .eq("id", nextTeamId)
      .maybeSingle();
    if (teamError) return NextResponse.json({ error: "Команданы тексеру сәтсіз аяқталды." }, { status: 500 });
    if (!team || team.status !== "ACTIVE") {
      return NextResponse.json({ error: "Белсенді команда табылмады." }, { status: 400 });
    }
  }

  const nextPoints =
    typeof body?.points === "number" && Number.isFinite(body.points)
      ? Math.max(0, body.points)
      : Number(current.points ?? 0);

  const nextMaxFiles =
    typeof body?.maxFiles === "number" && Number.isFinite(body.maxFiles)
      ? Math.max(1, Math.min(10, Math.floor(body.maxFiles)))
      : Number(current.max_files ?? 5);

  const nextLatePointsPercent =
    typeof body?.latePointsPercent === "number" && Number.isFinite(body.latePointsPercent)
      ? Math.max(0, Math.min(100, Math.floor(body.latePointsPercent)))
      : Number(current.late_points_percent ?? 100);

  const nextStartsAt = body?.startsAt === null || body?.startsAt === ""
    ? null
    : typeof body?.startsAt === "string"
      ? body.startsAt
      : current.starts_at;
  const nextDeadline = body?.deadline === null || body?.deadline === ""
    ? null
    : typeof body?.deadline === "string"
      ? body.deadline
      : current.deadline;
  if (nextStartsAt && nextDeadline && Date.parse(nextStartsAt) > Date.parse(nextDeadline)) {
    return NextResponse.json({ error: "Сабақтың басталу уақыты соңғы мерзімнен кейін болмауы керек." }, { status: 400 });
  }

  const { data: updated, error: updateError } = await admin.from("tasks").update({
    title: typeof body?.title === "string" && body.title.trim() ? body.title.trim() : current.title,
    description: typeof body?.description === "string" && body.description.trim() ? body.description.trim() : current.description,
    instructions: body?.instructions === null
      ? null
      : typeof body?.instructions === "string"
        ? body.instructions.trim() || null
        : current.instructions,
    team_id: nextTeamId,
    starts_at: nextStartsAt,
    deadline: nextDeadline,
    points: nextPoints,
    attachment_required: typeof body?.attachmentRequired === "boolean"
      ? body.attachmentRequired
      : current.attachment_required,
    max_files: nextMaxFiles,
    late_points_percent: nextLatePointsPercent,
    marathon_day: nextDay,
    task_order: typeof body?.taskOrder === "number" ? Math.floor(body.taskOrder) : current.task_order,
    active: typeof body?.active === "boolean" ? body.active : current.active,
  }).eq("id", id).select(
    "id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,active,updated_at",
  ).single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Тапсырманы жаңарту сәтсіз аяқталды." }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "TASK_UPDATED",
    entity_type: "TASK",
    entity_id: id,
    metadata: {
      marathon_day: [current.marathon_day, updated.marathon_day],
      starts_at: [current.starts_at, updated.starts_at],
      deadline: [current.deadline, updated.deadline],
      max_files: [current.max_files, updated.max_files],
      late_points_percent: [current.late_points_percent, updated.late_points_percent],
    },
  });

  return NextResponse.json({ task: updated });
}
