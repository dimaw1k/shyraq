import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

export async function GET() {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const admin = createAdminSupabaseClient();

  const { data: requests, error } = await admin
    .from("mentor_task_requests")
    .select("id,mentor_id,team_id,title,description,instructions,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,status,review_comment,reviewed_at,created_task_id,created_at")
    .eq("status", "REQUESTED")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: "Сұраныстарды жүктеу сәтсіз аяқталды." }, { status: 500 });

  const mentorIds = [...new Set((requests ?? []).map((item) => item.mentor_id))];
  const teamIds = [...new Set((requests ?? []).map((item) => item.team_id))];

  const [{ data: mentors }, { data: teams }] = await Promise.all([
    mentorIds.length ? admin.from("profiles").select("id,full_name").in("id", mentorIds) : Promise.resolve({ data: [] }),
    teamIds.length ? admin.from("teams").select("id,name").in("id", teamIds) : Promise.resolve({ data: [] }),
  ]);

  const mentorMap = new Map((mentors ?? []).map((item) => [item.id, item.full_name]));
  const teamMap = new Map((teams ?? []).map((item) => [item.id, item.name]));

  return NextResponse.json({
    requests: (requests ?? []).map((item) => ({
      ...item,
      mentor_name: mentorMap.get(item.mentor_id) ?? "Ментор",
      team_name: teamMap.get(item.team_id) ?? "Команда",
    })),
    reviewer_role: profile.role,
  });
}

export async function PATCH(request: Request) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) return NextResponse.json({ error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Деректер пішімі дұрыс емес." }, { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } });
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) return NextResponse.json({ error: "Деректер пішімі дұрыс емес." }, { status: 400 });
  const body = parsedBody.value as Record<string, unknown>;
  if (body.updates !== undefined && (!body.updates || typeof body.updates !== "object" || Array.isArray(body.updates))) return NextResponse.json({ error: "Өзгеріс деректері дұрыс емес." }, { status: 400 });
  if (typeof body.reviewComment === "string" && body.reviewComment.length > 3000) return NextResponse.json({ error: "Пікір 3000 таңбадан аспауы керек." }, { status: 400 });
  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
  const status = body?.status === "APPROVED" || body?.status === "REJECTED" ? body.status : null;
  const reviewComment = typeof body?.reviewComment === "string" ? body.reviewComment.trim().slice(0, 3000) : null;
  const updates = body.updates && typeof body.updates === "object" && !Array.isArray(body.updates) ? body.updates as Record<string, unknown> : null;

  if (!requestId || !status) {
    return NextResponse.json({ error: "requestId және status қажет." }, { status: 400 });
  }

  if (status === "REJECTED" && !reviewComment) {
    return NextResponse.json({ error: "Қайтару кезінде комментарий міндетті." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current, error } = await admin
    .from("mentor_task_requests")
    .select("id,mentor_id,team_id,title,description,instructions,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,status,created_task_id")
    .eq("id", requestId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Сұранысты жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Сұраныс табылмады." }, { status: 404 });
  if (current.status !== "REQUESTED") {
    return NextResponse.json({ error: "Бұл сұраныс бұрын өңделген." }, { status: 409 });
  }

  if (status === "REJECTED") {
    const { data: updated, error: updateError } = await admin
      .from("mentor_task_requests")
      .update({
        status: "REJECTED",
        review_comment: reviewComment,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Сұранысты қайтару сәтсіз аяқталды." }, { status: 500 });
    }

    await admin.from("audit_logs").insert({
      actor_id: profile.id,
      actor_role: profile.role,
      action: "MENTOR_TASK_REQUEST_REJECTED",
      entity_type: "MENTOR_TASK_REQUEST",
      entity_id: requestId,
      metadata: { comment: reviewComment, mentor_id: current.mentor_id, team_id: current.team_id },
    });

    return NextResponse.json({ request: updated });
  }

  const nextTitle = typeof updates?.title === "string" && updates.title.trim() ? updates.title.trim() : current.title;
  const nextDescription = typeof updates?.description === "string" ? updates.description.trim() : current.description;
  const nextDeadline = updates?.deadline === null ? null : typeof updates?.deadline === "string" && updates.deadline ? updates.deadline : current.deadline;
  const nextPoints = typeof updates?.points === "number" && Number.isFinite(updates.points) ? Math.max(0, updates.points) : Number(current.points ?? 0);

  const { data: task, error: taskError } = await admin
    .from("tasks")
    .insert({
      title: nextTitle,
      description: nextDescription,
      instructions: current.instructions,
      team_id: current.team_id,
      starts_at: current.starts_at,
      deadline: nextDeadline,
      points: nextPoints,
      attachment_required: Boolean(current.attachment_required),
      max_files: Number(current.max_files ?? 5),
      late_points_percent: Number(current.late_points_percent ?? 100),
      marathon_day: current.marathon_day,
      task_order: Number(current.task_order ?? 0),
      active: true,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "Тапсырманы құру сәтсіз аяқталды." }, { status: 500 });
  }

  const { data: updated, error: updateError } = await admin
    .from("mentor_task_requests")
    .update({
      status: "APPROVED",
      review_comment: reviewComment,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      created_task_id: task.id,
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    await admin.from("tasks").delete().eq("id", task.id);
    return NextResponse.json({ error: "Сұранысты бекіту сәтсіз аяқталды." }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "MENTOR_TASK_REQUEST_APPROVED",
    entity_type: "MENTOR_TASK_REQUEST",
    entity_id: requestId,
    metadata: { task_id: task.id, mentor_id: current.mentor_id, team_id: current.team_id, edited: Boolean(updates), changes: updates },
  });

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "TASK_CREATED_FROM_MENTOR_REQUEST",
    entity_type: "TASK",
    entity_id: task.id,
    metadata: { request_id: requestId, mentor_id: current.mentor_id, team_id: current.team_id },
  });

  return NextResponse.json({ request: updated, task });
}
