"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

type Mentor = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  mentor_id: string | null;
  mentor_name: string | null;
  mentor_avatar_url: string | null;
  capacity: number | null;
  student_count: number;
  status: string;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "М"
  );
}

export function ChiefMentorTeamsManager({
  initialTeams,
  initialMentors,
}: {
  initialTeams: TeamRow[];
  initialMentors: Mentor[];
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [mentors] = useState(initialMentors);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftMentorId, setDraftMentorId] = useState("");
  const [draftCapacity, setDraftCapacity] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("kk-KZ");
    if (!q) return teams;

    return teams.filter((team) =>
      [team.name, team.mentor_name ?? ""]
        .join(" ")
        .toLocaleLowerCase("kk-KZ")
        .includes(q),
    );
  }, [teams, searchQuery]);

  const totalTeams = teams.length;
  const teamsWithStudents = teams.filter((team) => team.student_count > 0).length;
  const freeSeats = teams.reduce((sum, team) => {
    const capacityValue = Number(team.capacity ?? 0);
    return sum + Math.max(0, capacityValue - team.student_count);
  }, 0);

  const activeTeams = teams.filter((team) => team.status === "ACTIVE").length;

  function resetAdd() {
    setOpenAdd(false);
    setName("");
    setCapacity("");
    setAddMessage("");
    setAddLoading(false);
  }

  function startEdit(team: TeamRow) {
    setEditingId(team.id);
    setDraftName(team.name);
    setDraftMentorId(team.mentor_id ?? "");
    setDraftCapacity(String(team.capacity ?? ""));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftName("");
    setDraftMentorId("");
    setDraftCapacity("");
  }

  async function createTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddLoading(true);
    setAddMessage("");

    try {
      const response = await fetch("/api/chief-mentor/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          capacity: Number(capacity),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Команда сақталмады.");
      }

      const team = data.team;
      setTeams((current) => [
        ...current,
        {
          id: team.id,
          name: team.name,
          mentor_id: team.mentor_id,
          mentor_name: null,
          mentor_avatar_url: null,
          capacity: team.capacity,
          student_count: 0,
          status: team.status,
        },
      ].sort((a, b) => a.name.localeCompare(b.name, "kk")));

      resetAdd();
    } catch (error) {
      setAddMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setAddLoading(false);
    }
  }

  async function saveEdit(teamId: string) {
    setSavingId(teamId);

    try {
      const response = await fetch("/api/chief-mentor/teams/" + teamId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName.trim(),
          mentorId: draftMentorId || null,
          capacity: Number(draftCapacity),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Команданы сақтау сәтсіз аяқталды.");
      }

      const mentor = mentors.find((item) => item.id === draftMentorId);
      setTeams((current) =>
        current.map((team) =>
          team.id === teamId
            ? {
                ...team,
                name: data.team.name,
                mentor_id: data.team.mentor_id,
                mentor_name: mentor?.full_name ?? null,
                mentor_avatar_url: mentor?.avatar_url ?? null,
                capacity: data.team.capacity,
                status: data.team.status,
              }
            : team,
        ).sort((a, b) => a.name.localeCompare(b.name, "kk")),
      );
      cancelEdit();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Қате");
    } finally {
      setSavingId(null);
    }
  }

  async function disableTeam(team: TeamRow) {
    const confirmed = window.confirm(
      `«${team.name}» командасын өшірулі күйге ауыстыру керек пе?`,
    );
    if (!confirmed) return;

    setSavingId(team.id);

    try {
      const response = await fetch("/api/chief-mentor/teams/" + team.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: team.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Команда күйін өзгерту сәтсіз аяқталды.");
      }

      setTeams((current) =>
        current.map((item) =>
          item.id === team.id ? { ...item, status: data.team.status } : item,
        ),
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Қате");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[25px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[30px]">
          Командалар
        </h1>

        <button
          type="button"
          onClick={() => {
            setName("");
            setCapacity("");
            setAddMessage("");
            setOpenAdd(true);
          }}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[11px] bg-[var(--accent)] px-4 text-[10px] font-extrabold text-white shadow-[0_8px_18px_rgba(255,128,0,.13)] transition hover:bg-[#E56F00]"
        >
          <Plus size={14} />
          Команда қосу
        </button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          ["Командалар", totalTeams],
          ["Оқушысы бар", teamsWithStudents],
          ["Бос орын", freeSeats],
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
            placeholder="Команданы іздеу..."
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

      {openAdd ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#172235]/42 p-4 backdrop-blur-[10px] sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[410px] overflow-hidden rounded-[20px] border border-white/90 bg-white shadow-[0_24px_80px_rgba(23,34,53,.28)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E8E1DA] px-4 py-3.5">
              <h2 className="text-[16px] font-extrabold tracking-[-.03em] text-[#172235]">
                Команда қосу
              </h2>
              <button
                type="button"
                onClick={resetAdd}
                disabled={addLoading}
                className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#E8E1DA] bg-white text-[#5B534C] disabled:opacity-50"
                aria-label="Жабу"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={createTeam} className="space-y-3 p-4">
              <label className="block text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8B8179]">
                Команда атауы
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoFocus
                  placeholder="Мысалы: Самғау"
                  className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E1DA] bg-white px-3.5 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
                />
              </label>

              <label className="block text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8B8179]">
                Оқушылар сыйымдылығы
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  required
                  placeholder="10"
                  className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E1DA] bg-white px-3.5 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
                />
              </label>

              {addMessage ? (
                <p className="rounded-[11px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-semibold text-[#8A4B1F]">
                  {addMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={addLoading || !name.trim() || !capacity}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[11px] bg-[#172235] text-[10px] font-extrabold text-white disabled:opacity-50"
              >
                {addLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Команда қосу
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[18px] border border-[#E8E1DA] bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.35fr_1.15fr_120px_150px_120px] items-center gap-4 border-b border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.09em] text-[#81776F]">
              <span>Команда</span>
              <span>Ментор</span>
              <span>Оқушылар</span>
              <span>Сыйымдылық</span>
              <span>Әрекет</span>
            </div>

            <div className="divide-y divide-[#EFE8E1]">
              {filteredTeams.map((team) => {
                const editing = editingId === team.id;
                const capacity = Number(team.capacity ?? 0);
                const isFull = capacity > 0 && team.student_count >= capacity;
                const inactive = team.status !== "ACTIVE";

                return (
                  <div
                    key={team.id}
                    className={[
                      "grid grid-cols-[1.35fr_1.15fr_120px_150px_120px] items-center gap-4 px-5 py-3.5",
                      inactive ? "bg-[#FAF8F5] opacity-65" : "",
                    ].join(" ")}
                  >
                    {editing ? (
                      <>
                        <input
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          className="h-10 min-w-0 rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000]"
                        />

                        <select
                          value={draftMentorId}
                          onChange={(event) => setDraftMentorId(event.target.value)}
                          className="h-10 min-w-0 rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000]"
                        >
                          <option value="">Ментор жоқ</option>
                          {mentors.map((mentor) => (
                            <option key={mentor.id} value={mentor.id}>
                              {mentor.full_name}
                            </option>
                          ))}
                        </select>

                        <span className="text-[13px] font-extrabold text-[#172235]">
                          {team.student_count}
                        </span>

                        <input
                          type="number"
                          min={Math.max(1, team.student_count)}
                          value={draftCapacity}
                          onChange={(event) => setDraftCapacity(event.target.value)}
                          className="h-10 min-w-0 rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000]"
                        />

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingId === team.id}
                            className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#E8E1DA] bg-white text-[#5B534C]"
                            aria-label="Бас тарту"
                          >
                            <X size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveEdit(team.id)}
                            disabled={savingId === team.id || !draftName.trim() || !draftCapacity}
                            className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#172235] text-white disabled:opacity-50"
                            aria-label="Сақтау"
                          >
                            {savingId === team.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              "✓"
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-extrabold text-[#263247]">
                            {team.name}
                          </p>
                          {inactive ? (
                            <p className="mt-0.5 text-[9px] font-extrabold text-[#9A9189]">
                              Өшірулі
                            </p>
                          ) : null}
                        </div>

                        <div className="flex min-w-0 items-center gap-2.5">
                          {team.mentor_avatar_url ? (
                            <Image
                              src={team.mentor_avatar_url}
                              alt=""
                              width={34}
                              height={34}
                              unoptimized
                              className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#FFF1E2] text-[9px] font-extrabold text-[#C15F00]">
                              {team.mentor_name ? initials(team.mentor_name) : "—"}
                            </span>
                          )}
                          <span className="truncate text-[12px] font-extrabold text-[#354153]">
                            {team.mentor_name || "Ментор жоқ"}
                          </span>
                        </div>

                        <span className="text-[13px] font-extrabold text-[#172235]">
                          {team.student_count}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-extrabold text-[#354153]">
                              {team.student_count} / {capacity || "—"}
                            </span>
                            {isFull ? (
                              <span className="text-[9px] font-extrabold text-[#C04F43]">
                                Толы
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EFEAE4]">
                            <div
                              className="h-full rounded-full bg-[var(--accent)]"
                              style={{
                                width: capacity
                                  ? Math.min(100, (team.student_count / capacity) * 100) + "%"
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(team)}
                            className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#E8E1DA] bg-white text-[#4B433C] transition hover:border-[#FFB067] hover:bg-[#FFFCF9]"
                            aria-label="Өңдеу"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void disableTeam(team)}
                            disabled={savingId === team.id}
                            className={[
                              "grid h-9 w-9 place-items-center rounded-[10px] border bg-white transition",
                              inactive
                                ? "border-[#CDE7D8] text-[#2E7E58]"
                                : "border-[#F0D4D0] text-[#B84B42] hover:bg-[#FFF5F2]",
                            ].join(" ")}
                            aria-label={inactive ? "Қосу" : "Өшіру"}
                          >
                            {savingId === team.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : inactive ? (
                              "↻"
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {!filteredTeams.length ? (
                <div className="px-5 py-10 text-center text-[11px] font-semibold text-[#8B8179]">
                  Команда табылмады.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[9px] font-semibold text-[#9A9189]">
        Белсенді командалар: {activeTeams}
      </div>
    </div>
  );
}
