"use client";

import { useState } from "react";
import { Paperclip, UploadCloud } from "lucide-react";

type Submission = {
  id: string;
  status: string;
  text_answer: string | null;
  link_url?: string | null;
  submitted_at: string | null;
  submitted_late?: boolean;
  review_comment?: string | null;
  resubmission_deadline?: string | null;
} | null;

const inputClass="mt-3 w-full rounded-[12px] border border-[#EFE8E1] bg-[#FFFCF9] p-3 text-xs outline-none focus:border-[#C25100]";

export function TaskSubmissionForm({
  taskId,
  attachmentRequired,
  maxFiles,
  initialSubmission,
  existingFileCount,
}: {
  taskId: string;
  attachmentRequired: boolean;
  maxFiles: number;
  initialSubmission: Submission;
  existingFileCount: number;
}) {
  const [answer,setAnswer]=useState(initialSubmission?.text_answer??"");
  const [linkUrl,setLinkUrl]=useState(initialSubmission?.link_url??"");
  const [files,setFiles]=useState<File[]>([]);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const locked=initialSubmission?.status==="SUBMITTED"||initialSubmission?.status==="REVIEWED";

  async function submit(){
    if(locked){setMessage(initialSubmission?.status==="REVIEWED"?"Тексерілген тапсырма өзгертілмейді.":"Тапсырма тексеруде. Қайта ашуды ментор жасайды.");return;}
    if(attachmentRequired&&existingFileCount+files.length===0){setMessage("Кемінде бір файл тіркеңіз.");return;}
    if(existingFileCount+files.length>maxFiles){setMessage("Ең көбі "+maxFiles+" файл жүктей аласыз.");return;}
    setLoading(true);setMessage("");
    try{
      const draftResponse=await fetch("/api/tasks/"+taskId+"/submissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({textAnswer:answer,linkUrl,finalize:false})});
      const draftData=await draftResponse.json().catch(()=>({}));
      if(!draftResponse.ok)throw new Error(draftData.error??"Draft сақталмады.");
      const submissionId=String(draftData.submission.id);
      for(const file of files){
        const fd=new FormData();fd.append("submissionId",submissionId);fd.append("file",file);
        const fr=await fetch("/api/tasks/"+taskId+"/submissions/files",{method:"POST",body:fd});const fdj=await fr.json().catch(()=>({}));
        if(!fr.ok)throw new Error(fdj.error??"Файл жүктелмеді.");
      }
      const finalResponse=await fetch("/api/tasks/"+taskId+"/submissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({textAnswer:answer,linkUrl,finalize:true})});
      const finalData=await finalResponse.json().catch(()=>({}));
      if(!finalResponse.ok)throw new Error(finalData.error??"Тапсырма жіберілмеді.");
      setMessage(finalData.submission?.submitted_late?"Тапсырма жіберілді. Deadline өткендіктен «Кеш тапсырылды» белгісі қойылды.":"Тапсырма тексеруге жіберілді.");
      setFiles([]);window.setTimeout(()=>window.location.reload(),600);
    }catch(error){setMessage(error instanceof Error?error.message:"Белгісіз қате.");}finally{setLoading(false);}
  }

  return <div className="rounded-2xl border border-[#EFE8E1] bg-white p-4 shadow-soft sm:p-5">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-[#172235]">Жауап</p><p className="mt-1 text-[10px] text-[#9A9189]">Мәтін, сілтеме және бірнеше файл.</p></div><Paperclip size={17} className="text-[#9A9189]"/></div>
    <textarea value={answer} onChange={e=>setAnswer(e.target.value)} disabled={locked} rows={6} placeholder="Жауабыңызды жазыңыз..." className={inputClass+" focus:border-[#C25100]"}/>
    <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} disabled={locked} placeholder="Сыртқы сілтеме (Google Drive, GitHub, Figma т.б.)" className={inputClass}/>
    <div className="mt-3 rounded-xl border border-dashed border-[#DCCFC5] bg-[#FFFCF9] p-3.5"><label className="flex cursor-pointer items-center justify-between gap-3"><span><span className="block text-xs font-extrabold text-[#3F3832]">{files.length?files.length+" жаңа файл":"Файл таңдалмаған"}</span><span className="mt-1 block text-[10px] text-[#9A9189]">Қолда бар: {existingFileCount} / {maxFiles}</span></span><span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#FFF0E8] text-[#FF6F2C]"><UploadCloud size={16}/></span><input type="file" multiple className="sr-only" disabled={locked||existingFileCount>=maxFiles} accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx" onChange={e=>setFiles(Array.from(e.target.files??[]).slice(0,Math.max(0,maxFiles-existingFileCount)))}/></label></div>
    {initialSubmission?.review_comment?<div className="mt-3 rounded-[14px] bg-[#FFF0E8] p-3 text-xs leading-5 text-[#6C4436]"><span className="font-extrabold">Ментор комментарийі:</span> {initialSubmission.review_comment}{initialSubmission.resubmission_deadline?" · Қайта тапсыруға дейін: "+new Date(initialSubmission.resubmission_deadline).toLocaleString("kk-KZ"):""}</div>:null}
    {message?<div className="mt-3 rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 text-xs font-semibold text-[#5C5149]">{message}</div>:null}
    <button onClick={()=>void submit()} disabled={loading||locked} className="mt-4 w-full rounded-xl bg-[#FF6F2C] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{loading?"Жіберілуде...":locked?"Қайта ашуды ментор жасайды":"Тапсырманы жіберу"}</button>
  </div>;
}
