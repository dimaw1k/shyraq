import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

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
  const rateLimit = await consumeRateLimit("student:habit-delete", user.id, 10, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Әдетті өшіру әрекеттері тым жиі орындалды.");
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
