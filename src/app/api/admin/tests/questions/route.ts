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
  const testId = typeof body?.testId === "string" ? body.testId : "";
  const questionText = typeof body?.questionText === "string" ? body.questionText.trim() : "";
  if (!testId || !questionText) return NextResponse.json({ error: "testId and questionText are required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: question, error: questionError } = await admin.from("test_questions").insert({
    test_id: testId,
    question_text: questionText,
    points: typeof body.points === "number" ? Math.max(0, body.points) : 1,
    sort_order: typeof body.sortOrder === "number" ? Math.floor(body.sortOrder) : 0,
  }).select("*").single();

  if (questionError) return NextResponse.json({ error: "Question creation failed" }, { status: 400 });

  const options = Array.isArray(body.options)
    ? body.options.filter((item: unknown): item is { text: string; correct?: boolean; sortOrder?: number } =>
        Boolean(item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string"))
    : [];

  if (options.length) {
    const { error: optionsError } = await admin.from("test_options").insert(
      options.map((option, index) => ({
        question_id: question.id,
        option_text: option.text.trim(),
        is_correct: Boolean(option.correct),
        sort_order: typeof option.sortOrder === "number" ? Math.floor(option.sortOrder) : index,
      })),
    );
    if (optionsError) return NextResponse.json({ error: "Question options creation failed" }, { status: 400 });
  }

  return NextResponse.json({ question });
}
