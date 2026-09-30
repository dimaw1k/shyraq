"use client";

import { useState } from "react";

type Submission = { id: string; status: string; text_answer: string | null; submitted_at: string | null } | null;

export function TaskSubmissionForm({
  taskId,
  attachmentRequired,
  initialSubmission,
}: {
  taskId: string;
  attachmentRequired: boolean;
  initialSubmission: Submission;
}) {
  const [answer, setAnswer] = useState(initialSubmission?.text_answer ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (attachmentRequired && !file && !initialSubmission) {
      setMessage("Дәлел файлын тіркеңіз.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const draftResponse = await fetch("/api/tasks/" + taskId + "/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textAnswer: answer,
          finalize: !attachmentRequired && !file,
        }),
      });

      const draftData = await draftResponse.json().catch(() => ({}));
      if (!draftResponse.ok) throw new Error(draftData.error ?? "Жіберу кезінде қате болды.");

      const submissionId = draftData.submission?.id;
      if (!submissionId) throw new Error("Submission identifier was not returned.");

      if (file) {
        const formData = new FormData();
        formData.append("submissionId", submissionId);
        formData.append("file", file);

        const fileResponse = await fetch("/api/tasks/" + taskId + "/submissions/files", {
          method: "POST",
          body: formData,
        });
        const fileData = await fileResponse.json().catch(() => ({}));
        if (!fileResponse.ok) throw new Error(fileData.error ?? "Файл жүктелмеді.");
      }

      if (attachmentRequired || file) {
        const finalizeResponse = await fetch("/api/tasks/" + taskId + "/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ textAnswer: answer, finalize: true }),
        });
        const finalizeData = await finalizeResponse.json().catch(() => ({}));
        if (!finalizeResponse.ok) throw new Error(finalizeData.error ?? "Тапсырманы аяқтау кезінде қате болды.");
      }

      setMessage("Тапсырма жіберілді.");
      setFile(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Жіберу кезінде қате болды.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <h2 className="text-xl font-semibold">Жауап</h2>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={7}
        placeholder="Жауабыңызды жазыңыз..."
        className="mt-5 w-full rounded-xl border border-[var(--border)] px-4 py-3"
      />
      <label className="mt-5 block text-sm font-medium">
        {attachmentRequired ? "Дәлел файлы (міндетті)" : "Файл (қосымша)"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-xl border border-dashed border-[var(--border)] p-4 text-sm"
        />
      </label>
      {message ? <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm">{message}</div> : null}
      <button
        type="button"
        disabled={loading}
        onClick={submit}
        className="mt-5 w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Жіберілуде..." : "Жіберу"}
      </button>
    </section>
  );
}
