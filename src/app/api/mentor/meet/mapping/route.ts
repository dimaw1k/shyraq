import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "MENTOR" || me.status !== "ACTIVE") {
    return NextResponse.json({ error: "Mentor access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const googleUserId = typeof body?.googleUserId === "string" ? body.googleUserId.trim() : "";
  const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
  if (!googleUserId || googleUserId.length > 320 || /[\u0000-\u001f\u007f]/.test(googleUserId) || !studentId) {
    return NextResponse.json({ error: "googleUserId and studentId are required and must be valid" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: student } = await admin
    .from("profiles")
    .select("id,role,status")
    .eq("id", studentId)
    .maybeSingle();

  if (!student || student.role !== "STUDENT" || student.status !== "ACTIVE") {
    return NextResponse.json({ error: "Active student not found" }, { status: 404 });
  }

  const { data: membership, error: membershipError } = await admin
    .from("team_members")
    .select("team_id,teams(mentor_id,status)")
    .eq("student_id", studentId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: "Unable to validate student team" }, { status: 500 });
  }

  const team = Array.isArray(membership?.teams) ? membership.teams[0] : membership?.teams;
  if (!membership || !team || team.mentor_id !== user.id || team.status !== "ACTIVE") {
    return NextResponse.json({ error: "Student is not in your active team" }, { status: 403 });
  }

  // A mentor may map only a Google participant already observed in their own
  // team's Meet conferences; otherwise a forged ID could overwrite another
  // team's attendance mapping.
  const { data: observedParticipants, error: participantError } = await admin
    .from("meet_participants")
    .select("id,conference_id")
    .eq("google_user_id", googleUserId)
    .limit(1000);

  if (participantError) {
    return NextResponse.json({ error: "Unable to validate Meet participant" }, { status: 500 });
  }
  if (!observedParticipants?.length) {
    return NextResponse.json({ error: "Participant has not appeared in a synced Meet" }, { status: 404 });
  }

  const conferenceIds = [...new Set(observedParticipants.map((participant) => participant.conference_id))];
  const { data: teamConferences, error: conferenceError } = await admin
    .from("meet_conferences")
    .select("id")
    .eq("team_id", membership.team_id)
    .in("id", conferenceIds);

  if (conferenceError) {
    return NextResponse.json({ error: "Unable to validate participant team" }, { status: 500 });
  }
  const allowedConferenceIds = (teamConferences ?? []).map((conference) => conference.id);
  if (!allowedConferenceIds.length) {
    return NextResponse.json({ error: "Participant was not observed in your team's meetings" }, { status: 403 });
  }

  const { data: existingMapping, error: mappingLookupError } = await admin
    .from("meet_participant_mappings")
    .select("student_id,assigned_by")
    .eq("google_user_id", googleUserId)
    .maybeSingle();

  if (mappingLookupError) {
    return NextResponse.json({ error: "Unable to validate existing participant mapping" }, { status: 500 });
  }
  if (
    existingMapping &&
    existingMapping.student_id !== studentId &&
    existingMapping.assigned_by !== user.id
  ) {
    return NextResponse.json({
      error: "Бұл қатысушы басқа қызметкерге бекітілген. Өзгерту үшін бас менторға хабарласыңыз.",
    }, { status: 409 });
  }

  const { data, error } = await admin.from("meet_participant_mappings").upsert({
    google_user_id: googleUserId,
    student_id: studentId,
    assigned_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "google_user_id" }).select("*").single();

  if (error) return NextResponse.json({ error: "Mapping save failed" }, { status: 400 });

  const { error: updateParticipantError } = await admin
    .from("meet_participants")
    .update({ student_id: studentId, match_status: "MANUALLY_MATCHED" })
    .eq("google_user_id", googleUserId)
    .in("conference_id", allowedConferenceIds);

  if (updateParticipantError) {
    console.error("[meet/mapping] participant update failed", { code: updateParticipantError.code });
    return NextResponse.json({ error: "Mapping saved, but participant records need to be resynchronized" }, { status: 500 });
  }

  return NextResponse.json({ mapping: data });
}
