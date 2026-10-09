import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ habitId: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }

  const { habitId } = await context.params;
  const admin = createAdminSupabaseClient();

  const { data: habit } = await admin
    .from("habits")
    .select("id,is_default")
    .eq("id", habitId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!habit) return NextResponse.json({ error: "Әдет табылмады." }, { status: 404 });
  if (habit.is_default) {
    return NextResponse.json({ error: "Негізгі әдетті өшіруге болмайды." }, { status: 409 });
  }

  const { error } = await admin
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("student_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Әдетті өшіру мүмкін болмады." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
