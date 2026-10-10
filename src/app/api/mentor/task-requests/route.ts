import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

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

  const { data: team } = await admin
    .from("teams")
    .select("id")
    .eq("mentor_id", profile.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Белсенді команда жоқ." }, { status: 409 });

  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 120) {
    return NextResponse.json({ error: "Тапсырма атауы қажет." }, { status: 400 });
  }
  if (typeof body.description !== "string" || !body.description.trim() || body.description.trim().length > 5000) {
    return NextResponse.json({ error: "Тапсырма сипаттамасы қажет." }, { status: 400 });
  }

  const marathonDay =
    body.marathonDay === null || body.marathonDay === undefined || body.marathonDay === ""
      ? null
      : Number(body.marathonDay);

  if (marathonDay !== null && (!Number.isInteger(marathonDay) || marathonDay < 1 || marathonDay > 21)) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығында болуы керек." }, { status: 400 });
  }

  const maxFiles = body.maxFiles === undefined || body.maxFiles === ""
    ? 5
    : Math.max(1, Math.min(10, Number(body.maxFiles)));

  const latePointsPercent = body.latePointsPercent === undefined || body.latePointsPercent === ""
    ? 100
    : Math.max(0, Math.min(100, Number(body.latePointsPercent)));

  const { data, error } = await admin
    .from("mentor_task_requests")
    .insert({
      mentor_id: profile.id,
      team_id: team.id,
      title: body.title.trim().slice(0, 200),
      description: body.description.trim().slice(0, 5000),
      instructions: typeof body.instructions === "string" ? body.instructions.trim().slice(0, 5000) || null : null,
      starts_at: typeof body.startsAt === "string" && body.startsAt ? body.startsAt : null,
      deadline: typeof body.deadline === "string" && body.deadline ? body.deadline : null,
      points: typeof body.points === "number" ? Math.max(0, body.points) : 0,
      attachment_required: Boolean(body.attachmentRequired),
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
