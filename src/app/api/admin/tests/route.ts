import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (typeof body?.lessonId !== "string" || !body.lessonId) return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  if (typeof body?.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: test, error } = await admin.from("lesson_tests").insert({
    lesson_id: body.lessonId,
    title: body.title.trim(),
    instructions: typeof body.instructions === "string" ? body.instructions.trim() : null,
    passing_score: typeof body.passingScore === "number" ? body.passingScore : null,
    max_attempts: typeof body.maxAttempts === "number" ? Math.max(1, Math.floor(body.maxAttempts)) : 1,
    active: body.active !== false,
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Test creation failed" }, { status: 400 });
  return NextResponse.json({ test });
}
