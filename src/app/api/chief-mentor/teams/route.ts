import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TEAM_NAME_LENGTH = 80;
const MAX_TEAM_CAPACITY = 1000;

export async function POST(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Команда деректері тым үлкен." : "Команда деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Команда деректері дұрыс емес." }, { status: 400 });
  }

  const body = parsedBody.value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > MAX_TEAM_NAME_LENGTH) {
    return NextResponse.json({ error: "Команда атауы 1–80 таңба болуы керек." }, { status: 400 });
  }

  let mentorId: string | null = null;
  if (body.mentorId !== undefined && body.mentorId !== null && body.mentorId !== "") {
    if (typeof body.mentorId !== "string" || !UUID_RE.test(body.mentorId)) {
      return NextResponse.json({ error: "Ментор идентификаторы дұрыс емес." }, { status: 400 });
    }
    mentorId = body.mentorId;
  }

  if (mentorId) {
    const { data: mentor, error: mentorError } = await supabase
      .from("profiles")
      .select("id,role,status")
      .eq("id", mentorId)
      .maybeSingle();

    if (mentorError) {
      console.error("[chief-mentor/teams] mentor validation failed", { code: mentorError.code });
      return NextResponse.json({ error: "Менторды тексеру сәтсіз аяқталды." }, { status: 500 });
    }
    if (!mentor || mentor.role !== "MENTOR" || mentor.status !== "ACTIVE") {
      return NextResponse.json({ error: "Командаға тек белсенді менторды бекітуге болады." }, { status: 400 });
    }
  }

  let capacity = 70;
  if (body.capacity !== undefined) {
    if (
      typeof body.capacity !== "number" ||
      !Number.isInteger(body.capacity) ||
      body.capacity < 1 ||
      body.capacity > MAX_TEAM_CAPACITY
    ) {
      return NextResponse.json({ error: "Команда сыйымдылығы 1–1000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
    }
    capacity = body.capacity;
  }

  const { data, error } = await supabase.from("teams").insert({
    name,
    mentor_id: mentorId,
    capacity,
    status: "ACTIVE",
  }).select("*").single();

  if (error) {
    console.error("[chief-mentor/teams] create failed", { code: error.code });
    if (error.code === "23505") {
      return NextResponse.json({ error: "Бұл команда атауы бұрыннан бар." }, { status: 409 });
    }
    return NextResponse.json({ error: "Команданы сақтау сәтсіз аяқталды." }, { status: 400 });
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "TEAM_CREATED",
    entity_type: "TEAM",
    entity_id: data.id,
    metadata: { name: data.name, mentor_id: data.mentor_id, capacity: data.capacity },
  });
  if (auditError) {
    console.error("[chief-mentor/teams] audit log failed", { code: auditError.code });
  }

  return NextResponse.json({ team: data });
}
