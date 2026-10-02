"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";

export function TaskSubmissionReviewActions({submissionId,status,points}:{submissionId:string;status:string;points:number}){
  const [currentStatus,setCurrentStatus]=useState(status); const [loading,setLoading]=useState<"REVIEWED"|"REJECTED"|"DRAFT"|null>(null);
  const [comment,setComment]=useState(""); const [deadline,setDeadline]=useState(""); const [message,setMessage]=useState("");

  async function review(nextStatus:"REVIEWED"|"REJECTED"|"DRAFT"){
    setLoading(nextStatus);setMessage("");
    try{
      const response=await fetch("/api/staff/task-submissions/"+submissionId,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:nextStatus,reviewComment:comment,resubmissionDeadline:deadline?new Date(deadline).toISOString():null})});
      const data=await response.json().catch(()=>null); if(!response.ok)throw new Error(data?.error??"Review сәтсіз аяқталды.");
      setCurrentStatus(data?.submission?.status??nextStatus);
      setMessage(nextStatus==="REVIEWED"?(data?.scoreAwarded?"Тексерілді · +"+points+" ұпай":"Тексерілді"):nextStatus==="REJECTED"?"Қайтарылды.":"Қайта тапсыруға ашылды.");
    }catch(error){setMessage(error instanceof Error?error.message:"Белгісіз қате.");}finally{setLoading(null);}
  }

  if(currentStatus==="REVIEWED")return <div className="text-right"><span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#3D7A4B]"><Check size={11}/>Тексерілді</span>{message?<p className="mt-1 text-[8px] font-semibold text-[#7F756D]">{message}</p>:null}</div>;

  return <div className="flex flex-col items-end gap-2">
    {currentStatus==="REJECTED" ? <button type="button" disabled={loading!==null} onClick={()=>void review("DRAFT")} className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#4B433C]"><RotateCcw size={11}/>{loading==="DRAFT"?"...":"Қайта ашу"}</button> : <>
      <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2} placeholder="Ментор комментарийі" className="w-full rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[#FF6F2C]"/>
      <input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} className="w-full rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-semibold"/>
      <div className="flex gap-2">
        <PrimaryButton type="button" className="!min-h-8 !rounded-[10px] !px-3 !py-1.5 !text-[9px]" disabled={loading!==null} onClick={()=>void review("REVIEWED")}>{loading==="REVIEWED"?"...":"Тексеру"}</PrimaryButton>
        <button type="button" className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E9D8CF] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#B54D2B]" disabled={loading!==null} onClick={()=>void review("REJECTED")}>{loading==="REJECTED"?"...":"Қайтару"}</button>
      </div>
    </>}
    {message?<p className="max-w-[260px] text-right text-[8px] font-semibold text-[#7F756D]">{message}</p>:null}
  </div>;
}
