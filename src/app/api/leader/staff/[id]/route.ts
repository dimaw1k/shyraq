import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const ROLES = new Set(["MENTOR", "CHIEF_MENTOR", "LEADER"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff("LEADER");
  const { id } = await params;

  if (id === profile.id) {
    return NextResponse.json({ error: "Өз рөліңізді өзіңіз өзгерте алмайсыз." }, { status: 400 });
  }

  let body: { role?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  if (body.role !== undefined) {
    if (!ROLES.has(body.role)) {
      return NextResponse.json({ error: "Жарамсыз staff рөлі." }, { status: 400 });
    }

    const { data: target } = await admin.from("profiles").select("id,role,status").eq("id", id).maybeSingle();
    if (!target) return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });

    const { error } = await admin.from("profiles").update({ role: body.role }).eq("id", id);
    if (error) return NextResponse.json({ error: "Рөлді өзгерту сәтсіз аяқталды." }, { status: 500 });

    await admin.from("audit_logs").insert({
      actor_id: profile.id,
      actor_role: "LEADER",
      action: "PROFILE_ROLE_CHANGED",
      entity_type: "PROFILE",
      entity_id: id,
      metadata: { from_role: target.role, to_role: body.role },
    });
  }

  if (body.status !== undefined) {
    const allowedStatuses = new Set(["REGISTERED", "WAITING_FOR_TEAM", "ACTIVE", "INACTIVE", "COMPLETED"]);
    if (!allowedStatuses.has(body.status)) {
      return NextResponse.json({ error: "Жарамсыз статус." }, { status: 400 });
    }

    const { error } = await admin.from("profiles").update({ status: body.status }).eq("id", id);
    if (error) return NextResponse.json({ error: "Статусты өзгерту сәтсіз аяқталды." }, { status: 500 });

    await admin.from("audit_logs").insert({
      actor_id: profile.id,
      actor_role: "LEADER",
      action: "PROFILE_STATUS_CHANGED",
      entity_type: "PROFILE",
      entity_id: id,
      metadata: { status: body.status },
    });
  }

  const { data: updated, error } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,role,status,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !updated) return NextResponse.json({ error: "Профиль жаңартылғаннан кейін табылмады." }, { status: 500 });

  return NextResponse.json({ profile: updated });
}
