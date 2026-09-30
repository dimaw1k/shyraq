import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "MENTOR" && me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Mentor access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const googleUserId = typeof body?.googleUserId === "string" ? body.googleUserId.trim() : "";
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  if (!googleUserId || !studentId) {
    return NextResponse.json({ error: "googleUserId and studentId are required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: student } = await admin.from("profiles").select("id,role").eq("id", studentId).maybeSingle();
  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (me.role === "MENTOR") {
    const { data: membership } = await admin.from("team_members")
      .select("team_id,teams(mentor_id)")
      .eq("student_id", studentId).eq("status", "ACTIVE").maybeSingle();

    const team = Array.isArray(membership?.teams) ? membership?.teams[0] : membership?.teams;
    if (!team || team.mentor_id !== user.id) {
      return NextResponse.json({ error: "Student is not in your team" }, { status: 403 });
    }
  }

  const { data, error } = await admin.from("meet_participant_mappings").upsert({
    google_user_id: googleUserId,
    student_id: studentId,
    assigned_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "google_user_id" }).select("*").single();

  if (error) return NextResponse.json({ error: "Mapping save failed" }, { status: 400 });

  await admin.from("meet_participants")
    .update({ student_id: studentId, match_status: "MANUALLY_MATCHED" })
    .eq("google_user_id", googleUserId);

  return NextResponse.json({ mapping: data });
}
