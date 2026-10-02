"use client";

import { useState } from "react";

type Option = { id: string; option_text: string; sort_order: number };
type Attachment = { name: string; mime: string; url: string | null };
type QuestionType = "SINGLE" | "MULTIPLE" | "TEXT";
type Question = {
  id: string;
  question_text: string;
  points: number;
  sort_order: number;
  question_type: QuestionType;
  attachments: Attachment[];
  test_options: Option[];
};
type Attempt = { id: string; attempt_number: number; score: number; submitted_at: string | null };
type QuestionResult = {
  questionId: string;
  type: QuestionType;
  selectedOptionId: string | null;
  selectedOptionIds: string[];
  correctOptionId: string | null;
  correctOptionIds: string[];
  isCorrect: boolean;
  manualReview: boolean;
};

export function TestClient({
  testId,
  questions,
  maxAttempts,
  initialAttempts,
  attemptsRemaining: initialAttemptsRemaining,
}: {
  testId: string;
  questions: Question[];
  maxAttempts: number;
  initialAttempts: Attempt[];
  attemptsRemaining: number;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [attemptsRemaining, setAttemptsRemaining] = useState(initialAttemptsRemaining);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  function toggleMultiple(questionId: string, optionId: string) {
    setAnswers((current) => {
      const existing = Array.isArray(current[questionId]) ? current[questionId] : [];
      const next = existing.includes(optionId) ? existing.filter((id) => id !== optionId) : [...existing, optionId];
      return { ...current, [questionId]: next };
    });
  }

  async function submit() {
    const missing = questions.filter((question) => {
      const answer = answers[question.id];
      if (question.question_type === "MULTIPLE") return !Array.isArray(answer) || answer.length === 0;
      return typeof answer !== "string" || !answer.trim();
    });

    if (missing.length) {
      setResult("Барлық сұрақтарға жауап беріңіз.");
      return;
    }

    if (attemptsRemaining <= 0) {
      setResult("Бұл тест бойынша мүмкіндік аяқталды.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/tests/" + testId + "/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Қате шықты.");

      const attempt: Attempt = {
        id: String(body.attempt?.id ?? crypto.randomUUID()),
        attempt_number: Number(body.attempt?.attempt_number ?? attempts.length + 1),
        score: Number(body.attempt?.score ?? 0),
        submitted_at: body.attempt?.submitted_at ?? new Date().toISOString(),
      };

      setAttempts((current) => [attempt, ...current]);
      setAttemptsRemaining((current) => Math.max(0, current - 1));
      setQuestionResults(body.questionResults ?? []);
      setAnswers({});
      setResult("Тест қабылданды. Нәтиже: " + attempt.score + " балл");
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Қате шықты.");
    } finally {
      setLoading(false);
    }
  }

  const isLocked = loading || questions.length === 0 || attemptsRemaining <= 0;
  const resultMap = new Map(questionResults.map((item) => [item.questionId, item]));

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 sm:p-5">
        <p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">НӘТИЖЕ</p>
        <p className="mt-1 text-sm font-extrabold text-[#172235]">Қалған мүмкіндік: {attemptsRemaining} / {maxAttempts}</p>
      </div>

      {questions.map((question, index) => {
        const questionResult = resultMap.get(question.id);
        const options = [...question.test_options].sort((a, b) => a.sort_order - b.sort_order);
        const currentAnswer = answers[question.id];

        return (
          <section key={question.id} className="rounded-[18px] border border-[#E8E1DA] bg-white p-4 shadow-[0_10px_30px_rgba(23,34,53,.04)] sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#FFF1E2] text-[10px] font-extrabold text-[#FF8000]">{index + 1}</span>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold leading-6 text-[#172235]">{question.question_text}</h2>
                <p className="mt-1 text-[10px] font-semibold text-[#9A9189]">{question.points} ұпай · {question.question_type === "TEXT" ? "Мәтіндік жауап" : question.question_type === "MULTIPLE" ? "Бірнеше жауап" : "Бір жауап"}</p>
              </div>
            </div>

            {question.attachments.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {question.attachments.map((attachment) => attachment.url ? (
                  <a key={attachment.name} href={attachment.url} target="_blank" rel="noreferrer" className="rounded-[11px] border border-[#E8E1DA] bg-[#FFFCF9] px-3 py-2 text-[9px] font-bold text-[#4B433C] hover:border-[#FFB067]">
                    {attachment.name}
                  </a>
                ) : null)}
              </div>
            ) : null}

            {question.question_type === "TEXT" ? (
              <textarea
                value={typeof currentAnswer === "string" ? currentAnswer : ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                disabled={isLocked}
                rows={4}
                placeholder="Жауабыңызды жазыңыз"
                className="mt-4 w-full resize-none rounded-[13px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-sm font-medium outline-none focus:border-[#FF8000]"
              />
            ) : (
              <div className="mt-4 space-y-2">
                {options.map((option) => {
                  const selected = Array.isArray(currentAnswer) ? currentAnswer.includes(option.id) : currentAnswer === option.id;
                  const right = questionResult?.correctOptionIds?.includes(option.id);
                  const wrong = questionResult && selected && !right && !questionResult.manualReview;

                  return (
                    <label
                      key={option.id}
                      className={[
                        "flex items-start gap-3 rounded-[13px] border p-3 text-sm transition",
                        right ? "border-[#3D9C65] bg-[#EEF9F3]" : wrong ? "border-[#D76C4B] bg-[#FFF0E8]" : "border-[#E8E1DA] bg-white hover:bg-[#FAF7F3]",
                      ].join(" ")}
                    >
                      <input
                        type={question.question_type === "MULTIPLE" ? "checkbox" : "radio"}
                        name={question.id}
                        checked={selected}
                        onChange={() => question.question_type === "MULTIPLE"
                          ? toggleMultiple(question.id, option.id)
                          : setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                        disabled={isLocked}
                        className="mt-0.5 accent-[#FF8000]"
                      />
                      <span className="leading-5 text-[#4B433C]">{option.option_text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {questionResult?.manualReview ? (
              <p className="mt-3 rounded-[11px] bg-[#FFF1E2] px-3 py-2.5 text-[9px] font-bold text-[#8A4B1F]">Мәтіндік жауап тексеруді қажет етеді.</p>
            ) : null}
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={isLocked}
        className="w-full rounded-[13px] bg-[#FF8000] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(255,128,0,.18)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Жіберілуде..." : attemptsRemaining > 0 ? "Тестті тапсыру" : "Тест аяқталды"}
      </button>

      {result ? <div className="rounded-[13px] bg-[#FFFCF9] p-3.5 text-sm font-semibold text-[#172235]">{result}</div> : null}

      {attempts.length ? (
        <section className="overflow-hidden rounded-[18px] border border-[#E8E1DA] bg-white">
          <div className="border-b border-[#E8E1DA] bg-[#FFFCF9] px-4 py-3"><h2 className="text-sm font-extrabold text-[#172235]">Нәтиже тарихы</h2></div>
          <div className="divide-y divide-[#E8E1DA]">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-xs font-extrabold text-[#3F3832]">{attempt.attempt_number}-мүмкіндік</p>
                  <p className="mt-0.5 text-[10px] font-medium text-[#9A9189]">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString("kk-KZ") : "—"}</p>
                </div>
                <span className="text-sm font-extrabold text-[#172235]">{attempt.score} балл</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
