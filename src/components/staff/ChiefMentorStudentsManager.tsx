"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, Search, UserRound } from "lucide-react";
import { StatusPill } from "@/components/ui/ShyraqUI";

type Row={id:string;full_name:string;email:string;phone:string;status:string;team_id:string|null;team_name:string|null;mentor_name:string|null;score:number;attendance:number;report_count:number;task_count:number;video:number};
type Team={id:string;name:string;capacity:number|null;count:number};

export function ChiefMentorStudentsManager({initialStudents,teams}:{initialStudents:Row[];teams:Team[]}) {
  const [rows,setRows]=useState(initialStudents);
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("ALL");
  const [team,setTeam]=useState("ALL");
  const [saving,setSaving]=useState<string|null>(null);
  const [message,setMessage]=useState("");

  const filtered=useMemo(()=>rows.filter(row=>{
    const q=query.trim().toLowerCase();
    const qMatch=!q||[row.full_name,row.email,row.phone,row.team_name??"",row.mentor_name??""].join(" ").toLowerCase().includes(q);
    return qMatch&&(status==="ALL"||row.status===status)&&(team==="ALL"||row.team_id===team);
  }),[rows,query,status,team]);

  async function move(id:string,nextTeamId:string){
    setSaving(id);setMessage("");
    try{
      const r=await fetch("/api/chief-mentor/students/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({teamId:nextTeamId||null})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error??"Команданы өзгерту сәтсіз аяқталды.");
      setRows(current=>current.map(row=>row.id===id?{...row,team_id:nextTeamId||null,team_name:teams.find(t=>t.id===nextTeamId)?.name??null,mentor_name:teams.find(t=>t.id===nextTeamId)?.name?row.mentor_name:null}:row));
    }catch(e){setMessage(e instanceof Error?e.message:"Қате");}
    finally{setSaving(null);}
  }

  return <div>
    <div className="flex flex-col gap-2 border-b border-[#EFE8E1] bg-[#FFFCF9] p-4 sm:flex-row">
      <div className="relative min-w-0 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A19890]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Оқушы, телефон, команда..." className="h-10 w-full rounded-[11px] border border-[#E8E1DA] bg-white pl-9 pr-3 text-[10px] font-semibold outline-none focus:border-[var(--accent)]"/></div>
      <select value={status} onChange={e=>setStatus(e.target.value)} className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold"><option value="ALL">Барлық статус</option><option value="ACTIVE">Белсенді</option><option value="WAITING_FOR_TEAM">Команда күтуде</option><option value="INACTIVE">Өшірулі</option><option value="COMPLETED">Аяқтаған</option></select>
      <select value={team} onChange={e=>setTeam(e.target.value)} className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold"><option value="ALL">Барлық команда</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
    </div>
    {message?<p className="border-b border-[#EFE8E1] px-4 py-2.5 text-[9px] font-semibold text-[#B54D2B]">{message}</p>:null}
    <div className="divide-y divide-[#EFE8E1]">
      {filtered.map(row=><div key={row.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.45fr_1fr_100px_100px_110px_190px] lg:items-center lg:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFF1E2] text-[var(--accent)]"><UserRound size={14}/></span><div className="min-w-0"><Link href={"/chief-mentor/students/"+row.id} className="truncate text-[11px] font-extrabold text-[#354153] hover:text-[var(--accent)]">{row.full_name}</Link><p className="mt-1 truncate text-[9px] text-[#9A9189]">{row.email} · {row.phone}</p></div></div>
        <div className="min-w-0"><p className="truncate text-[10px] font-extrabold text-[#4B433C]">{row.team_name??"Команда жоқ"}</p><p className="mt-1 truncate text-[9px] text-[#9A9189]">{row.mentor_name??"Ментор жоқ"}</p></div>
        <p className="text-[10px] font-extrabold text-[#4B433C]">{row.score}</p><div><p className="text-[10px] font-extrabold text-[#4B433C]">{row.attendance?row.attendance.toFixed(0)+"%":"—"}</p>{row.attendance>0&&row.attendance<60?<span className="mt-1 inline-flex rounded-full bg-[#FFF0EE] px-2 py-0.5 text-[7px] font-extrabold text-[#BF514A]">Проблема</span>:null}</div><StatusPill tone={row.status==="ACTIVE"?"green":row.status==="INACTIVE"?"red":"orange"}>{row.status}</StatusPill>
        <div className="flex items-center justify-end gap-2"><select disabled={saving===row.id} value={row.team_id??""} onChange={e=>void move(row.id,e.target.value)} className="min-w-0 rounded-[10px] border border-[#E8E1DA] bg-white px-2.5 py-2 text-[9px] font-bold"><option value="">Командасыз</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name} ({t.count}/{t.capacity??"—"})</option>)}</select><ArrowRightLeft size={13} className={saving===row.id?"animate-pulse text-[var(--accent)]":"text-[#A19890]"}/></div>
      </div>)}
      {!filtered.length?<div className="p-10 text-center text-xs font-semibold text-[#8B8179]">Сұранысқа сәйкес оқушы табылмады.</div>:null}
    </div>
    <div className="border-t border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3 text-[9px] font-bold text-[#8B8179]">{filtered.length} / {rows.length} оқушы</div>
  </div>;
}
