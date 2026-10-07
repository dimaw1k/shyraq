"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Plus, RefreshCw, Unplug } from "lucide-react";
import { StatusPill } from "@/components/ui/ShyraqUI";

type Team = { id: string; name: string; capacity: number | null };
type StudyTime = "MORNING" | "EVENING";

type Space = {
  id: string;
  team_id: string;
  display_name: string;
  meeting_url: string;
  external_space_id: string;
  study_time: StudyTime;
  active: boolean;
  team_name: string;
};

export function ChiefMentorMeetManager({
  teams,
  initialSpaces,
  googleConnected,
}: {
  teams: Team[];
  initialSpaces: Space[];
  googleConnected: boolean;
}) {
  const [spaces, setSpaces] = useState(initialSpaces);
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [displayName, setDisplayName] = useState("");
  const [studyTime, setStudyTime] = useState<StudyTime>("MORNING");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function selectedTeamName() {
    return teams.find((team) => team.id === teamId)?.name ?? "Команда";
  }

  async function createMeet() {
    if (!teamId) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/meet/space", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          displayName:
            displayName.trim() ||
            selectedTeamName() + " — " + (studyTime === "MORNING" ? "Morning Study Time" : "Evening Study Time"),
          studyTime,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Google Meet жасау сәтсіз аяқталды.");
      }

      const team = teams.find((item) => item.id === teamId);
      if (data.space) {
        setSpaces((current) => [
          ...current.filter(
            (space) =>
              !(space.team_id === teamId && space.study_time === studyTime),
          ),
          { ...data.space, team_name: team?.name ?? "Команда" },
        ]);
      }
      setDisplayName("");
      setMessage(
        (studyTime === "MORNING" ? "Таңғы" : "Кешкі") +
          " Study Time Meet сәтті жасалды.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  async function sync(space: Space) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/meet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: space.team_id, studyTime: space.study_time }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Кездесуді жаңарту сәтсіз аяқталды.");
      }

      setMessage(
        "Жаңартылды: " +
          String(data.attendanceRows ?? 0) +
          " қатысу жазбасы.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(space: Space) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/chief-mentor/meet/spaces/" + space.id,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !space.active }),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Өзгертілмеді.");
      }

      setSpaces((current) =>
        current.map((item) =>
          item.id === space.id ? { ...item, ...data.space } : item,
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/integrations/google/disconnect", {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ?? "Google аккаунтын ажырату сәтсіз аяқталды.",
        );
      }

      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4">
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[220px] flex-1">
            <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">
              Google Meet
            </p>
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              disabled={!googleConnected || loading}
              className="h-10 w-full rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold outline-none focus:border-[var(--accent)]"
            >
              <option value="">Команданы таңдаңыз</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[170px]">
            <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">
              Study Time
            </p>
            <select
              value={studyTime}
              onChange={(event) => setStudyTime(event.target.value as StudyTime)}
              disabled={!googleConnected || loading}
              className="h-10 w-full rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold outline-none focus:border-[var(--accent)]"
            >
              <option value="MORNING">Morning Study Time</option>
              <option value="EVENING">Evening Study Time</option>
            </select>
          </div>

          <div className="min-w-[220px] flex-1">
            <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">
              Кездесу атауы
            </p>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={!googleConnected || loading}
              placeholder="Команда — Google Meet"
              className="h-10 w-full rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-semibold outline-none focus:border-[var(--accent)] disabled:bg-[#F7F3EF]"
            />
          </div>

          {!googleConnected ? (
            <a
              href="/api/integrations/google/start?returnTo=%2Fchief-mentor%2Fmeet"
              className="inline-flex h-10 items-center gap-2 rounded-[11px] bg-[#172235] px-4 text-[10px] font-extrabold text-white"
            >
              Google қосу
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void createMeet()}
                disabled={loading || !teamId}
                className="inline-flex h-10 items-center gap-2 rounded-[11px] bg-[var(--accent)] px-4 text-[10px] font-extrabold text-white disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Meet жасау
              </button>

              <button
                type="button"
                onClick={() => void disconnect()}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-[#E8E1DA] bg-white px-4 text-[10px] font-extrabold text-[#5B534C] disabled:opacity-50"
              >
                <Unplug size={13} />
                Ажырату
              </button>
            </>
          )}
        </div>

        {googleConnected ? (
          <p className="mt-2 text-[8px] font-semibold text-[#8B8179]">
            Бас ментордың Google аккаунты арқылы Meet кеңістігі жасалады.
          </p>
        ) : null}

        {message ? (
          <p className="mt-2 text-[9px] font-semibold text-[#6F665D]">
            {message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {spaces.map((space) => (
          <div
            key={space.id}
            className="rounded-[18px] border border-[#E8E1DA] bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-extrabold text-[#172235]">
                  {space.display_name}
                </p>
                <p className="mt-1 truncate text-[9px] font-semibold text-[#9A9189]">
                  {space.team_name} · {space.study_time === "MORNING" ? "Morning Study Time" : "Evening Study Time"}
                </p>
              </div>
              <StatusPill tone={space.active ? "green" : "red"}>
                {space.active ? "Белсенді" : "Өшірулі"}
              </StatusPill>
            </div>

            <a
              href={space.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block truncate text-[9px] font-extrabold text-[var(--accent)]"
            >
              {space.meeting_url}
            </a>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => void sync(space)}
                disabled={loading || !googleConnected}
                className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-[#E8E1DA] bg-white px-2.5 text-[8px] font-extrabold text-[#4B433C] disabled:opacity-50"
              >
                <RefreshCw size={12} />
                Қатысуды жаңарту
              </button>

              <button
                type="button"
                onClick={() => void toggle(space)}
                disabled={loading}
                className="h-8 rounded-[9px] border border-[#E8E1DA] bg-white px-2.5 text-[8px] font-extrabold text-[#4B433C]"
              >
                {space.active ? "Өшіру" : "Қосу"}
              </button>

              <a
                href={space.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#172235] px-2.5 text-[8px] font-extrabold text-white"
              >
                <ExternalLink size={12} />
                Meet-ке кіру
              </a>
            </div>
          </div>
        ))}

        {!spaces.length ? (
          <div className="rounded-[18px] border border-dashed border-[#DDD6CE] p-8 text-center text-xs font-semibold text-[#8B8179] md:col-span-2">
            Әзірге Meet бөлмесі жасалмаған.
          </div>
        ) : null}
      </div>
    </div>
  );
}
