"use client";
import { useEffect,useState } from "react";
import { StatusPill } from "@/components/ui/ShyraqUI";
type Ticket={id:string;category:string;subject:string;message:string;status:string;staff_note:string|null;created_at:string;updated_at:string;profiles:{full_name:string;phone:string;email:string}|null};
export function ChiefMentorSupportManager(){
 const [tickets,setTickets]=useState<Ticket[]>([]);const [notes,setNotes]=useState<Record<string,string>>({});const [loading,setLoading]=useState<string|null>(null);
 async function load(){const r=await fetch("/api/chief-mentor/support",{cache:"no-store"});const d=await r.json().catch(()=>({}));if(r.ok)setTickets(d.tickets??[]);}
 useEffect(()=>{void load();},[]);
 async function update(id:string,status:string){setLoading(id);try{const r=await fetch("/api/chief-mentor/support",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status,staffNote:notes[id]??""})});if(r.ok)await load();}finally{setLoading(null);}}
 return <div className="space-y-3">{!tickets.length?<div className="rounded-[16px] bg-[#F6F2ED] p-6 text-center text-xs font-semibold text-[#8B8179]">Жаңа қолдау өтініштері жоқ.</div>:tickets.map(t=><div key={t.id} className="rounded-[18px] border border-[#E8E1DA] bg-white p-5">
  <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[var(--accent)]">{t.category}</p><p className="mt-1 text-sm font-extrabold text-[#172235]">{t.subject}</p><p className="mt-1 text-[9px] text-[#8B8179]">{t.profiles?.full_name??"Оқушы"} · {t.profiles?.phone??""}</p></div><StatusPill tone={t.status==="RESOLVED"?"green":t.status==="IN_PROGRESS"?"orange":"red"}>{t.status}</StatusPill></div>
  <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[#5C5149]">{t.message}</p><textarea value={notes[t.id]??t.staff_note??""} onChange={e=>setNotes(c=>({...c,[t.id]:e.target.value}))} rows={3} placeholder="Ішкі ескерту" className="mt-4 w-full rounded-[12px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 text-xs outline-none focus:border-[var(--accent)]"/>
  <div className="mt-3 flex flex-wrap gap-2"><button disabled={loading===t.id} onClick={()=>void update(t.id,"IN_PROGRESS")} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold">Қаралуда</button><button disabled={loading===t.id} onClick={()=>void update(t.id,"RESOLVED")} className="rounded-[10px] bg-[var(--accent)] px-3 py-2 text-[9px] font-extrabold text-white">Шешілді</button><button disabled={loading===t.id} onClick={()=>void update(t.id,"NEW")} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold">Жаңа</button></div>
 </div>)}</div>
}