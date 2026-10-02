"use client";

import { useState } from "react";

type Option = { id: string; option_text: string; sort_order: number };
type Question = { id: string; question_text: string; points: number; sort_order: number; test_options: Option[] };
type Attempt = { id: string; attempt_number: number; score: number; submitted_at: string | null };
type QuestionResult = { questionId: string; selectedOptionId: string | null; correctOptionId: string | null; isCorrect: boolean };

export function TestClient({ testId, questions, maxAttempts, initialAttempts, attemptsRemaining: initialAttemptsRemaining }: {
  testId: string; questions: Question[]; maxAttempts: number; initialAttempts: Attempt[]; attemptsRemaining: number;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [attemptsRemaining, setAttemptsRemaining] = useState(initialAttemptsRemaining);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  async function submit() {
    const missing = questions.filter((question) => !answers[question.id]);
    if (missing.length) { setResult("Барлық сұрақтарға жауап беріңіз. Бір сұрақты да бос қалдыруға болмайды."); return; }
    if (attemptsRemaining <= 0) { setResult("Бұл тест бойынша рұқсат етілген әрекет аяқталды."); return; }

    setLoading(true); setResult("");
    try {
      const response = await fetch("/api/tests/" + testId + "/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Test failed");
      const attempt: Attempt = { id: String(body.attempt?.id ?? crypto.randomUUID()), attempt_number: 1, score: Number(body.attempt?.score ?? 0), submitted_at: body.attempt?.submitted_at ?? new Date().toISOString() };
      setAttempts((current) => [attempt, ...current]);
      setAttemptsRemaining(0);
      setQuestionResults(body.questionResults ?? []);
      setAnswers({});
      setResult("Нәтиже: " + attempt.score + " балл");
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Қате");
    } finally { setLoading(false); }
  }

  const isLocked = loading || questions.length === 0 || attemptsRemaining <= 0;
  const resultMap = new Map(questionResults.map((item) => [item.questionId, item]));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#EFE8E1] bg-[#FFFCF9] p-4 sm:p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9A9189]">НӘТИЖЕ</p>
        <p className="mt-1 text-sm font-extrabold text-[#172235]">Қалған мүмкіндік: {attemptsRemaining} / {maxAttempts}</p>
        {questionResults.length ? <p className="mt-1 text-[10px] font-semibold text-[#3D7A4B]">Дұрыс жауаптар мен қате жауаптар төменде көрсетілді.</p> : null}
      </div>

      {questions.map((question, index) => {
        const questionResult = resultMap.get(question.id);
        const options = [...question.test_options].sort((a, b) => a.sort_order - b.sort_order);
        return (
          <section key={question.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#C25100]/10 text-[10px] font-semibold text-[#C25100]">{index + 1}</span><div className="min-w-0"><h2 className="text-sm font-semibold leading-6 text-gray-900">{question.question_text}</h2><p className="mt-0.5 text-[10px] text-gray-400">{question.points} ұпай</p></div></div>
            <div className="mt-4 space-y-2">
              {options.map((option) => {
                const right = questionResult?.correctOptionId === option.id;
                const wrongSelected = questionResult?.selectedOptionId === option.id && !questionResult.isCorrect;
                return (
                  <label key={option.id} className={"flex items-start gap-3 rounded-xl border p-3 text-sm transition " + (right ? "border-[#3D9C65] bg-[#EEF9F3]" : wrongSelected ? "border-[#D76C4B] bg-[#FFF0E8]" : "border-gray-100 hover:bg-[#FAFAFA]")}>
                    <input type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))} disabled={isLocked} className="mt-0.5 accent-[#C25100]" />
                    <span className="leading-5 text-gray-700">{option.option_text}</span>
                  </label>
                );
              })}
            </div>
          </section>
        );
      })}

      <button onClick={() => void submit()} disabled={isLocked} className="w-full rounded-xl bg-[#C25100] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Жіберілуде..." : attemptsRemaining > 0 ? "Тестті тапсыру" : "Тест аяқталды"}</button>
      {result ? <div className="rounded-xl bg-[#FAFAFA] p-3.5 text-sm font-semibold text-gray-900">{result}</div> : null}
      {attempts.length ? <section className="overflow-hidden rounded-2xl border border-[#EFE8E1] bg-white"><div className="border-b border-[#EFE8E1] bg-[#FFFCF9] px-4 py-3"><h2 className="text-sm font-extrabold text-[#172235]">Нәтиже тарихы</h2></div><div className="divide-y divide-[#EFE8E1]">{attempts.map((attempt) => <div key={attempt.id} className="flex items-center justify-between gap-4 px-4 py-3"><div><p className="text-xs font-extrabold text-[#3F3832]">{attempt.attempt_number}-әрекет</p><p className="mt-0.5 text-[10px] font-medium text-[#9A9189]">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString("kk-KZ") : "—"}</p></div><span className="text-sm font-extrabold text-[#172235]">{attempt.score} балл</span></div>)}</div></section> : null}
    </div>
  );
}
