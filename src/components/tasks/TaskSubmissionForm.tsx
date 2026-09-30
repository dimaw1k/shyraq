"use client";

import { useState } from "react";

type Submission = { id:string; status:string; text_answer:string|null; submitted_at:string|null }|null;

export function TaskSubmissionForm({taskId,attachmentRequired,initialSubmission}:{taskId:string;attachmentRequired:boolean;initialSubmission:Submission}) {
  const [answer,setAnswer]=useState(initialSubmission?.text_answer??"");
  const [file,setFile]=useState<File|null>(null);
  const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);

  async function submit(){
    if(attachmentRequired&&!file&&!initialSubmission){setMessage("Дәлел файлын тіркеңіз.");return;}
    setLoading(true);setMessage("");
    try{
      const draftResponse=await fetch("/api/tasks/"+taskId+"/submissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({textAnswer:answer,finalize:!attachmentRequired&&!file})});
      const draftData=await draftResponse.json().catch(()=>({}));
      if(!draftResponse.ok)throw new Error(draftData.error??"Жіберу кезінде қате болды.");
      const submissionId=draftData.submission?.id;if(!submissionId)throw new Error("Submission identifier was not returned.");
      if(file){
        const formData=new FormData();formData.append("submissionId",submissionId);formData.append("file",file);
        const fileResponse=await fetch("/api/tasks/"+taskId+"/submissions/files",{method:"POST",body:formData});
        const fileData=await fileResponse.json().catch(()=>({}));
        if(!fileResponse.ok)throw new Error(fileData.error??"Файл жүктелмеді.");
      }
      if(attachmentRequired||file){
        const finalizeResponse=await fetch("/api/tasks/"+taskId+"/submissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({textAnswer:answer,finalize:true})});
        const finalizeData=await finalizeResponse.json().catch(()=>({}));
        if(!finalizeResponse.ok)throw new Error(finalizeData.error??"Тапсырманы аяқтау кезінде қате болды.");
      }
      setMessage("Тапсырма жіберілді.");setFile(null);
    }catch(error){setMessage(error instanceof Error?error.message:"Жіберу кезінде қате болды.");}
    finally{setLoading(false);}
  }

  return <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">SUBMISSION</p>
    <h2 className="mt-1 text-sm font-semibold tracking-tight text-gray-900">Жауап</h2>
    <textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={7} placeholder="Жауабыңызды жазыңыз..." className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/>
    <label className="mt-4 block text-xs font-medium text-gray-700">{attachmentRequired?"Дәлел файлы (міндетті)":"Файл (қосымша)"}
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx" onChange={e=>setFile(e.target.files?.[0]??null)} className="mt-2 block w-full rounded-xl border border-dashed border-gray-200 bg-[#FAFAFA] p-3 text-xs"/>
    </label>
    {file?<p className="mt-2 text-[10px] text-gray-400">{file.name}</p>:null}
    {message?<div className="mt-3 rounded-xl bg-[#FAFAFA] px-3.5 py-3 text-xs text-gray-600">{message}</div>:null}
    <button type="button" disabled={loading} onClick={submit} className="mt-4 w-full rounded-xl bg-[#C25100] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">{loading?"Жіберілуде...":"Жіберу"}</button>
  </section>;
}
