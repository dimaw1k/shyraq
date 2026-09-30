"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Rule = { id: string; code: string; label: string; weight: number; active: boolean };

export default function AdminScoreRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/score-rules");
    const data = await response.json();
    if (response.ok) setRules(data.rules ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function save(rule: Rule) {
    const response = await fetch("/api/admin/score-rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: rule.code, weight: Number(rule.weight), active: rule.active }),
    });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Сақталды." : (data.error ?? "Қате"));
    if (response.ok) await load();
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-semibold">← Admin</Link>
        <h1 className="mt-6 text-3xl font-semibold">Score rules</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Әр әрекет үшін берілетін ұпайды және rule active статусын басқарыңыз.</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          {rules.map((rule) => (
            <div key={rule.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[1.4fr_140px_120px_100px] sm:items-center">
              <div>
                <p className="font-semibold">{rule.label}</p>
                <p className="text-xs text-[var(--muted)]">{rule.code}</p>
              </div>
              <input
                type="number"
                step="0.1"
                value={rule.weight}
                onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, weight: Number(event.target.value) } : item))}
                className="rounded-xl border border-[var(--border)] px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={rule.active} onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, active: event.target.checked } : item))} />
                Active
              </label>
              <button type="button" onClick={() => save(rule)} className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white">Save</button>
            </div>
          ))}
          {!rules.length ? <div className="p-8 text-sm text-[var(--muted)]">Rules жоқ.</div> : null}
        </div>

        {message ? <p className="mt-4 text-sm text-[var(--muted)]">{message}</p> : null}
      </div>
    </main>
  );
}
