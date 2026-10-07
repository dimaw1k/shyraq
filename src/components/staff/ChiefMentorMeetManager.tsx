"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, ExternalLink, Link2, Loader2, Plus, RefreshCw, X } from "lucide-react";

type MeetType = "ALL" | "MORNING" | "EVENING" | "EXTRA";
type CreateType = Exclude<MeetType, "ALL">;
type Team = { id: string; name: string };
type MeetRow = {
  id: string; team_id: string; team_name: string; study_time: CreateType;
  display_name: string | null; meeting_url: string | null; conference_id: string | null;
  started_at: string | null; ended_at: string | null; attended: number; average: number;
  participated_rows: number; has_conference: boolean;
};
type HistoryRow = { id: string; student_name: string; team_name: string; type: string; percent: number; status: string };

function typeLabel(type: string) {
  if (type === "MORNING") return "Таңғы Meet";
  if (type === "EVENING") return "Кешкі Meet";
  return "Қосымша Meet";
}

export function ChiefMentorMeetManager({
  teams, rows, history, googleConnected, selectedDate, selectedType, stats,
}: {
  teams: Team[]; rows: MeetRow[]; history: HistoryRow[]; googleConnected: boolean;
  selectedDate: string; selectedType: MeetType;
  stats: { meetings: number; attended: number; average: number };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamChoice, setTeamChoice] = useState("ALL");
  const [createType, setCreateType] = useState<CreateType>("MORNING");
  const [displayName, setDisplayName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [syncTeamId, setSyncTeamId] = useState("ALL");
  const [syncType, setSyncType] = useState<CreateType>(selectedType === "ALL" ? "MORNING" : selectedType);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  function filter(date: string, type: MeetType) {
    const q = new URLSearchParams({ date });
    if (type !== "ALL") q.set("type", type);
    router.push("/chief-mentor/meet?" + q.toString());
  }

  function close() {
    if (createLoading) return;
    setOpen(false); setDisplayName(""); setTeamChoice("ALL"); setCreateType("MORNING"); setCreateMessage("");
  }

  async function createMeet() {
    setCreateLoading(true); setCreateMessage("");
    try {
      const r = await fetch("/api/chief-mentor/meet/space", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: teamChoice === "ALL" ? "" : teamChoice,
          allTeams: teamChoice === "ALL",
          studyTime: createType, displayName: displayName.trim(),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Meet жасау сәтсіз аяқталды.");
      close(); router.refresh();
      setSyncMessage(d.count > 1 ? d.count + " командаға Meet жасалды." : "Meet сәтті жасалды.");
    } catch (e) {
      setCreateMessage(e instanceof Error ? e.message : "Қате");
    } finally { setCreateLoading(false); }
  }

  async function syncMeet() {
    if (!googleConnected || !teams.length) return;
    setSyncLoading(true); setSyncMessage("");
    try {
      const startTime = new Date(selectedDate + "T00:00:00+05:00").toISOString();
      const endTime = new Date(selectedDate + "T23:59:59.999+05:00").toISOString();
      const targets = syncTeamId === "ALL" ? teams : teams.filter((t) => t.id === syncTeamId);
      let total = 0;
      for (const team of targets) {
        const r = await fetch("/api/chief-mentor/meet/sync", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: team.id, studyTime: syncType, startTime, endTime }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? (team.name + " синхронизациясы сәтсіз аяқталды."));
        total += Number(d.attendanceRows ?? 0);
      }
      setSyncMessage("Жаңартылды: " + total + " қатысу жазбасы.");
      router.refresh();
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : "Қате");
    } finally { setSyncLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[25px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[30px]">Кездесулер</h1>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[11px] bg-[var(--accent)] px-4 text-[10px] font-extrabold text-white shadow-[0_8px_18px_rgba(255,128,0,.13)]">
          <Plus size={14}/> Meet жасау
        </button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[13px] border border-[#E8E1DA] bg-white px-3.5">
          <CalendarDays size={15} className="shrink-0 text-[#A19890]"/>
          <span className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8B8179]">Күн</span>
          <input type="date" value={selectedDate} onChange={e => filter(e.target.value, selectedType)} className="h-11 min-w-0 flex-1 bg-transparent text-[11px] font-bold text-[#172235] outline-none"/>
        </label>
        <select value={selectedType} onChange={e => filter(selectedDate, e.target.value as MeetType)} className="h-11 rounded-[13px] border border-[#E8E1DA] bg-white px-3.5 text-[10px] font-extrabold text-[#172235] outline-none">
          <option value="ALL">Барлық Meet</option><option value="MORNING">Таңғы Meet</option><option value="EVENING">Кешкі Meet</option><option value="EXTRA">Қосымша Meet</option>
        </select>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[["Кездесулер", stats.meetings], ["Қатысқан оқушы", stats.attended], ["Орташа қатысу", stats.average ? stats.average + "%" : "—"]].map(([label,value]) => (
          <div key={String(label)} className="rounded-[15px] border border-[#E8E1DA] bg-white px-4 py-3">
            <p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#9A9189]">{label}</p>
            <p className="mt-1 text-[23px] font-extrabold leading-none tracking-[-.045em] text-[#172235]">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[18px] border border-[#E8E1DA] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">МИТ СИНХРОНИЗАЦИЯСЫ</p><p className="mt-1 text-[14px] font-extrabold text-[#172235]">{selectedDate} күнінің деректерін жаңарту</p></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[560px] lg:grid-cols-[1.2fr_1fr_auto]">
            <select value={syncTeamId} onChange={e=>setSyncTeamId(e.target.value)} className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold text-[#172235]"><option value="ALL">Барлық командалар</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <select value={syncType} onChange={e=>setSyncType(e.target.value as CreateType)} className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold text-[#172235]"><option value="MORNING">Таңғы Meet</option><option value="EVENING">Кешкі Meet</option><option value="EXTRA">Қосымша Meet</option></select>
            <button type="button" onClick={()=>void syncMeet()} disabled={syncLoading || !googleConnected} className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#172235] px-4 text-[10px] font-extrabold text-white disabled:opacity-50">{syncLoading?<Loader2 size={14} className="animate-spin"/>:<RefreshCw size={14}/>}Синхрондау</button>
          </div>
        </div>
        {!googleConnected ? <a href="/api/integrations/google/start?returnTo=%2Fchief-mentor%2Fmeet" className="mt-3 inline-flex h-9 items-center rounded-[10px] bg-[var(--accent)] px-3.5 text-[9px] font-extrabold text-white">Google қосу</a> : null}
        {syncMessage ? <p className="mt-3 rounded-[11px] bg-[#FFFCF9] px-3 py-2.5 text-[9px] font-semibold text-[#6F665D]">{syncMessage}</p> : null}
      </section>

      <section className="overflow-hidden rounded-[18px] border border-[#E8E1DA] bg-white">
        <div className="border-b border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3"><p className="text-[13px] font-extrabold text-[#172235]">{selectedDate} — Meet статистикасы</p></div>
        <div className="overflow-x-auto"><div className="min-w-[980px]">
          <div className="grid grid-cols-[1.15fr_1.25fr_150px_150px_180px] items-center gap-4 border-b border-[#EFE8E1] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#81776F]">
            <span>Команда</span><span>Ментор</span><span>Study Time</span><span>Қатысу</span><span>Meet сілтемесі</span>
          </div>
          <div className="divide-y divide-[#EFE8E1]">
            {rows.length ? rows.map(row => <MeetTableRow key={row.id} row={row}/>) : <div className="px-5 py-10 text-center text-[11px] font-semibold text-[#8B8179]">Таңдалған күн мен Meet түріне сәйкес жазба жоқ.</div>}
          </div>
        </div></div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-[#E8E1DA] bg-white">
        <div className="flex items-center justify-between border-b border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3"><p className="text-[13px] font-extrabold text-[#172235]">Қатысу тарихы</p><span className="text-[9px] font-extrabold text-[#9A9189]">{history.length} жазба</span></div>
        <div className="overflow-x-auto"><div className="min-w-[800px]">
          <div className="grid grid-cols-[1.4fr_1.1fr_140px_120px] gap-4 border-b border-[#EFE8E1] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#81776F]"><span>Оқушы</span><span>Команда</span><span>Meet түрі</span><span>Қатысу</span></div>
          <div className="divide-y divide-[#EFE8E1]">
            {history.length ? history.map(item => <div key={item.id} className="grid grid-cols-[1.4fr_1.1fr_140px_120px] items-center gap-4 px-5 py-3.5"><p className="truncate text-[12px] font-extrabold text-[#263247]">{item.student_name}</p><p className="truncate text-[11px] font-semibold text-[#5E554E]">{item.team_name}</p><p className="text-[11px] font-extrabold text-[#354153]">{typeLabel(item.type)}</p><p className="text-[12px] font-extrabold text-[#172235]">{item.percent.toFixed(1)}%</p></div>) : <div className="px-5 py-10 text-center text-[11px] font-semibold text-[#8B8179]">Бұл фильтрге сәйкес қатысу тарихы жоқ.</div>}
          </div>
        </div></div>
      </section>

      {open ? <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#172235]/42 p-4 backdrop-blur-[10px] sm:p-6">
        <div className="w-full max-w-[480px] overflow-hidden rounded-[20px] border border-white/90 bg-white shadow-[0_24px_80px_rgba(23,34,53,.28)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E8E1DA] px-4 py-3.5"><h2 className="text-[16px] font-extrabold text-[#172235]">Meet жасау</h2><button type="button" onClick={close} disabled={createLoading} className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#E8E1DA] bg-white text-[#5B534C]"><X size={15}/></button></div>
          <div className="grid gap-3 p-4">
            <label className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8B8179]">Командалар<select value={teamChoice} onChange={e=>setTeamChoice(e.target.value)} className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[11px] font-bold text-[#172235]"><option value="ALL">Барлық белсенді командалар</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8B8179]">Meet түрі<select value={createType} onChange={e=>setCreateType(e.target.value as CreateType)} className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E1DA] bg-white px-3 text-[11px] font-bold text-[#172235]"><option value="MORNING">Таңғы Meet</option><option value="EVENING">Кешкі Meet</option><option value="EXTRA">Қосымша Meet</option></select></label>
            <label className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8B8179]">Іс-шара атауы<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Мысалы: Қосымша кездесу" className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E8E1DA] bg-white px-3.5 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000]"/></label>
            {createMessage ? <p className="rounded-[11px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-semibold text-[#8A4B1F]">{createMessage}</p> : null}
            <button type="button" onClick={()=>void createMeet()} disabled={createLoading || !googleConnected} className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#172235] text-[10px] font-extrabold text-white disabled:opacity-50">{createLoading?<Loader2 size={14} className="animate-spin"/>:<Plus size={14}/>}Meet жасау</button>
            {!googleConnected ? <a href="/api/integrations/google/start?returnTo=%2Fchief-mentor%2Fmeet" className="inline-flex h-10 items-center justify-center rounded-[11px] bg-[var(--accent)] text-[10px] font-extrabold text-white">Google қосу</a> : null}
          </div>
        </div>
      </div> : null}
    </div>
  );
}

function MeetTableRow({ row }: { row: MeetRow }) {
  return <div className="grid grid-cols-[1.15fr_1.25fr_150px_150px_180px] items-center gap-4 px-5 py-3.5">
    <p className="truncate text-[13px] font-extrabold text-[#263247]">{row.team_name}</p>
    <p className="truncate text-[11px] font-semibold text-[#5E554E]">{row.mentor_name}</p>
    <span className={["inline-flex w-fit rounded-full px-2.5 py-1 text-[9px] font-extrabold",row.study_time==="MORNING"?"bg-[#FFF1E2] text-[#B95D00]":row.study_time==="EVENING"?"bg-[#EEF3FF] text-[#3E5C9D]":"bg-[#F1EEFF] text-[#6B56B6]"].join(" ")}>{typeLabel(row.study_time)}</span>
    <div>{row.has_conference ? <><p className="text-[12px] font-extrabold text-[#172235]">{row.attended}/{row.participated_rows}</p><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EFEAE4]"><div className="h-full rounded-full bg-[var(--accent)]" style={{width:Math.min(100,Math.max(0,row.average))+"%"}}/></div><p className="mt-1 text-[10px] font-extrabold text-[#5E554E]">{row.average}%</p></> : <span className="text-[10px] font-semibold text-[#A19890]">Өтпеген</span>}</div>
    <div className="flex items-center gap-2">{row.meeting_url ? <><a href={row.meeting_url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#172235] px-3 text-[9px] font-extrabold text-white"><ExternalLink size={12}/>Кіру</a><button type="button" onClick={()=>navigator.clipboard?.writeText(row.meeting_url ?? "")} className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#E8E1DA] bg-white text-[#5B534C]" aria-label="Сілтемені көшіру"><Link2 size={13}/></button></> : <span className="text-[10px] font-semibold text-[#A19890]">Сілтеме жоқ</span>}</div>
  </div>;
}
