"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

type TeamOption = { id: string; name: string };

export function StaffCreateTaskForm({ teams = [] }: { teams?: TeamOption[] }) {
  const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");
  const [title,setTitle]=useState(""); const [description,setDescription]=useState(""); const [teamId,setTeamId]=useState("");
  const [marathonDay,setMarathonDay]=useState(""); const [taskOrder,setTaskOrder]=useState("0"); const [startsAt,setStartsAt]=useState(""); const [deadline,setDeadline]=useState("");
  const [points,setPoints]=useState("0"); const [latePointsPercent,setLatePointsPercent]=useState("100"); const [maxFiles,setMaxFiles]=useState("5"); const [attachmentRequired,setAttachmentRequired]=useState(false);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault(); setLoading(true); setMessage("");
    try{
      const response=await fetch("/api/chief-mentor/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        title,description,teamId:teamId||null,marathonDay:marathonDay?Number(marathonDay):null,taskOrder:Number(taskOrder||0),
        startsAt:startsAt?new Date(startsAt).toISOString():null,deadline:deadline?new Date(deadline).toISOString():null,
        points:Number(points),latePointsPercent:Number(latePointsPercent),maxFiles:Number(maxFiles),attachmentRequired,active:true
      })});
      const data=await response.json().catch(()=>({})); if(!response.ok){setMessage(data.error??"Тапсырма сақталмады.");return;}
      setTitle("");setDescription("");setTeamId("");setMarathonDay("");setTaskOrder("0");setStartsAt("");setDeadline("");setPoints("0");setLatePointsPercent("100");setMaxFiles("5");setAttachmentRequired(false);setMessage("Тапсырма сәтті қосылды.");
    } finally{setLoading(false);}
  }

  const input="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF6F2C]";
  return <form onSubmit={submit} className="grid gap-2.5 rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 lg:grid-cols-[1fr_1.4fr_120px_90px_170px_170px_80px_auto]">
    <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Тапсырма атауы" required className={input}/>
    <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Сипаттама" required className={input}/>
    <input type="number" min="1" max="21" value={marathonDay} onChange={e=>setMarathonDay(e.target.value)} placeholder="Күн" className={input}/>
    <input type="number" min="0" value={taskOrder} onChange={e=>setTaskOrder(e.target.value)} placeholder="Рет" className={input}/>
    <select value={teamId} onChange={e=>setTeamId(e.target.value)} className={input}><option value="">Барлық командалар</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
    <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} className={input} title="Ашылу уақыты"/>
    <input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} className={input} title="Deadline"/>
    <div className="flex items-center gap-2"><input type="number" min="0" value={points} onChange={e=>setPoints(e.target.value)} placeholder="Ұпай" className={input+" w-20"}/><input type="number" min="0" max="100" value={latePointsPercent} onChange={e=>setLatePointsPercent(e.target.value)} placeholder="Кеш %" className={input+" w-20"}/><input type="number" min="0" max="100" value={latePointsPercent} onChange={e=>setLatePointsPercent(e.target.value)} placeholder="Late %" className={input+" w-16"}/><input type="number" min="1" max="10" value={maxFiles} onChange={e=>setMaxFiles(e.target.value)} placeholder="Файл" className={input+" w-16"}/><label className="flex items-center gap-1 text-[9px] font-bold text-[#5B534C]"><input type="checkbox" checked={attachmentRequired} onChange={e=>setAttachmentRequired(e.target.checked)}/>Файл</label><PrimaryButton type="submit" disabled={loading}>{loading?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>}Қосу</PrimaryButton></div>
    {message?<p className="text-[9px] font-semibold text-[#7F756D] lg:col-span-8">{message}</p>:null}
  </form>;
}
