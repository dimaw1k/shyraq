import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function POST(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const body = await request.json().catch(() => null);

  if (typeof body?.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Тапсырма атауы қажет." }, { status: 400 });
  }
  if (typeof body?.description !== "string" || !body.description.trim()) {
    return NextResponse.json({ error: "Тапсырма сипаттамасы қажет." }, { status: 400 });
  }

  const { data, error } = await supabase.from("tasks").insert({
    title: body.title.trim(),
    description: body.description.trim(),
    instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : null,
    team_id: typeof body.teamId === "string" && body.teamId ? body.teamId : null,
    starts_at: typeof body.startsAt === "string" && body.startsAt ? body.startsAt : null,
    deadline: typeof body.deadline === "string" && body.deadline ? body.deadline : null,
    points: typeof body.points === "number" ? Math.max(0, body.points) : 0,
    attachment_required: Boolean(body.attachmentRequired),
    active: body.active !== false,
    created_by: profile.id,
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Тапсырманы сақтау сәтсіз аяқталды." }, { status: 400 });

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "TASK_CREATED",
    entity_type: "TASK",
    entity_id: data.id,
    metadata: { title: data.title, points: data.points },
  });

  return NextResponse.json({ task: data });
}
