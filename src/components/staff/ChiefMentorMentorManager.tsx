"use client";

import { useState } from "react";
import { Check, Loader2, Search, UserPlus } from "lucide-react";
import { formatKzPhone, isValidKzPhone } from "@/lib/phone";
import { StaffModal } from "@/components/staff/StaffUI";
import { StatusPill } from "@/components/ui/ShyraqUI";

type Mentor = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  team_count: number;
  student_count: number;
  attendance: number;
  reports_reviewed: number;
};

type Lookup = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  team_name: string | null;
};

export function ChiefMentorMentorManager({ initialMentors }: { initialMentors: Mentor[] }) {
  const [mentors, setMentors] = useState(initialMentors);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function search() {
    setLoading(true); setMessage(""); setLookup(null);
    try {
      const r = await fetch("/api/chief-mentor/mentors/lookup", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone})
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Іздеу сәтсіз аяқталды.");
      setLookup(d.profile ?? null);
      if (!d.profile) setMessage("Бұл нөмірмен аккаунт табылмады.");
    } catch(e) { setMessage(e instanceof Error ? e.message : "Қате"); }
    finally { setLoading(false); }
  }

  async function addMentor() {
    if (!lookup) return;
    setSavingId(lookup.id); setMessage("");
    try {
      const r = await fetch("/api/chief-mentor/mentors/" + lookup.id, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({role:"MENTOR",status:"ACTIVE"})
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Менторды қосу сәтсіз аяқталды.");
      setMentors(current => current.some(x=>x.id===d.profile.id)
        ? current.map(x=>x.id===d.profile.id?{...x,...d.profile}:x)
        : [{...d.profile, team_count:0, student_count:0, attendance:0, reports_reviewed:0}, ...current]);
      setOpen(false); setLookup(null); setPhone("");
    } catch(e) { setMessage(e instanceof Error ? e.message : "Қате"); }
    finally { setSavingId(null); }
  }

  async function setStatus(id:string, status:string) {
    setSavingId(id); setMessage("");
    try {
      const r=await fetch("/api/chief-mentor/mentors/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error ?? "Статус өзгертілмеді.");
      setMentors(current=>current.map(m=>m.id===id?{...m,...d.profile}:m));
    } catch(e){setMessage(e instanceof Error?e.message:"Қате");}
    finally{setSavingId(null);}
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3 sm:px-6">
        <p className="text-[9px] font-semibold text-[#8B8179]">{mentors.length} ментор</p>
        <button type="button" onClick={()=>{setOpen(true);setMessage("");setLookup(null);setPhone("");}}
          className="inline-flex min-h-10 items-center gap-2 rounded-[12px] bg-[var(--accent)] px-4 py-2.5 text-[10px] font-extrabold text-white">
          <UserPlus size={14}/> Ментор қосу
        </button>
      </div>

      <StaffModal open={open} onClose={()=>!loading && setOpen(false)} title="Ментор қосу" description="Платформада тіркелген телефон нөмірін табыңыз.">
        <div className="grid gap-4">
          <div className="flex gap-2">
            <input value={phone} onChange={e=>setPhone(formatKzPhone(e.target.value))} maxLength={18} inputMode="tel"
              placeholder="+7 (700) 000 00 00" className="min-w-0 flex-1 rounded-[13px] border border-[#E8E1DA] bg-white px-3.5 py-3 text-xs font-semibold outline-none focus:border-[var(--accent)]"/>
            <button type="button" disabled={loading || !isValidKzPhone(phone)} onClick={()=>void search()}
              className="grid h-[46px] w-[46px] place-items-center rounded-[13px] bg-[var(--accent)] text-white disabled:opacity-50">
              {loading?<Loader2 size={16} className="animate-spin"/>:<Search size={16}/>}
            </button>
          </div>
          {lookup ? (
            <div className="rounded-[16px] border border-[#E8E1DA] bg-[#FFFCF9] p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-extrabold text-[#172235]">{lookup.full_name}</p><p className="mt-1 text-[10px] text-[#8B8179]">{lookup.email}</p></div>
                <StatusPill tone={lookup.role==="MENTOR"?"green":lookup.role==="STUDENT"?"orange":"neutral"}>{lookup.role}</StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["Телефон",lookup.phone],["Қазіргі статус",lookup.status],["Команда",lookup.team_name??"—"]
                ].map(([label,value])=><div key={label} className="rounded-[11px] bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">{label}</p><p className="mt-1 truncate text-[10px] font-bold text-[#172235]">{value}</p></div>)}
              </div>
              <button type="button" disabled={savingId===lookup.id} onClick={()=>void addMentor()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#172235] px-4 py-3 text-[10px] font-extrabold text-white">
                {savingId===lookup.id?<Loader2 size={14} className="animate-spin"/>:<Check size={14}/>} Ментор ретінде қосу
              </button>
            </div>
          ) : <div className="rounded-[16px] border border-dashed border-[#DDD6CE] bg-[#FFFCF9] p-7 text-center text-[10px] font-semibold text-[#8B8179]">Алдымен телефон нөмірі арқылы қолданушыны табыңыз.</div>}
          {message?<p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-semibold text-[#8A4B1F]">{message}</p>:null}
        </div>
      </StaffModal>

      <div className="divide-y divide-[#EFE8E1]">
        {mentors.map(mentor=>(
          <div key={mentor.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.25fr_110px_110px_120px_170px] lg:items-center lg:px-6">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-extrabold text-[#354153]">{mentor.full_name}</p>
              <p className="mt-1 truncate text-[9px] text-[#9A9189]">{mentor.email} · {mentor.phone || "Телефон жоқ"}</p>
            </div>
            <p className="text-[10px] font-extrabold text-[#4B433C]">{mentor.team_count} команда</p>
            <p className="text-[10px] font-extrabold text-[#4B433C]">{mentor.student_count} оқушы</p>
            <p className="text-[10px] font-extrabold text-[#4B433C]">{mentor.attendance ? mentor.attendance.toFixed(1)+"%" : "—"}</p>
            <div className="flex items-center justify-end gap-2">
              <StatusPill tone={mentor.status==="ACTIVE"?"green":"red"}>{mentor.status==="ACTIVE"?"Белсенді":"Өшірулі"}</StatusPill>
              <button type="button" disabled={savingId===mentor.id} onClick={()=>void setStatus(mentor.id, mentor.status==="ACTIVE"?"INACTIVE":"ACTIVE")}
                className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold">
                {savingId===mentor.id?"...":mentor.status==="ACTIVE"?"Өшіру":"Қосу"}
              </button>
            </div>
          </div>
        ))}
        {!mentors.length?<div className="p-8 text-center text-xs font-semibold text-[#8B8179]">Ментор жоқ.</div>:null}
      </div>
    </div>
  );
}
