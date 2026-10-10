import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { id } = await params;
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Оқушыны командаға бекіту деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Оқушыны командаға бекіту деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;

  const teamId =
    body?.teamId === null || body?.teamId === ""
      ? null
      : typeof body?.teamId === "string"
        ? body.teamId
        : null;

  const admin = createAdminSupabaseClient();

  const { data: student } = await admin
    .from("profiles")
    .select("id,role,status")
    .eq("id", id)
    .maybeSingle();

  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "Оқушы табылмады." }, { status: 404 });
  }

  if (body?.allowAdd && !teamId) {
    return NextResponse.json(
      { error: "Оқушыны қосу үшін команда таңдаңыз." },
      { status: 400 },
    );
  }

  const { data: currentMemberships } = await admin
    .from("team_members")
    .select("id,team_id")
    .eq("student_id", id)
    .eq("status", "ACTIVE");

  const currentTeamIds = (currentMemberships ?? []).map((item) => item.team_id);
  const currentTeamId = currentTeamIds[0] ?? null;

  if (teamId && teamId !== currentTeamId) {
    const { data: team } = await admin
      .from("teams")
      .select("id,name,capacity,status")
      .eq("id", teamId)
      .maybeSingle();

    if (!team || team.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Команда табылмады немесе белсенді емес." },
        { status: 400 },
      );
    }

    const { count } = await admin
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("status", "ACTIVE")
      .neq("student_id", id);

    if (team.capacity && Number(count ?? 0) >= Number(team.capacity)) {
      return NextResponse.json(
        { error: "Бұл команда capacity-ге толған." },
        { status: 409 },
      );
    }
  }

  if (teamId === currentTeamId) {
    if (student.status !== "ACTIVE") {
      await admin.from("profiles").update({ status: "ACTIVE" }).eq("id", id);
    }

    return NextResponse.json({
      ok: true,
      teamId,
      profile: { id, status: "ACTIVE" },
    });
  }

  if (currentMemberships?.length) {
    const ids = currentMemberships.map((item) => item.id);
    await admin
      .from("team_members")
      .update({
        status: "REMOVED",
        removed_at: new Date().toISOString(),
      })
      .in("id", ids);
  }

  if (teamId) {
    const { error } = await admin.from("team_members").insert({
      team_id: teamId,
      student_id: id,
      status: "ACTIVE",
      assigned_by: profile.id,
    });

    if (error) {
      return NextResponse.json(
        { error: "Оқушыны командаға қосу сәтсіз аяқталды." },
        { status: 500 },
      );
    }

    await admin
      .from("profiles")
      .update({ status: "ACTIVE" })
      .eq("id", id);
  } else {
    await admin
      .from("profiles")
      .update({ status: "WAITING_FOR_TEAM" })
      .eq("id", id);
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "CHIEF_MENTOR_STUDENT_TEAM_CHANGED",
    entity_type: "PROFILE",
    entity_id: id,
    metadata: { team_id: teamId, previous_team_id: currentTeamId },
  });

  return NextResponse.json({
    ok: true,
    teamId,
    profile: {
      id,
      status: teamId ? "ACTIVE" : "WAITING_FOR_TEAM",
    },
  });
}
