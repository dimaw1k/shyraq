import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function POST(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const body = await request.json().catch(() => null);

  if (typeof body?.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Команда атауы қажет." }, { status: 400 });
  }

  const mentorId = typeof body.mentorId === "string" && body.mentorId ? body.mentorId : null;
  if (mentorId) {
    const { data: mentor } = await supabase.from("profiles").select("id,role,status").eq("id", mentorId).maybeSingle();
    if (!mentor || mentor.role !== "MENTOR" || mentor.status !== "ACTIVE") {
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
