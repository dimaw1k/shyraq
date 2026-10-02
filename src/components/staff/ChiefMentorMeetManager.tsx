"use client";
import { useState } from "react";
import { CalendarSync, Check, Loader2, Plus } from "lucide-react";
import { PrimaryButton, StatusPill } from "@/components/ui/ShyraqUI";

type Team={id:string;name:string;capacity:number|null};
type Space={id:string;team_id:string;display_name:string;meeting_url:string;external_space_id:string;active:boolean;team_name:string};

export function ChiefMentorMeetManager({teams,initialSpaces}:{teams:Team[];initialSpaces:Space[]}){
 const [spaces,setSpaces]=useState(initialSpaces);const [teamId,setTeamId]=useState(teams[0]?.id??"");const [displayName,setDisplayName]=useState("");const [url,setUrl]=useState("");const [spaceId,setSpaceId]=useState("");const [loading,setLoading]=useState(false);const [message,setMessage]=useState("");
 async function save(){setLoading(true);setMessage("");try{const r=await fetch("/api/chief-mentor/meet/spaces",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({teamId,displayName,meetingUrl:url,externalSpaceId:spaceId})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error??"Meet space сақталмады.");const team=teams.find(t=>t.id===teamId);setSpaces(c=>[...c.filter(s=>s.team_id!==teamId),{...d.space,team_name:team?.name??"Команда"}]);setMessage("Meet space сақталды.");}catch(e){setMessage(e instanceof Error?e.message:"Қате");}finally{setLoading(false);}}
 async function sync(space:Space){setLoading(true);setMessage("");try{const r=await fetch("/api/chief-mentor/meet/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({teamId:space.team_id})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error??"Meet синхрондау сәтсіз аяқталды.");setMessage("Жаңартылды: "+String(d.attendanceRows??0)+" attendance жазбасы.");}catch(e){setMessage(e instanceof Error?e.message:"Қате");}finally{setLoading(false);}}
 async function toggle(space:Space){setLoading(true);try{const r=await fetch("/api/chief-mentor/meet/spaces/"+space.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:!space.active})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error??"Өзгертілмеді.");setSpaces(c=>c.map(s=>s.id===space.id?{...s,...d.space}:s));}catch(e){setMessage(e instanceof Error?e.message:"Қате");}finally{setLoading(false);}}
 return <div className="space-y-5">
   <div className="rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4">
    <div className="flex items-center gap-2"><Plus size={15} className="text-[var(--accent)]"/><p className="text-[12px] font-extrabold text-[#172235]">Meet space қосу / өзгерту</p></div>
    <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_1.2fr_1fr_auto]">
      <select value={teamId} onChange={e=>setTeamId(e.target.value)} className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-bold"><option value="">Команда</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Кездесу атауы" className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-semibold"/>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://meet.google.com/..." className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-semibold"/>
      <input value={spaceId} onChange={e=>setSpaceId(e.target.value)} placeholder="Google space ID" className="h-10 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-semibold"/>
      <PrimaryButton type="button" onClick={()=>void save()} disabled={loading||!teamId}>{loading?<Loader2 size={13} className="animate-spin"/>:<Check size={13}/>} Сақтау</PrimaryButton>
    </div>
    {message?<p className="mt-2 text-[9px] font-semibold text-[#8B8179]">{message}</p>:null}
   </div>
   <div className="grid gap-3 md:grid-cols-2">
    {spaces.map(space=><div key={space.id} className="rounded-[18px] border border-[#E8E1DA] bg-white p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-extrabold text-[#172235]">{space.display_name}</p><p className="mt-1 text-[9px] font-semibold text-[#9A9189]">{space.team_name} · {space.external_space_id}</p></div><StatusPill tone={space.active?"green":"red"}>{space.active?"Белсенді":"Өшірулі"}</StatusPill></div>
      <a href={space.meeting_url} target="_blank" rel="noreferrer" className="mt-4 block truncate text-[10px] font-extrabold text-[var(--accent)]">{space.meeting_url}</a>
      <div className="mt-4 flex gap-2"><button type="button" onClick={()=>void sync(space)} disabled={loading} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold">Синхрондау</button><button type="button" onClick={()=>void toggle(space)} disabled={loading} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold">{space.active?"Өшіру":"Қосу"}</button><a href={space.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[10px] bg-[#172235] px-3 py-2 text-[9px] font-extrabold text-white"><CalendarSync size={12}/> Кіру</a></div>
    </div>)}
    {!spaces.length?<div className="rounded-[18px] border border-dashed border-[#DDD6CE] p-8 text-center text-xs font-semibold text-[#8B8179] md:col-span-2">Meet space әлі қосылмаған.</div>:null}
   </div>
 </div>
}
