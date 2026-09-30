"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/app/AppNav";

type CreatedTest = {
  id: string;
  title: string;
};

const emptyOptions = ["", "", "", ""];

export default function AdminTestsPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [createdTest, setCreatedTest] = useState<CreatedTest | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionPoints, setQuestionPoints] = useState("1");
  const [options, setOptions] = useState<string[]>(emptyOptions);
  const [correctOption, setCorrectOption] = useState("0");
  const [questionsAdded, setQuestionsAdded] = useState(0);

  async function submitTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const f = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: f.get("lessonId"),
        title: f.get("title"),
        instructions: f.get("instructions"),
        maxAttempts: Number(f.get("maxAttempts") || 1),
        passingScore: Number(f.get("passingScore") || 0),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? "Тест жасау кезінде қате.");
      setLoading(false);
      return;
    }

    setCreatedTest(data.test);
    setMessage("Тест жасалды. Енді оған сұрақтар қосыңыз.");
    setLoading(false);
  }

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  function addOption() {
    setOptions((current) => [...current, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setCorrectOption((current) => {
      const selected = Number(current);
      if (selected === index) return "0";
      if (selected > index) return String(selected - 1);
      return current;
    });
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createdTest) return;

    const cleanedOptions = options.map((item) => item.trim()).filter(Boolean);
    if (!questionText.trim()) {
      setMessage("Сұрақ мәтінін енгізіңіз.");
      return;
    }
    if (cleanedOptions.length < 2) {
      setMessage("Кемінде екі жауап нұсқасы керек.");
      return;
    }

    const selected = Number(correctOption);
    if (!Number.isInteger(selected) || selected < 0 || selected >= options.length || !options[selected].trim()) {
      setMessage("Дұрыс жауапты таңдаңыз.");
      return;
    }

    setQuestionLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/tests/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testId: createdTest.id,
        questionText: questionText.trim(),
        points: Math.max(0, Number(questionPoints) || 0),
        sortOrder: questionsAdded,
        options: options
          .map((text, index) => ({
            text: text.trim(),
            correct: index === selected,
            sortOrder: index,
          }))
          .filter((option) => option.text),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? "Сұрақ жасау кезінде қате.");
      setQuestionLoading(false);
      return;
    }

    setQuestionsAdded((current) => current + 1);
    setQuestionText("");
    setQuestionPoints("1");
    setOptions(emptyOptions);
    setCorrectOption("0");
    setMessage("Сұрақ қосылды.");
    setQuestionLoading(false);
  }

  return (
    <AppShell role="ADMIN" title="Тесттер" description="Тест жасап, бірден сұрақтар мен дұрыс жауаптарды қосыңыз.">
      <main className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-7">
        <form onSubmit={submitTest} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-900">
              Lesson UUID
              <input name="lessonId" required placeholder="Lesson ID" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
            </label>

            <label className="block text-sm font-medium text-gray-900">
              Тест атауы
              <input name="title" required placeholder="Бақылау тесті" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
            </label>

            <label className="block text-sm font-medium text-gray-900">
              Нұсқаулық
              <textarea name="instructions" placeholder="Тапсыру ережесі" rows={3} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-900">
                Максимум әрекет
                <input name="maxAttempts" type="number" min="1" defaultValue="1" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
              </label>
              <label className="block text-sm font-medium text-gray-900">
                Өту балы
                <input name="passingScore" type="number" min="0" defaultValue="0" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
              </label>
            </div>
          </div>

          {message ? <div className="mt-4 rounded-xl bg-[#FAFAFA] p-3 text-sm text-gray-700">{message}</div> : null}

          <button disabled={loading} className="mt-4 w-full rounded-xl bg-[#C25100] p-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">
            {loading ? "Сақталуда..." : createdTest ? "Жаңа тест жасау" : "Тест жасау"}
          </button>
        </form>

        {createdTest ? (
          <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">QUESTION BUILDER</p>
                <h2 className="mt-1 text-sm font-semibold tracking-tight text-gray-900">{createdTest.title}</h2>
                <p className="mt-1 text-xs text-gray-500">Қосылған сұрақ: {questionsAdded}</p>
              </div>
              <span className="rounded-lg bg-[#FAFAFA] px-2.5 py-1.5 text-[10px] text-gray-400">ID: {createdTest.id}</span>
            </div>

            <form onSubmit={submitQuestion} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-gray-900">
                Сұрақ
                <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} required rows={3} placeholder="Сұрақ мәтінін жазыңыз..." className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
              </label>

              <label className="block max-w-40 text-sm font-medium text-gray-900">
                Ұпай
                <input type="number" min="0" step="1" value={questionPoints} onChange={(event) => setQuestionPoints(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">Жауап нұсқалары</p>
                  <button type="button" onClick={addOption} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-all duration-300 ease-in-out hover:bg-[#FAFAFA] hover:text-gray-900">
                    + Нұсқа қосу
                  </button>
                </div>

                {options.map((option, index) => (
                  <div key={index} className={"flex items-center gap-2 rounded-xl border p-2.5 transition-all duration-300 ease-in-out " + (Number(correctOption) === index ? "border-[#C25100] bg-[#C25100]/5" : "border-gray-100")}>
                    <input
                      type="radio"
                      name="correctOption"
                      checked={Number(correctOption) === index}
                      onChange={() => setCorrectOption(String(index))}
                      aria-label={"Дұрыс жауап " + (index + 1)}
                      className="h-4 w-4 accent-[#C25100]"
                    />
                    <input
                      value={option}
                      onChange={(event) => updateOption(index, event.target.value)}
                      placeholder={"Жауап " + (index + 1)}
                      required={index < 2}
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"
                    />
                    {options.length > 2 ? (
                      <button type="button" onClick={() => removeOption(index)} className="rounded-lg px-2 py-2 text-xs font-semibold text-gray-400 transition-all duration-300 ease-in-out hover:bg-red-50 hover:text-red-600" aria-label={"Нұсқаны жою " + (index + 1)}>
                        Жою
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <button disabled={questionLoading} className="w-full rounded-xl border border-[#C25100]/20 bg-[#C25100]/5 px-4 py-2.5 text-sm font-semibold text-[#C25100] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-[#C25100]/10 disabled:opacity-50">
                {questionLoading ? "Қосылуда..." : "Сұрақты қосу"}
              </button>
            </form>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
