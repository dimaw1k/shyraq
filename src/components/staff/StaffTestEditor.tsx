"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

type TestOption = {
  text: string;
  isCorrect: boolean;
};

type TestQuestion = {
  text: string;
  points: number;
  options: TestOption[];
};

export type StaffTestEditorData = {
  lessonId: string;
  test: {
    id: string;
    title: string;
    instructions: string | null;
    passing_score: number | null;
    max_attempts: number;
    active: boolean;
  } | null;
  questions: TestQuestion[];
};

function createQuestion(): TestQuestion {
  return {
    text: "",
    points: 1,
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ],
  };
}

export function StaffTestEditor({ lessonId, test, questions: initialQuestions }: StaffTestEditorData) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(test?.title ?? "");
  const [instructions, setInstructions] = useState(test?.instructions ?? "");
  const [passingScore, setPassingScore] = useState(test?.passing_score == null ? "" : String(test.passing_score));
  const [maxAttempts, setMaxAttempts] = useState(String(test?.max_attempts ?? 1));
  const [active, setActive] = useState(test?.active ?? true);
  const [questions, setQuestions] = useState<TestQuestion[]>(
    initialQuestions.length ? initialQuestions : [createQuestion()],
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function setQuestion(index: number, patch: Partial<TestQuestion>) {
    setQuestions((current) => current.map((question, questionIndex) => (
      questionIndex === index ? { ...question, ...patch } : question
    )));
  }

  function setOption(questionIndex: number, optionIndex: number, patch: Partial<TestOption>) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex !== questionIndex
          ? question
          : {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? { ...option, ...patch } : option,
              ),
            },
      ),
    );
  }

  function setCorrectOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex !== questionIndex
          ? question
          : {
              ...question,
              options: question.options.map((option, currentOptionIndex) => ({
                ...option,
                isCorrect: currentOptionIndex === optionIndex,
              })),
            },
      ),
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index));
  }

  function addOption(questionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex && question.options.length < 6
          ? { ...question, options: [...question.options, { text: "", isCorrect: false }] }
          : question,
      ),
    );
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex || question.options.length <= 2) return question;
        const nextOptions = question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex);
        if (!nextOptions.some((option) => option.isCorrect)) nextOptions[0] = { ...nextOptions[0], isCorrect: true };
        return { ...question, options: nextOptions };
      }),
    );
  }

  async function save() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          title,
          instructions,
          passingScore: passingScore === "" ? null : Number(passingScore),
          maxAttempts: Number(maxAttempts),
          active,
          questions,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ?? "Тестті сақтау сәтсіз аяқталды.");
        return;
      }

      setMessage("Тест сақталды.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[14px] border border-[#E8E1DA] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
      >
        <div>
          <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#FF6F2C]">TEST</p>
          <p className="mt-1 text-[10px] font-extrabold text-[#354153]">
            {test ? (test.active ? "Тест баптаулары" : "Тест өшірулі") : "Тест құру"}
          </p>
          {message ? <p className="mt-1 text-[8px] font-semibold text-[#3D7A4B]">{message}</p> : null}
        </div>
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-[#EFE8E1] p-3.5">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Тест атауы"
              className="rounded-[10px] border border-[#E8E1DA] px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(event) => setPassingScore(event.target.value)}
              placeholder="Өту балы % (optional)"
              className="rounded-[10px] border border-[#E8E1DA] px-3 py-2 text-[9px] font-semibold"
            />
          </div>

          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={2}
            placeholder="Нұсқаулық"
            className="w-full resize-none rounded-[10px] border border-[#E8E1DA] px-3 py-2 text-[9px] font-semibold"
          />

          <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
            <input
              type="number"
              min="1"
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(event.target.value)}
              placeholder="Attempts"
              className="rounded-[10px] border border-[#E8E1DA] px-3 py-2 text-[9px] font-semibold"
            />
            <label className="flex items-center gap-2 text-[9px] font-bold text-[#5B534C]">
              <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
              ACTIVE
            </label>
          </div>

          <div className="space-y-3">
            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="rounded-[12px] border border-[#E8E1DA] bg-[#FFFCF9] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-extrabold text-[#354153]">Сұрақ {questionIndex + 1}</p>
                  {questions.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      className="inline-flex items-center gap-1 text-[8px] font-bold text-[#B54D2B]"
                    >
                      <Trash2 size={11} />
                      Өшіру
                    </button>
                  ) : null}
                </div>

                <textarea
                  value={question.text}
                  onChange={(event) => setQuestion(questionIndex, { text: event.target.value })}
                  rows={2}
                  placeholder="Сұрақ мәтіні"
                  className="mt-2 w-full resize-none rounded-[9px] border border-[#E8E1DA] bg-white px-2.5 py-2 text-[9px] font-semibold"
                />

                <div className="mt-2 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${lessonId}-${questionIndex}`}
                        checked={option.isCorrect}
                        onChange={() => setCorrectOption(questionIndex, optionIndex)}
                      />
                      <input
                        value={option.text}
                        onChange={(event) => setOption(questionIndex, optionIndex, { text: event.target.value })}
                        placeholder={`Нұсқа ${optionIndex + 1}`}
                        className="min-w-0 flex-1 rounded-[9px] border border-[#E8E1DA] bg-white px-2.5 py-2 text-[9px] font-semibold"
                      />
                      {question.options.length > 2 ? (
                        <button
                          type="button"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          className="grid h-7 w-7 place-items-center rounded-[8px] text-[#B54D2B]"
                          aria-label="Нұсқаны өшіру"
                        >
                          <Trash2 size={11} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={question.options.length >= 6}
                    onClick={() => addOption(questionIndex)}
                    className="inline-flex items-center gap-1 text-[8px] font-extrabold text-[#FF6F2C] disabled:opacity-50"
                  >
                    <Plus size={10} />
                    Нұсқа қосу
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={question.points}
                    onChange={(event) => setQuestion(questionIndex, { points: Number(event.target.value) })}
                    className="w-20 rounded-[9px] border border-[#E8E1DA] bg-white px-2 py-1.5 text-[8px] font-semibold"
                    aria-label="Сұрақ ұпайы"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#E8E1DA] bg-white px-3 py-2 text-[8px] font-extrabold text-[#4B433C]"
            >
              <Plus size={11} />
              Сұрақ қосу
            </button>

            <PrimaryButton type="button" onClick={save} disabled={loading}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Сақтау
            </PrimaryButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
