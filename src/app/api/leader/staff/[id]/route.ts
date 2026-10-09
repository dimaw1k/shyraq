import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

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
  const input = parsedBody.value as Record<string, unknown>;
  const allowedStatuses = new Set(["REGISTERED", "WAITING_FOR_TEAM", "ACTIVE", "INACTIVE", "COMPLETED"]);
  if (input.role !== undefined && (typeof input.role !== "string" || !ROLES.has(input.role))) {
    return NextResponse.json({ error: "Жарамсыз staff рөлі." }, { status: 400 });
  }
  if (input.status !== undefined && (typeof input.status !== "string" || !allowedStatuses.has(input.status))) {
    return NextResponse.json({ error: "Жарамсыз статус." }, { status: 400 });
  }
  if (input.role === undefined && input.status === undefined) {
    return NextResponse.json({ error: "Өзгертілетін өріс жіберілмеді." }, { status: 400 });
  }
  const body: { role?: string; status?: string } = {};
  if (typeof input.role === "string") body.role = input.role;
  if (typeof input.status === "string") body.status = input.status;

  const admin = createAdminSupabaseClient();

  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id,role,status")
    .eq("id", id)
    .maybeSingle();

  if (targetError || !target) {
    return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });
  }

  if (body.role !== undefined) {
    if (!ROLES.has(body.role)) {
      return NextResponse.json({ error: "Жарамсыз staff рөлі." }, { status: 400 });
    }

    const wasStudent = target.role === "STUDENT";

    if (wasStudent) {
      const { data: memberships } = await admin
        .from("team_members")
        .select("id,team_id")
        .eq("student_id", id)
        .eq("status", "ACTIVE");

      if (memberships?.length) {
        const membershipIds = memberships.map((item) => item.id);
        const { error: membershipError } = await admin
          .from("team_members")
          .update({
            status: "REMOVED",
            removed_at: new Date().toISOString(),
          })
          .in("id", membershipIds);

        if (membershipError) {
          return NextResponse.json({ error: "Пайдаланушыны командадан шығару сәтсіз аяқталды." }, { status: 500 });
        }

        await admin.from("audit_logs").insert(
          memberships.map((item) => ({
            actor_id: profile.id,
            actor_role: "LEADER",
            action: "TEAM_MEMBERSHIP_REMOVED",
            entity_type: "TEAM_MEMBER",
            entity_id: item.id,
            metadata: {
              student_id: id,
              team_id: item.team_id,
              reason: "PROFILE_PROMOTED_TO_STAFF",
            },
          })),
        );
      }
    }

    const profileUpdate: Record<string, string> = { role: body.role };
    if (wasStudent && body.status === undefined) {
      profileUpdate.status = "ACTIVE";
    }

    const { error } = await admin.from("profiles").update(profileUpdate).eq("id", id);
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

  if (error || !updated) {
    return NextResponse.json({ error: "Профиль жаңартылғаннан кейін табылмады." }, { status: 500 });
  }

  return NextResponse.json({ profile: updated });
}
