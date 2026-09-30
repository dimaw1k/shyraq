import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "MENTOR" && me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Mentor access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

  const { data, error } = await supabase.rpc("mentor_add_student_to_team", { target_student_id: studentId });
  if (error) {
    const code = error.message.includes("student_already_assigned") ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status: code });
  }

  return NextResponse.json({ ok: true, teamId: data });
}
