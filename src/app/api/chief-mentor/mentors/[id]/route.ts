import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const STATUS = new Set(["ACTIVE", "INACTIVE", "COMPLETED"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Өзгеріс деректері дұрыс емес." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id,role,status")
    .eq("id", id)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: "Профильді тексеру мүмкін болмады." }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });
  }

  // This endpoint may add a STUDENT as a MENTOR or manage an existing mentor.
  // It must not demote a LEADER/CHIEF_MENTOR into a mentor by accident.
  const promotingStudent = target.role === "STUDENT" && body.role === "MENTOR";
  if (target.role !== "MENTOR" && !promotingStudent) {
    return NextResponse.json(
      { error: "Тек оқушыны ментор ретінде қосуға немесе бар менторды басқаруға болады." },
      { status: 403 },
    );
  }
  if (body.role !== undefined && body.role !== "MENTOR") {
    return NextResponse.json(
      { error: "Chief Mentor тек MENTOR рөлін тағайындай алады." },
      { status: 403 },
    );
  }
  if (body.status !== undefined && (typeof body.status !== "string" || !STATUS.has(body.status))) {
    return NextResponse.json({ error: "Жарамсыз статус." }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (body.role === "MENTOR") updates.role = "MENTOR";
  if (typeof body.status === "string") updates.status = body.status;
  if (promotingStudent && body.status === undefined) updates.status = "ACTIVE";

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Өзгеріс жоқ." }, { status: 400 });
  }

  // A promoted student must not keep active student-team memberships after
  // their profile becomes a staff role. Remove memberships first and fail closed
  // if this cannot be done.
  if (promotingStudent) {
    const { data: memberships, error: membershipLookupError } = await admin
      .from("team_members")
      .select("id,team_id")
      .eq("student_id", id)
      .eq("status", "ACTIVE");

    if (membershipLookupError) {
      return NextResponse.json({ error: "Оқушының командасын тексеру сәтсіз аяқталды." }, { status: 500 });
    }

    if (memberships?.length) {
      const membershipIds = memberships.map((item) => item.id);
      const { error: membershipUpdateError } = await admin
        .from("team_members")
        .update({
          status: "REMOVED",
          removed_at: new Date().toISOString(),
        })
        .in("id", membershipIds);

      if (membershipUpdateError) {
        return NextResponse.json({ error: "Оқушыны командадан шығару сәтсіз аяқталды." }, { status: 500 });
      }

      const { error: auditMembershipError } = await admin.from("audit_logs").insert(
        memberships.map((item) => ({
          actor_id: profile.id,
          actor_role: profile.role,
          action: "TEAM_MEMBERSHIP_REMOVED",
          entity_type: "TEAM_MEMBER",
          entity_id: item.id,
          metadata: {
            student_id: id,
            team_id: item.team_id,
            reason: "PROFILE_PROMOTED_TO_MENTOR",
          },
        })),
      );
      if (auditMembershipError) {
        console.error("[chief-mentor/mentors] membership audit failed", { code: auditMembershipError.code });
      }
    }
  }

  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("id,full_name,email,phone,role,status,avatar_path,created_at")
    .single();

  if (error || !data) {
    console.error("[chief-mentor/mentors] profile update failed", { code: error?.code });
    return NextResponse.json({ error: "Менторды жаңарту сәтсіз аяқталды." }, { status: 500 });
  }

  const avatar_url = data.avatar_path
    ? admin.storage.from("avatars").getPublicUrl(data.avatar_path).data.publicUrl
    : null;

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: promotingStudent ? "STUDENT_PROMOTED_TO_MENTOR" : "CHIEF_MENTOR_PROFILE_UPDATED",
    entity_type: "PROFILE",
    entity_id: id,
    metadata: { changes: updates, previous_role: target.role },
  });
  if (auditError) {
    console.error("[chief-mentor/mentors] profile audit failed", { code: auditError.code });
  }

  return NextResponse.json({ profile: { ...data, avatar_url } });
}
