import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

export async function POST(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
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

  if (typeof body?.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Тапсырма атауы қажет." }, { status: 400 });
  }
  if (typeof body?.description !== "string" || !body.description.trim()) {
    return NextResponse.json({ error: "Тапсырма сипаттамасы қажет." }, { status: 400 });
  }

  const marathonDay =
    body.marathonDay === null || body.marathonDay === undefined || body.marathonDay === ""
      ? null
      : Number(body.marathonDay);

  if (marathonDay !== null && (!Number.isInteger(marathonDay) || marathonDay < 1 || marathonDay > 21)) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығында болуы керек." }, { status: 400 });
  }

  const maxFiles =
    body.maxFiles === undefined || body.maxFiles === ""
      ? 5
      : Math.max(1, Math.min(10, Number(body.maxFiles)));
  const latePointsPercent =
    body.latePointsPercent === undefined || body.latePointsPercent === ""
      ? 100
      : Math.max(0, Math.min(100, Number(body.latePointsPercent)));

  const { data, error } = await supabase.from("tasks").insert({
    title: body.title.trim(),
    description: body.description.trim(),
    instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : null,
    team_id: typeof body.teamId === "string" && body.teamId ? body.teamId : null,
    starts_at: typeof body.startsAt === "string" && body.startsAt ? body.startsAt : null,
    deadline: typeof body.deadline === "string" && body.deadline ? body.deadline : null,
    points: typeof body.points === "number" ? Math.max(0, body.points) : 0,
    attachment_required: Boolean(body.attachmentRequired),
    max_files: maxFiles,
    late_points_percent: latePointsPercent,
    marathon_day: marathonDay,
    task_order: typeof body.taskOrder === "number" ? Math.floor(body.taskOrder) : 0,
    active: body.active !== false,
    created_by: profile.id,
  }).select("*").single();

  if (error) {
    return NextResponse.json({ error: "Тапсырманы сақтау сәтсіз аяқталды." }, { status: 400 });
  }

  await supabase.from("audit_logs").insert({
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

  return NextResponse.json({ task: data });
}
