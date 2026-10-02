import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;
  const body = await request.json().catch(() => null);
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

  if (nextTeamId) {
    const { data: team } = await admin.from("teams").select("id").eq("id", nextTeamId).maybeSingle();
    if (!team) return NextResponse.json({ error: "Команда табылмады." }, { status: 400 });
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

  const { data: updated, error: updateError } = await admin.from("tasks").update({
    title: typeof body?.title === "string" && body.title.trim() ? body.title.trim() : current.title,
    description: typeof body?.description === "string" && body.description.trim() ? body.description.trim() : current.description,
    instructions: body?.instructions === null
      ? null
      : typeof body?.instructions === "string"
        ? body.instructions.trim() || null
        : current.instructions,
    team_id: nextTeamId,
    starts_at: body?.startsAt === null || body?.startsAt === ""
      ? null
      : typeof body?.startsAt === "string"
        ? body.startsAt
        : current.starts_at,
    deadline: body?.deadline === null || body?.deadline === ""
      ? null
      : typeof body?.deadline === "string"
        ? body.deadline
        : current.deadline,
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
