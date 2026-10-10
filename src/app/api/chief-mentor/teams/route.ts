import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

export async function POST(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Команда деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Команда деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;

  if (typeof body?.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Команда атауы қажет." }, { status: 400 });
  }

  const mentorId = typeof body.mentorId === "string" && body.mentorId ? body.mentorId : null;
  if (mentorId) {
    const { data: mentor } = await supabase.from("profiles").select("id,role").eq("id", mentorId).maybeSingle();
    if (!mentor || mentor.role !== "MENTOR") {
      return NextResponse.json({ error: "Командаға тек менторды бекітуге болады." }, { status: 400 });
    }
  }

  const capacity = typeof body.capacity === "number" ? Math.max(1, Math.floor(body.capacity)) : 70;

  const { data, error } = await supabase.from("teams").insert({
    name: body.name.trim(),
    mentor_id: mentorId,
    capacity,
    status: "ACTIVE",
  }).select("*").single();

  if (error) {
    console.error("team create failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    return NextResponse.json({ error: error.message || "Команданы сақтау сәтсіз аяқталды." }, { status: 400 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "TEAM_CREATED",
    entity_type: "TEAM",
    entity_id: data.id,
    metadata: { name: data.name, mentor_id: data.mentor_id, capacity: data.capacity },
  });

  return NextResponse.json({ team: data });
}
