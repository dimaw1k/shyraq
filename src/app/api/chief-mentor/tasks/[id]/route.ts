import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;

  let body: {
    title?: string;
    description?: string;
    instructions?: string | null;
    teamId?: string | null;
    startsAt?: string | null;
    deadline?: string | null;
    points?: number;
    attachmentRequired?: boolean;
    active?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from("tasks")
    .select("id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,active")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "Тапсырманы жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Тапсырма табылмады." }, { status: 404 });

  const nextTitle = typeof body.title === "string" && body.title.trim() ? body.title.trim() : current.title;
  const nextDescription =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : current.description;

  const nextTeamId =
    body.teamId === null || body.teamId === ""
      ? null
      : typeof body.teamId === "string"
        ? body.teamId
        : current.team_id;

  if (nextTeamId) {
    const { data: team } = await admin.from("teams").select("id").eq("id", nextTeamId).maybeSingle();
    if (!team) return NextResponse.json({ error: "Команда табылмады." }, { status: 400 });
  }

  const nextPoints =
    typeof body.points === "number" && Number.isFinite(body.points)
      ? Math.max(0, body.points)
      : Number(current.points ?? 0);

  const { data: updated, error: updateError } = await admin
    .from("tasks")
    .update({
      title: nextTitle,
      description: nextDescription,
      instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : body.instructions === null ? null : current.instructions,
      team_id: nextTeamId,
      starts_at: body.startsAt === null || body.startsAt === "" ? null : typeof body.startsAt === "string" ? body.startsAt : current.starts_at,
      deadline: body.deadline === null || body.deadline === "" ? null : typeof body.deadline === "string" ? body.deadline : current.deadline,
      points: nextPoints,
      attachment_required:
        typeof body.attachmentRequired === "boolean" ? body.attachmentRequired : current.attachment_required,
      active: typeof body.active === "boolean" ? body.active : current.active,
    })
    .eq("id", id)
    .select("id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,active,updated_at")
    .single();

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
      changes: {
        title: [current.title, updated.title],
        team_id: [current.team_id, updated.team_id],
        deadline: [current.deadline, updated.deadline],
        points: [current.points, updated.points],
        active: [current.active, updated.active],
      },
    },
  });

  return NextResponse.json({ task: updated });
}
