"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Search,
  UsersRound,
} from "lucide-react";
import { StatusPill } from "@/components/ui/ShyraqUI";

type Row = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  team_id: string | null;
  team_name: string | null;
  mentor_name: string | null;
  score: number;
  report_count: number;
  task_count: number;
  video: number;
};

type Team = {
  id: string;
  name: string;
  capacity: number | null;
  count: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "О";
}

function statusText(status: string) {
  if (status === "ACTIVE") return "Белсенді";
  if (status === "INACTIVE") return "Өшірулі";
  if (status === "WAITING_FOR_TEAM") return "Команда күтуде";
  if (status === "REGISTERED") return "Тіркелген";
  if (status === "COMPLETED") return "Аяқтаған";
  return status;
}

export function ChiefMentorStudentsManager({
  initialStudents,
  teams,
}: {
  initialStudents: Row[];
  teams: Team[];
}) {
  const [rows, setRows] = useState(initialStudents);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [team, setTeam] = useState("ALL");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const q = query.trim().toLowerCase();
        const qMatch =
          !q ||
          [row.full_name, row.email, row.phone, row.team_name ?? "", row.mentor_name ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(q);
        return (
          qMatch &&
          (status === "ALL" || row.status === status) &&
          (team === "ALL" || row.team_id === team)
        );
      }),
    [rows, query, status, team],
  );

  const averageVideo = filtered.length
    ? filtered.reduce((sum, row) => sum + row.video, 0) / filtered.length
    : 0;

  const activeCount = filtered.filter((row) => row.status === "ACTIVE").length;

  async function move(id: string, nextTeamId: string) {
    setSaving(id);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/students/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: nextTeamId || null }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Команданы өзгерту сәтсіз аяқталды.");
      }

      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                team_id: nextTeamId || null,
                team_name: teams.find((item) => item.id === nextTeamId)?.name ?? null,
              }
            : row,
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div className="border-b border-[#EFE8E1] bg-[#FFFCF9] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {([
            ["ОҚУШЫ", String(filtered.length), "көрсетілген", UsersRound],
            ["БЕЙНЕ КӨРУ", averageVideo ? averageVideo.toFixed(1) + "%" : "—", "орташа coverage", CheckCircle2],
          ] as Array<[string, string, string, typeof UsersRound]>).map(([label, value, hint, Icon]) => {
            const MetricIcon = Icon as typeof CheckCircle2;
            return (
              <div
                key={String(label)}
                className="rounded-[18px] border border-[#E8E1DA] bg-white px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#A19890]">
                      {label}
                    </p>
                    <p className="mt-1 text-[22px] font-extrabold tracking-[-.045em] text-[#172235]">
                      {value}
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold text-[#8B8179]">{hint}</p>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
                    <MetricIcon size={15} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2.5 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A19890]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Оқушы, телефон, email немесе команда..."
              className="h-10 w-full rounded-[12px] border border-[#E8E1DA] bg-white pl-9 pr-3 text-[10px] font-semibold outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[#FF8000]/10"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold"
          >
            <option value="ALL">Барлық статус</option>
            <option value="ACTIVE">Белсенді</option>
            <option value="WAITING_FOR_TEAM">Команда күтуде</option>
            <option value="INACTIVE">Өшірулі</option>
            <option value="COMPLETED">Аяқтаған</option>
          </select>

          <select
            value={team}
            onChange={(event) => setTeam(event.target.value)}
            className="h-10 rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold"
          >
            <option value="ALL">Барлық команда</option>
            {teams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {message ? (
          <p className="mt-3 rounded-[12px] border border-[#F2D8D1] bg-[#FFF5F2] px-3 py-2.5 text-[9px] font-semibold text-[#B54D2B]">
            {message}
          </p>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[1120px]">
          <div className="grid grid-cols-[54px_2.4fr_1.1fr_110px_110px_130px_190px] items-center gap-3 border-b border-[#EFE8E1] bg-[#FAF8F5] px-5 py-3 text-[8px] font-extrabold uppercase tracking-[.13em] text-[#9A9189]">
            <span>№</span>
            <span>ОҚУШЫ</span>
            <span>БЕЙНЕ</span>
            <span>ҰПАЙ</span>
            <span>ТАПСЫРМА</span>
            <span>СТАТУС</span>
            <span className="text-right">КОМАНДА</span>
          </div>

          <div className="divide-y divide-[#F0EBE6]">
            {filtered.map((row, index) => {
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[54px_2.4fr_1.1fr_110px_110px_130px_190px] items-center gap-3 px-5 py-3.5 transition hover:bg-[#FFFCF9]"
                >
                  <span className="text-[10px] font-bold text-[#A19890]">{index + 1}</span>

                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#172235] text-[9px] font-extrabold text-white">
                      {initials(row.full_name)}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={"/chief-mentor/students/" + row.id}
                        className="block truncate text-[11px] font-extrabold text-[#263247] hover:text-[#FF8000]"
                      >
                        {row.full_name}
                      </Link>
                      <p className="mt-0.5 truncate text-[8px] font-semibold text-[#9A9189]">
                        {row.email}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] font-extrabold text-[#334054]">
                    {row.video ? row.video.toFixed(1) + "%" : "—"}
                  </p>

                  <p className="text-[11px] font-extrabold text-[#334054]">{row.score || "0"}</p>

                  <p className="text-[10px] font-extrabold text-[#334054]">
                    {row.task_count || 0}
                  </p>

                  <StatusPill
                    tone={
                      row.status === "ACTIVE"
                        ? "green"
                        : row.status === "INACTIVE"
                          ? "red"
                          : "orange"
                    }
                  >
                    {statusText(row.status)}
                  </StatusPill>

                  <div className="flex items-center justify-end gap-2">
                    <select
                      disabled={saving === row.id}
                      value={row.team_id ?? ""}
                      onChange={(event) => void move(row.id, event.target.value)}
                      className="min-w-0 rounded-[10px] border border-[#E8E1DA] bg-white px-2.5 py-2 text-[9px] font-bold outline-none focus:border-[#FF8000]"
                    >
                      <option value="">Командасыз</option>
                      {teams.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.count}/{item.capacity ?? "—"})
                        </option>
                      ))}
                    </select>
                    <ArrowRightLeft
                      size={13}
                      className={
                        saving === row.id
                          ? "animate-pulse text-[#FF8000]"
                          : "text-[#A19890]"
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#EFE8E1] lg:hidden">
        {filtered.map((row) => (
          <div key={row.id} className="space-y-3 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">
                {initials(row.full_name)}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={"/chief-mentor/students/" + row.id}
                  className="block truncate text-[11px] font-extrabold text-[#263247]"
                >
                  {row.full_name}
                </Link>
                <p className="mt-1 truncate text-[8px] font-semibold text-[#9A9189]">
                  {row.email}
                </p>
              </div>
              <StatusPill
                tone={
                  row.status === "ACTIVE"
                    ? "green"
                    : row.status === "INACTIVE"
                      ? "red"
                      : "orange"
                }
              >
                {statusText(row.status)}
              </StatusPill>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Бейне", row.video ? row.video.toFixed(1) + "%" : "—"],
                ["Ұпай", String(row.score || 0)],
                ["Тапсырма", String(row.task_count || 0)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[12px] bg-[#FAF8F5] px-3 py-2.5">
                  <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#A19890]">
                    {label}
                  </p>
                  <p className="mt-1 text-[13px] font-extrabold text-[#334054]">{value}</p>
                </div>
              ))}
            </div>

            <select
              disabled={saving === row.id}
              value={row.team_id ?? ""}
              onChange={(event) => void move(row.id, event.target.value)}
              className="h-10 w-full rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold"
            >
              <option value="">Командасыз</option>
              {teams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.count}/{item.capacity ?? "—"})
                </option>
              ))}
            </select>
          </div>
        ))}

        {!filtered.length ? (
          <div className="p-10 text-center text-xs font-semibold text-[#8B8179]">
            Сұранысқа сәйкес оқушы табылмады.
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3">
        <span className="text-[9px] font-bold text-[#8B8179]">
          {filtered.length} / {rows.length} оқушы
        </span>
        <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-[#FF8000]">
          Толық профиль
          <ArrowRight size={12} />
        </span>
      </div>
    </div>
  );
}
