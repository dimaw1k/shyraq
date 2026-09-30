"use client";

import { useState } from "react";

type Option = { id: string; option_text: string; sort_order: number };
type Question = {
  id: string;
  question_text: string;
  points: number;
  sort_order: number;
  test_options: Option[];
};

export function TestClient({ testId, questions }: { testId: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setResult("");
    try {
      const response = await fetch("/api/tests/" + testId + "/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Test failed");
      setResult("Нәтиже: " + String(body.attempt?.score ?? 0) + " балл");
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {questions.map((question, index) => (
        <section key={question.id} className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="font-semibold">{index + 1}. {question.question_text}</h2>
          <div className="mt-4 space-y-3">
            {question.test_options.sort((a,b) => a.sort_order - b.sort_order).map((option) => (
              <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[question.id] === option.id}
                  onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                />
                <span>{option.option_text}</span>
              </label>
            ))}
          </div>
        </section>
      ))}
      <button
        onClick={submit}
        disabled={loading || questions.length === 0}
        className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Жіберілуде..." : "Тестті тапсыру"}
      </button>
      {result ? <div className="rounded-xl border border-[var(--border)] bg-white p-4 font-medium">{result}</div> : null}
    </div>
  );
}
