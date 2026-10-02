import { notFound, redirect } from "next/navigation";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { TestClient } from "@/components/tests/TestClient";

export default async function LessonTestPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;
  const [{ data: profile }, { data: test }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("lesson_tests").select("id,title,instructions,max_attempts,active").eq("lesson_id", lessonId).eq("active", true).maybeSingle(),
  ]);
  if (!test) notFound();

  const { data: progress } = await supabase.from("video_progress").select("test_unlocked").eq("lesson_id", lessonId).eq("student_id", user.id).maybeSingle();
  if (!progress?.test_unlocked) redirect("/lessons/" + lessonId);

  const admin = createAdminSupabaseClient();
  const [{ data: questions }, { data: attempts }] = await Promise.all([
    admin.from("test_questions").select("id,question_text,points,sort_order,test_options(id,option_text,sort_order)").eq("test_id", test.id).order("sort_order"),
    supabase.from("test_attempts").select("id,attempt_number,score,submitted_at").eq("test_id", test.id).eq("student_id", user.id).order("attempt_number", { ascending: false }),
  ]);

  const role = profile?.role ?? "STUDENT";
  const initialAttempts = (attempts ?? []).map((attempt) => ({ id: attempt.id, attempt_number: attempt.attempt_number, score: Number(attempt.score ?? 0), submitted_at: attempt.submitted_at }));

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title={test.title} description="Әр сұраққа міндетті түрде жауап бер." right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        {test.instructions ? <p className="mb-4 text-sm leading-6 text-gray-500">{test.instructions}</p> : null}
        <TestClient testId={test.id} questions={questions ?? []} maxAttempts={1} initialAttempts={initialAttempts} attemptsRemaining={initialAttempts.length ? 0 : 1} />
      </main>
    </AppShell>
  );
}
