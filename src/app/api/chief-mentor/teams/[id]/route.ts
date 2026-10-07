import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const STATUSES = new Set(["ACTIVE", "INACTIVE"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;

  let body: { name?: string; mentorId?: string | null; capacity?: number; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from("teams")
    .select("id,name,mentor_id,capacity,status")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ error: "Команданы жүктеу сәтсіз аяқталды." }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: "Команда табылмады." }, { status: 404 });
  }

  const nextName =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : current.name;

  const nextMentorId =
    body.mentorId === null || body.mentorId === ""
      ? null
      : typeof body.mentorId === "string"
        ? body.mentorId
        : current.mentor_id;

  if (nextMentorId) {
    const { data: mentor } = await admin
      .from("profiles")
      .select("id,role")
      .eq("id", nextMentorId)
      .maybeSingle();

    if (!mentor || mentor.role !== "MENTOR") {
      return NextResponse.json({ error: "Командаға тек MENTOR рөліндегі қызметкерді бекітуге болады." }, { status: 400 });
    }
  }

  const nextCapacity =
    typeof body.capacity === "number" && Number.isFinite(body.capacity)
      ? Math.max(1, Math.floor(body.capacity))
      : Number(current.capacity ?? 70);

  const { count: activeStudentCount } = await admin
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", id)
    .eq("status", "ACTIVE");

  if (Number(activeStudentCount ?? 0) > nextCapacity) {
    return NextResponse.json(
      {
        error:
          "Сыйымдылықты командадағы қазіргі оқушылар санынан төмен қоюға болмайды.",
      },
      { status: 409 },
    );
  }

  const nextStatus = typeof body.status === "string" ? body.status : current.status;
  if (!STATUSES.has(nextStatus)) {
    return NextResponse.json({ error: "Жарамсыз команда статусы." }, { status: 400 });
  }

  const { data: updated, error: updateError } = await admin
    .from("teams")
    .update({
      name: nextName,
      mentor_id: nextMentorId,
      capacity: nextCapacity,
      status: nextStatus,
    })
    .eq("id", id)
    .select("id,name,mentor_id,capacity,status,updated_at")
    .single();

  if (updateError || !updated) {
    if (updateError?.code === "23505") {
      return NextResponse.json({ error: "Бұл команда атауы бұрыннан бар." }, { status: 409 });
    }
    return NextResponse.json({ error: "Команданы жаңарту сәтсіз аяқталды." }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "TEAM_UPDATED",
    entity_type: "TEAM",
    entity_id: id,
    metadata: {
      changes: {
        name: [current.name, updated.name],
        mentor_id: [current.mentor_id, updated.mentor_id],
        capacity: [current.capacity, updated.capacity],
        status: [current.status, updated.status],
      },
    },
  });

  return NextResponse.json({ team: updated });
}
