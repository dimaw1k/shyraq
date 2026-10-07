"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import { formatKzPhone, isValidKzPhone } from "@/lib/phone";

type StudentRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  avatar_url: string | null;
  team_id: string | null;
  team_name: string | null;
};

type Team = {
  id: string;
  name: string;
  capacity: number | null;
  count: number;
};

type Stats = {
  total: number;
  assigned: number;
  unassigned: number;
};

type Lookup = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  avatar_url: string | null;
  team_name: string | null;
  team_id: string | null;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "О"
  );
}

export function ChiefMentorStudentsManager({
  initialStudents,
  teams: initialTeams,
  initialStats,
}: {
  initialStudents: StudentRow[];
  teams: Team[];
  initialStats: Stats;
}) {
  const [rows, setRows] = useState(initialStudents);
  const [teams, setTeams] = useState(initialTeams);
  const [stats, setStats] = useState(initialStats);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [message, setMessage] = useState("");
  const [savingAdd, setSavingAdd] = useState(false);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("kk-KZ");
    if (!q) return rows;

    return rows.filter((row) =>
      [row.full_name, row.email, row.phone, row.team_name ?? ""]
        .join(" ")
        .toLocaleLowerCase("kk-KZ")
        .includes(q),
    );
  }, [rows, searchQuery]);

  function refreshStats(nextRows: StudentRow[]) {
    const assigned = nextRows.filter((row) => Boolean(row.team_id)).length;
    setStats({
      total: nextRows.length,
      assigned,
      unassigned: nextRows.length - assigned,
    });
  }

  function resetAddModal() {
    setOpenAdd(false);
    setIdentifier("");
    setLookup(null);
    setSelectedTeamId("");
    setMessage("");
    setLookupLoading(false);
    setSavingAdd(false);
  }

  function openAddModal() {
    setIdentifier("");
    setLookup(null);
    setSelectedTeamId("");
    setMessage("");
    setOpenAdd(true);
  }

  async function lookupStudent() {
    const value = identifier.trim();
    if (!value) return;

    setLookupLoading(true);
    setLookup(null);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/students/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: value }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Оқушыны іздеу сәтсіз аяқталды.");
      }

      if (!data.profile) {
        setMessage("Бұл телефон немесе email арқылы аккаунт табылмады.");
        return;
      }

      setLookup(data.profile);
      setSelectedTeamId(data.profile.team_id ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setLookupLoading(false);
    }
  }

  async function saveStudent() {
    if (!lookup || !selectedTeamId) {
      setMessage("Оқушыны қосу үшін команда таңдаңыз.");
      return;
    }

    setSavingAdd(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/students/" + lookup.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          allowAdd: true,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Оқушыны қосу сәтсіз аяқталды.");
      }

      const selectedTeam = teams.find((team) => team.id === selectedTeamId);
      const newRow: StudentRow = {
        id: lookup.id,
        full_name: lookup.full_name,
        email: lookup.email,
        phone: lookup.phone,
        status: data.profile?.status ?? "ACTIVE",
        avatar_url: lookup.avatar_url,
        team_id: selectedTeamId,
        team_name: selectedTeam?.name ?? null,
      };

      setRows((current) =>
        current.some((row) => row.id === lookup.id)
          ? current.map((row) => (row.id === lookup.id ? newRow : row))
          : [newRow, ...current],
      );

      setTeams((current) =>
        current.map((team) => {
          if (team.id === selectedTeamId) return { ...team, count: team.count + 1 };
          if (team.id === lookup.team_id) return { ...team, count: Math.max(0, team.count - 1) };
          return team;
        }),
      );

      const nextRows = rows.some((row) => row.id === lookup.id)
        ? rows.map((row) => (row.id === lookup.id ? newRow : row))
        : [newRow, ...rows];

      refreshStats(nextRows);
      resetAddModal();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setSavingAdd(false);
    }
  }

  async function changeTeam(studentId: string, nextTeamId: string) {
    setSavingId(studentId);
    setMessage("");

    try {
      const previous = rows.find((row) => row.id === studentId);
      const response = await fetch("/api/chief-mentor/students/" + studentId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: nextTeamId || null }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Команданы өзгерту сәтсіз аяқталды.");
      }

      const nextTeam = teams.find((team) => team.id === nextTeamId);

      setRows((current) =>
        current.map((row) =>
          row.id === studentId
            ? {
                ...row,
                team_id: nextTeamId || null,
                team_name: nextTeam?.name ?? null,
                status: data.profile?.status ?? row.status,
              }
            : row,
        ),
      );

      setTeams((current) =>
        current.map((team) => {
          if (team.id === nextTeamId) return { ...team, count: team.count + 1 };
          if (team.id === previous?.team_id) return { ...team, count: Math.max(0, team.count - 1) };
          return team;
        }),
      );

      const nextRows = rows.map((row) =>
        row.id === studentId
          ? {
              ...row,
              team_id: nextTeamId || null,
              team_name: nextTeam?.name ?? null,
            }
          : row,
      );
      refreshStats(nextRows);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[25px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[30px]">
          Оқушылар
        </h1>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[11px] bg-[var(--accent)] px-4 text-[10px] font-extrabold text-white shadow-[0_8px_18px_rgba(255,128,0,.13)] transition hover:bg-[#E56F00]"
        >
          <UserPlus size={14} />
          Оқушы қосу
        </button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          ["Оқушылар", stats.total],
          ["Командасы бар", stats.assigned],
          ["Командасы жоқ", stats.unassigned],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-[15px] border border-[#E8E1DA] bg-white px-4 py-3"
          >
            <p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#9A9189]">
              {label}
            </p>
            <p className="mt-1 text-[23px] font-extrabold leading-none tracking-[-.045em] text-[#172235]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A19890]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Оқушыны іздеу..."
            className="h-11 w-full rounded-[13px] border border-[#E8E1DA] bg-white pl-10 pr-3.5 text-[11px] font-semibold text-[#172235] outline-none transition focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
          />
        </div>
        <button
          type="button"
          onClick={() => setSearchQuery(query.trim())}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[13px] bg-[#172235] px-4 text-[10px] font-extrabold text-white"
        >
          <Search size={14} />
          Іздеу
        </button>
      </div>

      {message && !openAdd ? (
        <p className="rounded-[11px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-semibold text-[#8A4B1F]">
          {message}
        </p>
      ) : null}

      {openAdd ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#172235]/30 p-4 backdrop-blur-[3px]">
          <div
            role="dialog"
            aria-modal="true"
            className={[
              "w-full overflow-hidden rounded-[20px] border border-white/80 bg-[#FAF9F7] shadow-[0_24px_70px_rgba(23,34,53,.22)]",
              lookup ? "max-w-[520px]" : "max-w-[410px]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E8E1DA] px-4 py-3.5">
              <h2 className="text-[16px] font-extrabold tracking-[-.03em] text-[#172235]">
                Оқушы қосу
              </h2>
              <button
                type="button"
                onClick={resetAddModal}
                disabled={lookupLoading || savingAdd}
                className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#E8E1DA] bg-white text-[#5B534C] disabled:opacity-50"
                aria-label="Жабу"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex gap-2">
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void lookupStudent();
                  }}
                  autoFocus
                  placeholder="Телефон немесе email"
                  className="h-11 min-w-0 flex-1 rounded-[12px] border border-[#E8E1DA] bg-white px-3.5 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
                />
                <button
                  type="button"
                  disabled={lookupLoading || !identifier.trim()}
                  onClick={() => void lookupStudent()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--accent)] text-white disabled:opacity-50"
                  aria-label="Іздеу"
                >
                  {lookupLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Search size={15} />
                  )}
                </button>
              </div>

              {lookup ? (
                <div className="mt-3 rounded-[15px] border border-[#E8E1DA] bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    {lookup.avatar_url ? (
                      <Image
                        src={lookup.avatar_url}
                        alt=""
                        width={44}
                        height={44}
                        unoptimized
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FFF1E2] text-[11px] font-extrabold text-[#C15F00]">
                        {initials(lookup.full_name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-extrabold text-[#172235]">
                        {lookup.full_name}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-[#8F857D]">
                        {lookup.email}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-[#8F857D]">
                        {lookup.phone || "—"}
                      </p>
                    </div>
                  </div>

                  {lookup.team_id ? (
                    <div className="mt-3 rounded-[12px] bg-[#FFFCF9] px-3 py-2.5">
                      <p className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">
                        Қазіргі команда
                      </p>
                      <p className="mt-1 text-[11px] font-extrabold text-[#172235]">
                        {lookup.team_name || "Команда"}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <label className="text-[8px] font-extrabold uppercase tracking-[.1em] text-[#A19890]">
                      Команда
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={(event) => setSelectedTeamId(event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[11px] font-bold text-[#172235] outline-none focus:border-[#FF8000]"
                    >
                      <option value="" disabled>
                        Команда таңдаңыз
                      </option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.count}/{team.capacity ?? "—"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={savingAdd || !selectedTeamId}
                    onClick={() => void saveStudent()}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[11px] bg-[#172235] text-[10px] font-extrabold text-white disabled:opacity-50"
                  >
                    {savingAdd ? <Loader2 size={14} className="animate-spin" /> : null}
                    {lookup.team_id ? "Команданы сақтау" : "Оқушыны командаға қосу"}
                  </button>
                </div>
              ) : null}

              {message ? (
                <p className="mt-3 rounded-[11px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-semibold text-[#8A4B1F]">
                  {message}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[18px] border border-[#E8E1DA] bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.35fr_1.15fr_.8fr_1fr] items-center gap-4 border-b border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.09em] text-[#81776F]">
              <span>Оқушы</span>
              <span>Почта</span>
              <span>Телефон</span>
              <span>Команда</span>
            </div>

            <div className="divide-y divide-[#EFE8E1]">
              {filteredRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.35fr_1.15fr_.8fr_1fr] items-center gap-4 px-5 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {row.avatar_url ? (
                      <Image
                        src={row.avatar_url}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[rgba(255,128,0,.12)]"
                      />
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FFF1E2] text-[10px] font-extrabold text-[#C15F00]">
                        {initials(row.full_name)}
                      </span>
                    )}
                    <p className="truncate text-[13px] font-extrabold text-[#263247]">
                      {row.full_name}
                    </p>
                  </div>

                  <p className="truncate text-[12px] font-semibold text-[#5E554E]">
                    {row.email || "—"}
                  </p>

                  <p className="text-[12px] font-extrabold text-[#354153]">
                    {row.phone || "—"}
                  </p>

                  <select
                    disabled={savingId === row.id}
                    value={row.team_id ?? ""}
                    onChange={(event) =>
                      void changeTeam(row.id, event.target.value)
                    }
                    className="h-10 min-w-0 rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[11px] font-bold text-[#172235] outline-none focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/10 disabled:opacity-60"
                  >
                    <option value="">Командасыз</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.count}/{team.capacity ?? "—"})
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {!filteredRows.length ? (
                <div className="px-5 py-10 text-center text-[11px] font-semibold text-[#8B8179]">
                  Оқушы табылмады.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
