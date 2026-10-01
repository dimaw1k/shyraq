import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RawTestQuestion = {
  id: string;
  test_id: string;
  question_text: string;
  points: number | string;
  sort_order: number;
  test_options: Array<{
    id: string;
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }> | null;
};

export type StaffTestData = {
  test: {
    id: string;
    title: string;
    instructions: string | null;
    passing_score: number | null;
    max_attempts: number;
    active: boolean;
  } | null;
  questions: Array<{
    text: string;
    points: number;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>;
};

export async function getStaffTestData(lessonIds: string[]) {
  const result = new Map<string, StaffTestData>();

  if (!lessonIds.length) return result;

  const admin = createAdminSupabaseClient();
  const { data: tests } = await admin
    .from("lesson_tests")
    .select("id,lesson_id,title,instructions,passing_score,max_attempts,active")
    .in("lesson_id", lessonIds);

  const testIds = (tests ?? []).map((test) => test.id);
  let questions: RawTestQuestion[] = [];

  if (testIds.length) {
    const { data } = await admin
      .from("test_questions")
      .select("id,test_id,question_text,points,sort_order,test_options(id,option_text,is_correct,sort_order)")
      .in("test_id", testIds)
      .order("sort_order", { ascending: true });

    questions = (data ?? []) as RawTestQuestion[];
  }

  const questionsByTest = new Map<string, RawTestQuestion[]>();
  for (const question of questions) {
    const list = questionsByTest.get(question.test_id) ?? [];
    list.push(question);
    questionsByTest.set(question.test_id, list);
  }

  const testByLesson = new Map((tests ?? []).map((test) => [test.lesson_id, test]));

  for (const lessonId of lessonIds) {
    const test = testByLesson.get(lessonId);
    const testQuestions = test ? questionsByTest.get(test.id) ?? [] : [];

    result.set(lessonId, {
      test: test
        ? {
            id: test.id,
            title: test.title,
            instructions: test.instructions,
            passing_score: test.passing_score,
            max_attempts: test.max_attempts,
            active: test.active,
          }
        : null,
      questions: testQuestions.map((question) => ({
        text: question.question_text,
        points: Number(question.points),
        options: (question.test_options ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((option) => ({
            text: option.option_text,
            isCorrect: Boolean(option.is_correct),
          })),
      })),
    });
  }

  return result;
}
