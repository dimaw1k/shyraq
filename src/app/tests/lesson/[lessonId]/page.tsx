import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { TestClient } from "@/components/tests/TestClient";
import { isDateInFuture } from "@/lib/datetime";

export default async function LessonTestPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { lessonId } = await params;
  const [{ data: profile }, { data: lesson }, { data: test }, { data: membership }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("full_name,role,status").eq("id", user.id).maybeSingle(),
    supabase.from("lessons").select("id,published,starts_at,team_id,kinescope_video_id").eq("id", lessonId).maybeSingle(),
    supabase.from("lesson_tests").select("id,title,instructions,max_attempts,active").eq("lesson_id", lessonId).eq("active", true).maybeSingle(),
    supabase.from("team_members").select("team_id").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
    supabase.from("video_progress").select("test_unlocked").eq("lesson_id", lessonId).eq("student_id", user.id).maybeSingle(),
  ]);

  // This is a student-facing exam screen that fetches protected question
  // metadata using the server-only Supabase client. Never let staff, inactive
  // accounts, or users with a missing profile enter this path.
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") notFound();

  if (!lesson?.published || !test) notFound();

  if (lesson.starts_at && isDateInFuture(lesson.starts_at)) {
    redirect("/lessons/" + lessonId);
  }

  if (lesson.team_id && lesson.team_id !== membership?.team_id) {
    notFound();
  }

  if (!progress?.test_unlocked) redirect("/lessons/" + lessonId);

  const admin = createAdminSupabaseClient();
  const [{ data: rawQuestions }, { data: attempts }] = await Promise.all([
    admin
      .from("test_questions")
      .select("id,question_text,points,sort_order,question_type,attachments,test_options(id,option_text,sort_order)")
      .eq("test_id", test.id)
      .order("sort_order"),
    supabase
      .from("test_attempts")
      .select("id,attempt_number,score,submitted_at")
      .eq("test_id", test.id)
      .eq("student_id", user.id)
      .order("attempt_number", { ascending: false }),
  ]);

  const questions = await Promise.all(
    (rawQuestions ?? []).map(async (question) => {
      const attachments = Array.isArray(question.attachments)
        ? await Promise.all(
            question.attachments.map(
              async (attachment: { name: string; path: string; mime: string; size: number }) => {
                const { data } = await admin.storage.from("test-question-files").createSignedUrl(attachment.path, 3600);
                return { name: attachment.name, mime: attachment.mime, url: data?.signedUrl ?? null };
              },
            ),
          )
        : [];

      return {
        id: question.id,
        question_text: question.question_text,
        points: Number(question.points ?? 0),
        sort_order: question.sort_order,
        question_type:
          question.question_type === "MULTIPLE" || question.question_type === "TEXT"
            ? question.question_type
            : "SINGLE",
        attachments,
        test_options: Array.isArray(question.test_options) ? question.test_options : [],
      };
    }),
  );

  const role = profile.role;
  const attemptsExhausted = (attempts ?? []).length >= Number(test.max_attempts ?? 1);
  // Do not leak per-attempt score history while the student still has attempts
  // remaining. Otherwise refreshes would bypass response-side result redaction.
  const initialAttempts = (attempts ?? []).map((attempt) => ({
    id: attempt.id,
    attempt_number: attempt.attempt_number,
    score: attemptsExhausted ? Number(attempt.score ?? 0) : null,
    submitted_at: attempt.submitted_at,
  }));

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title={test.title}
      description="Сұрақтарға жауап беріп, тесті аяқтаңыз."
    >
      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        {test.instructions ? <p className="mb-4 text-sm leading-6 text-[#766E66]">{test.instructions}</p> : null}
        <TestClient
          testId={test.id}
          questions={questions}
          maxAttempts={Number(test.max_attempts ?? 1)}
          initialAttempts={initialAttempts}
          attemptsRemaining={Math.max(0, Number(test.max_attempts ?? 1) - initialAttempts.length)}
        />
      </main>
    </AppShell>
  );
}
