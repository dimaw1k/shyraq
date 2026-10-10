import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

const STATUSES = new Set(["ACTIVE", "INACTIVE"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TEAM_NAME_LENGTH = 80;
const MAX_TEAM_CAPACITY = 1000;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Команда идентификаторы дұрыс емес." }, { status: 400 });
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "JSON деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Деректер дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;

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

  let nextName = current.name;
  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      return NextResponse.json({ error: "Команда атауы дұрыс емес." }, { status: 400 });
    }
    nextName = body.name.trim();
    if (!nextName || nextName.length > MAX_TEAM_NAME_LENGTH) {
      return NextResponse.json({ error: "Команда атауы 1–80 таңба болуы керек." }, { status: 400 });
    }
  }

  let nextMentorId = current.mentor_id as string | null;
  if (body.mentorId !== undefined) {
    if (body.mentorId === null || body.mentorId === "") {
      nextMentorId = null;
    } else if (typeof body.mentorId === "string" && UUID_RE.test(body.mentorId)) {
      nextMentorId = body.mentorId;
    } else {
      return NextResponse.json({ error: "Ментор идентификаторы дұрыс емес." }, { status: 400 });
    }
  }

  if (nextMentorId) {
    const { data: mentor } = await admin
      .from("profiles")
      .select("id,role,status")
      .eq("id", nextMentorId)
      .maybeSingle();

    if (!mentor || mentor.role !== "MENTOR" || mentor.status !== "ACTIVE") {
      return NextResponse.json({ error: "Командаға тек белсенді MENTOR рөліндегі қызметкерді бекітуге болады." }, { status: 400 });
    }
  }

  let nextCapacity = Number(current.capacity ?? 70);
  if (body.capacity !== undefined) {
    if (
      typeof body.capacity !== "number" ||
      !Number.isInteger(body.capacity) ||
      body.capacity < 1 ||
      body.capacity > MAX_TEAM_CAPACITY
    ) {
      return NextResponse.json({ error: "Команда сыйымдылығы 1–1000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
    }
    nextCapacity = body.capacity;
  }

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

  let nextStatus = current.status;
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Жарамсыз команда статусы." }, { status: 400 });
    }
    nextStatus = body.status;
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

  const { error: auditError } = await admin.from("audit_logs").insert({
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
  if (auditError) {
    console.error("[chief-mentor/teams] update audit failed", { code: auditError.code });
  }

  return NextResponse.json({ team: updated });
}
