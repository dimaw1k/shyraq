import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { TestClient } from "@/components/tests/TestClient";

export default async function LessonTestPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;

  const { data: test } = await supabase.from("lesson_tests")
    .select("id,title,instructions,max_attempts,active")
    .eq("lesson_id", lessonId).eq("active", true).maybeSingle();
  if (!test) notFound();

  const { data: progress } = await supabase.from("video_progress")
    .select("test_unlocked").eq("lesson_id", lessonId).eq("student_id", user.id).maybeSingle();
  if (!progress?.test_unlocked) redirect("/lessons/" + lessonId);

  const admin = createAdminSupabaseClient();
  const { data: questions } = await admin.from("test_questions")
    .select("id,question_text,points,sort_order,test_options(id,option_text,sort_order)")
    .eq("test_id", test.id).order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold">{test.title}</h1>
        {test.instructions ? <p className="mt-2 text-[var(--muted)]">{test.instructions}</p> : null}
        <TestClient testId={test.id} questions={questions ?? []} />
      </div>
    </main>
  );
}
