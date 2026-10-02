"use client";

import { useState } from "react";
import { Save, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, StatusPill } from "@/components/ui/ShyraqUI";

type Rule = {
  id: string;
  code: string;
  label: string;
  weight: number;
  active: boolean;
  updated_at: string;
};

export function ScoreRulesManager({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState(
    initialRules.map((rule) => ({ ...rule, weight: Number(rule.weight ?? 0) })),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateRule(code: string, patch: Partial<Rule>) {
    setRules((current) =>
      current.map((rule) => (rule.code === code ? { ...rule, ...patch } : rule)),
    );
  }

  async function save() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/leader/score-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: rules.map((rule) => ({
            code: rule.code,
            weight: Number(rule.weight),
            active: Boolean(rule.active),
          })),
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Сақтау сәтсіз аяқталды.");

      setRules(
        (body?.rules ?? []).map((rule: Rule) => ({
          ...rule,
          weight: Number(rule.weight ?? 0),
        })),
      );
      setMessage("Ұпай ережелері сақталды.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">ҰПАЙ ЖҮЙЕСІ</p>
          <h2 className="mt-1.5 text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">Ұпай ережелері</h2>
          <p className="mt-1 text-[11px] font-medium leading-5 text-[#8E847B]">
            Әр әрекетке берілетін базалық ұпай.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#FF6F2C] px-4 py-2.5 text-[11px] font-extrabold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Сақталуда..." : "Сақтау"}
        </button>
      </div>

      <div className="mt-5 grid gap-2">
        {rules.map((rule) => (
          <div key={rule.code} className="grid gap-3 rounded-[16px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 sm:grid-cols-[minmax(0,1fr)_130px_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-extrabold text-[#172235]">{rule.label}</p>
                <StatusPill tone="orange">{rule.code}</StatusPill>
              </div>
              <p className="mt-1 text-[10px] font-medium text-[#9A9189]">
                Соңғы өзгеріс: {new Date(rule.updated_at).toLocaleString("kk-KZ")}
              </p>
            </div>

            <label className="flex items-center gap-2">
              <span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">Ұпай</span>
              <input
                type="number"
                min="0"
                max="10000"
                step="0.01"
                value={rule.weight}
                onChange={(event) => updateRule(rule.code, { weight: Number(event.target.value) })}
                className="w-full rounded-[11px] border border-[#E8E1DA] bg-white px-3 py-2 text-xs font-extrabold text-[#172235] outline-none focus:border-[#FF6F2C]"
              />
            </label>

            <button
              type="button"
              onClick={() => updateRule(rule.code, { active: !rule.active })}
              className="inline-flex items-center justify-start gap-2 text-[10px] font-extrabold text-[#6F665E]"
            >
              {rule.active ? <ToggleRight size={26} className="text-[#318562]" /> : <ToggleLeft size={26} className="text-[#A69C93]" />}
              {rule.active ? "Белсенді" : "Өшірулі"}
            </button>
          </div>
        ))}
      </div>

      {message ? (
        <p className="mt-4 rounded-[12px] bg-[#F6F2ED] px-3 py-2.5 text-[10px] font-semibold text-[#5F564E]">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
