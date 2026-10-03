"use client";

import { useState } from "react";
import { Check, FilePlus2, Loader2, Plus, Trash2, X } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import { StaffModal, StaffSelectMenu, staffInputClass } from "@/components/staff/StaffUI";

type Attachment = { name: string; path: string; mime: string; size: number };
type TestOption = { text: string; isCorrect: boolean };
type QuestionType = "SINGLE" | "MULTIPLE" | "TEXT";
type TestQuestion = {
  id?: string;
  text: string;
  points: number;
  type: QuestionType;
  options: TestOption[];
  attachments: Attachment[];
  files: File[];
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
  questions: Array<{
    id?: string;
    text: string;
    points: number;
    type?: QuestionType;
    options: TestOption[];
    attachments?: Attachment[];
  }>;
};

const questionTypeOptions = [
  { value: "SINGLE", label: "Бір дұрыс жауап" },
  { value: "MULTIPLE", label: "Бірнеше дұрыс жауап" },
  { value: "TEXT", label: "Мәтіндік жауап" },
];

function createQuestion(): TestQuestion {
  return {
    text: "",
    points: 1,
    type: "SINGLE",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ],
    attachments: [],
    files: [],
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
    initialQuestions.length
      ? initialQuestions.map((question) => ({
          id: question.id,
          text: question.text,
          points: question.points,
          type: question.type ?? "SINGLE",
          options: question.type === "TEXT" ? [] : question.options,
          attachments: question.attachments ?? [],
          files: [],
        }))
      : [createQuestion()],
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function setQuestion(index: number, patch: Partial<TestQuestion>) {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question));
  }

  function setOption(questionIndex: number, optionIndex: number, patch: Partial<TestOption>) {
    setQuestions((current) => current.map((question, currentQuestionIndex) =>
      currentQuestionIndex !== questionIndex
        ? question
        : { ...question, options: question.options.map((option, currentOptionIndex) => currentOptionIndex === optionIndex ? { ...option, ...patch } : option) },
    ));
  }

  function changeType(questionIndex: number, type: QuestionType) {
    setQuestions((current) => current.map((question, currentQuestionIndex) => {
      if (currentQuestionIndex !== questionIndex) return question;
      if (type === "TEXT") return { ...question, type, options: [] };
      const options = question.options.length >= 2
        ? question.options
        : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }];
      return { ...question, type, options };
    }));
  }

  function setCorrectOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) => current.map((question, currentQuestionIndex) => {
      if (currentQuestionIndex !== questionIndex) return question;
      if (question.type === "MULTIPLE") {
        return {
          ...question,
          options: question.options.map((option, currentOptionIndex) =>
            currentOptionIndex === optionIndex ? { ...option, isCorrect: !option.isCorrect } : option,
          ),
        };
      }
      return {
        ...question,
        options: question.options.map((option, currentOptionIndex) => ({ ...option, isCorrect: currentOptionIndex === optionIndex })),
      };
    }));
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index));
  }

  function addOption(questionIndex: number) {
    setQuestions((current) => current.map((question, currentQuestionIndex) =>
      currentQuestionIndex === questionIndex && question.options.length < 6
        ? { ...question, options: [...question.options, { text: "", isCorrect: false }] }
        : question,
    ));
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) => current.map((question, currentQuestionIndex) => {
      if (currentQuestionIndex !== questionIndex || question.options.length <= 2) return question;
      const next = question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex);
      if (!next.some((option) => option.isCorrect)) next[0] = { ...next[0], isCorrect: true };
      return { ...question, options: next };
    }));
  }

  function addFiles(questionIndex: number, list: FileList | null) {
    if (!list) return;
    setQuestions((current) => current.map((question, currentQuestionIndex) => {
      if (currentQuestionIndex !== questionIndex) return question;
      const incoming = Array.from(list).slice(0, 3 - question.files.length);
      return { ...question, files: [...question.files, ...incoming] };
    }));
  }

  function removeFile(questionIndex: number, fileIndex: number) {
    setQuestions((current) => current.map((question, currentQuestionIndex) =>
      currentQuestionIndex === questionIndex ? { ...question, files: question.files.filter((_, index) => index !== fileIndex) } : question,
    ));
  }

  function removeAttachment(questionIndex: number, path: string) {
    setQuestions((current) => current.map((question, currentQuestionIndex) =>
      currentQuestionIndex === questionIndex ? { ...question, attachments: question.attachments.filter((item) => item.path !== path) } : question,
    ));
  }

  async function save() {
    setLoading(true);
    setMessage("");

    try {
      const form = new FormData();
      const payload = {
        lessonId,
        title,
        instructions,
        passingScore: passingScore === "" ? null : Number(passingScore),
        maxAttempts: Number(maxAttempts),
        active,
        questions: questions.map((question) => ({
          id: question.id,
          text: question.text,
          points: question.points,
          type: question.type,
          options: question.options,
          attachments: question.attachments,
          newFileCount: question.files.length,
        })),
      };

      form.append("payload", JSON.stringify(payload));
      questions.forEach((question, questionIndex) => {
        question.files.forEach((file, fileIndex) => {
          form.append("q" + questionIndex + "_file" + fileIndex, file);
        });
      });

      const response = await fetch("/api/chief-mentor/tests", { method: "POST", body: form });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(data?.error ?? "Тест сақталмады.");
        return;
      }

      setMessage("Тест сақталды.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-[11px] border border-[#E8E1DA] bg-white px-3.5 py-2 text-[9px] font-extrabold text-[#4B433C] transition hover:border-[#FFB067]"
      >
        <FilePlus2 size={12} />
        {test ? "Тестті өңдеу" : "Тест жасау"}
      </button>

      <StaffModal
        open={open}
        onClose={() => { if (!loading) setOpen(false); }}
        title={test ? "Тестті өңдеу" : "Жаңа тест"}
        description="Сұрақ түрін таңдап, қажет болса файл тіркеңіз."
      >
        <div className="grid gap-4">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C] sm:col-span-2">
              Тест атауы
              <input value={title} onChange={(event) => setTitle(event.target.value)} className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Өту балы, %
              <input type="number" min="0" max="100" value={passingScore} onChange={(event) => setPassingScore(event.target.value)} className={staffInputClass + " mt-1.5"} />
            </label>
            <label className="text-[10px] font-extrabold text-[#5B534C]">
              Тапсыру мүмкіндігі
              <input type="number" min="1" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} className={staffInputClass + " mt-1.5"} />
            </label>
          </div>

          <label className="text-[10px] font-extrabold text-[#5B534C]">
            Нұсқаулық
            <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={2} className="mt-1.5 w-full resize-none rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF8000]" />
          </label>

          <label className="flex items-center gap-2 text-[10px] font-extrabold text-[#5B534C]">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
            Белсенді
          </label>

          <div className="space-y-2.5">
            {questions.map((question, questionIndex) => (
              <div key={question.id ?? questionIndex} className="rounded-[16px] border border-[#E8E1DA] bg-[#FFFCF9] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-extrabold text-[#172235]">Сұрақ {questionIndex + 1}</p>
                  {questions.length > 1 ? (
                    <button type="button" onClick={() => removeQuestion(questionIndex)} className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#B54D2B]">
                      <Trash2 size={11} />Өшіру
                    </button>
                  ) : null}
                </div>

                <div className="mt-3">
                  <StaffSelectMenu
                    value={question.type}
                    options={questionTypeOptions}
                    onChange={(value) => changeType(questionIndex, value as QuestionType)}
                  />
                </div>

                <textarea
                  value={question.text}
                  onChange={(event) => setQuestion(questionIndex, { text: event.target.value })}
                  rows={3}
                  placeholder="Сұрақ мәтіні"
                  className="mt-2.5 w-full resize-none rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF8000]"
                />

                {question.type !== "TEXT" ? (
                  <div className="mt-2.5 space-y-1.5">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(questionIndex, optionIndex)}
                          className={[
                            "grid h-7 w-7 shrink-0 place-items-center rounded-full border transition",
                            option.isCorrect ? "border-[#FF8000] bg-[#FFF1E2] text-[#FF8000]" : "border-[#D9D1C8] bg-white text-transparent",
                          ].join(" ")}
                          aria-label="Дұрыс жауапты таңдау"
                        >
                          <Check size={13} />
                        </button>
                        <input
                          value={option.text}
                          onChange={(event) => setOption(questionIndex, optionIndex, { text: event.target.value })}
                          placeholder={"Нұсқа " + (optionIndex + 1)}
                          className={staffInputClass + " h-10"}
                        />
                        {question.options.length > 2 ? (
                          <button type="button" onClick={() => removeOption(questionIndex, optionIndex)} className="grid h-8 w-8 place-items-center rounded-[9px] text-[#B54D2B]" aria-label="Нұсқаны өшіру">
                            <Trash2 size={12} />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={question.options.length >= 6}
                      onClick={() => addOption(questionIndex)}
                      className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#FF8000] disabled:opacity-50"
                    >
                      <Plus size={11} />Нұсқа қосу
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[9px] font-semibold leading-5 text-[#8A4B1F]">
                    Бұл сұраққа оқушы еркін мәтін жазады.
                  </div>
                )}

                <div className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border border-dashed border-[#DCCFC5] bg-white px-3 py-2.5 text-[9px] font-extrabold text-[#5B534C]">
                      <FilePlus2 size={13} />
                      Файл қосу
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
                        className="sr-only"
                        onChange={(event) => {
                          addFiles(questionIndex, event.target.files);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <p className="mt-1 text-[8px] font-semibold text-[#9A9189]">Сурет, PDF немесе Word · 10 МБ-қа дейін</p>
                    {(question.attachments.length || question.files.length) ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {question.attachments.map((attachment) => (
                          <span key={attachment.path} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[8px] font-bold text-[#5B534C]">
                            {attachment.name}
                            <button type="button" onClick={() => removeAttachment(questionIndex, attachment.path)} className="text-[#B54D2B]"><X size={10} /></button>
                          </span>
                        ))}
                        {question.files.map((file, fileIndex) => (
                          <span key={file.name + fileIndex} className="inline-flex items-center gap-1 rounded-full bg-[#FFF1E2] px-2.5 py-1.5 text-[8px] font-bold text-[#8A4B1F]">
                            {file.name}
                            <button type="button" onClick={() => removeFile(questionIndex, fileIndex)} className="text-[#B54D2B]"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <label className="text-[10px] font-extrabold text-[#5B534C]">
                    Ұпай
                    <input type="number" min="0" value={question.points} onChange={(event) => setQuestion(questionIndex, { points: Number(event.target.value) })} className={staffInputClass + " mt-1.5 w-28"} />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={addQuestion} className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#E8E1DA] bg-white px-3.5 py-2.5 text-[9px] font-extrabold text-[#4B433C]">
              <Plus size={12} />Сұрақ қосу
            </button>
            <PrimaryButton type="button" onClick={() => void save()} disabled={loading}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Сақтау
            </PrimaryButton>
          </div>

          {message ? <p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-bold text-[#B95D00]">{message}</p> : null}
        </div>
      </StaffModal>
    </>
  );
}
