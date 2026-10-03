"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/ShyraqUI";

type Settings = { name: string; default_video_watch_percent: number; default_team_capacity: number; updated_at: string };
type Rule = { id: string; code: string; label: string; weight: number; active: boolean; updated_at: string };

function normalizeRules(items: Rule[]) {
  return (items ?? []).map((item) => ({ ...item, weight: Number(item.weight ?? 0) }));
}

export function ChiefMentorSettingsManager() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/chief-mentor/settings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, settings: data.settings as Settings | null, rules: normalizeRules(data.rules ?? []) };
      })
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setSettings(result.settings);
          setRules(result.rules);
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("Баптауларды жүктеу мүмкін болмады.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            name: settings.name,
            defaultVideoWatchPercent: Number(settings.default_video_watch_percent),
            defaultTeamCapacity: Number(settings.default_team_capacity),
          },
          rules,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error ?? "Сақталмады.");

      setSettings(data.settings);
      setRules(normalizeRules(data.rules ?? []));
      setMessage("Баптаулар сақталды.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card className="p-6 text-sm font-semibold text-[#8B8179]">Жүктелуде...</Card>;
  if (!settings) return <Card className="p-6 text-sm font-semibold text-[#8B8179]">Баптаулар табылмады.</Card>;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">МАРАФОН</p>
            <p className="mt-1 text-[18px] font-extrabold text-[#172235]">Операциялық параметрлер</p>
          </div>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-[11px] bg-[var(--accent)] px-4 py-2.5 text-[10px] font-extrabold text-white"
          >
            <Save size={13} />
            {saving ? "Сақталуда..." : "Сақтау"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="text-[10px] font-extrabold text-[#5B534C]">
            Атауы
            <input
              value={settings.name}
              onChange={(event) => setSettings({ ...settings, name: event.target.value })}
              className="mt-1.5 h-10 w-full rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[11px] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="text-[10px] font-extrabold text-[#5B534C]">
            Видео көру %
            <input
              type="number"
              min="0"
              max="100"
              value={settings.default_video_watch_percent}
              onChange={(event) => setSettings({ ...settings, default_video_watch_percent: Number(event.target.value) })}
              className="mt-1.5 h-10 w-full rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[11px] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="text-[10px] font-extrabold text-[#5B534C]">
            Әдепкі команда сыйымдылығы
            <input
              type="number"
              min="1"
              value={settings.default_team_capacity}
              onChange={(event) => setSettings({ ...settings, default_team_capacity: Number(event.target.value) })}
              className="mt-1.5 h-10 w-full rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[11px] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        {message ? <p className="mt-3 text-[9px] font-semibold text-[#6F665E]">{message}</p> : null}
      </Card>

      <Card className="p-5">
        <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">ҰПАЙ ЖҮЙЕСІ</p>
        <p className="mt-1 text-[18px] font-extrabold text-[#172235]">Ұпай ережелері</p>
        <div className="mt-4 space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="grid gap-3 rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 sm:grid-cols-[1fr_120px_auto] sm:items-center"
            >
              <div>
                <p className="text-[10px] font-extrabold text-[#172235]">{rule.label}</p>
                <p className="mt-1 text-[8px] text-[#9A9189]">{rule.code}</p>
              </div>
              <input
                type="number"
                value={rule.weight}
                onChange={(event) =>
                  setRules((current) =>
                    current.map((item) =>
                      item.id === rule.id ? { ...item, weight: Number(event.target.value) } : item,
                    ),
                  )
                }
                className="h-9 rounded-[10px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-extrabold"
              />
              <button
                type="button"
                onClick={() =>
                  setRules((current) =>
                    current.map((item) => (item.id === rule.id ? { ...item, active: !item.active } : item)),
                  )
                }
                className={[
                  "rounded-[10px] px-3 py-2 text-[9px] font-extrabold",
                  rule.active ? "bg-[#EDF8F2] text-[#2E7E58]" : "bg-[#F4F1EC] text-[#7F756D]",
                ].join(" ")}
              >
                {rule.active ? "Белсенді" : "Өшірулі"}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
