"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ReportQuestion={id:string;question:string;field_key:string;field_type:string;required:boolean;sort_order:number};
const input="mt-2 w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-medium text-[#172235] outline-none transition focus:border-[#FF6F2C] focus:bg-white focus:ring-4 focus:ring-[#FF6F2C]/10";

export function DailyReportForm({ marathonDay }: { marathonDay?: number }) {
  const today=useMemo(()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");},[]);
  const [form,setForm]=useState({reportDate:today,studyMinutes:"",completedTaskCount:"",reflection:"",difficulties:"",nextDayGoal:""});
  const [questions,setQuestions]=useState<ReportQuestion[]>([]);
  const [reportType,setReportType]=useState<"MORNING"|"EVENING">("EVENING");
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  useEffect(()=>{
    let active=true;
    const params=new URLSearchParams({type:reportType});
    if(marathonDay)params.set("day",String(marathonDay));
    fetch("/api/reports/questions?"+params.toString())
      .then(r=>r.json())
      .then(d=>{if(active)setQuestions((d.questions??[]).sort((a:ReportQuestion,b:ReportQuestion)=>a.sort_order-b.sort_order));})
      .catch(()=>{if(active)setMessage("Есеп сұрақтарын жүктеу мүмкін болмады.");});
    return()=>{active=false;};
  },[marathonDay,reportType]);
  const update=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}));
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setMessage("");try{const response=await fetch("/api/reports/daily",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reportDate:form.reportDate,reportType,marathonDay,studyMinutes:Number(form.studyMinutes||0),completedTaskCount:Number(form.completedTaskCount||0),reflection:form.reflection,difficulties:form.difficulties,nextDayGoal:form.nextDayGoal,answers})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error??"Қате болды.");setMessage("Есеп жіберілді.");}catch(error){setMessage(error instanceof Error?error.message:"Қате болды.");}finally{setLoading(false);}}
  return <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">{marathonDay?marathonDay+"-КҮН":"БҮГІН"}</p><h2 className="mt-1.5 text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">Оқу есебі</h2><form onSubmit={submit} className="mt-5 space-y-4">
    <div className="grid grid-cols-2 gap-2 rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-1.5" role="group" aria-label="Есеп түрі">
      <button type="button" aria-pressed={reportType==="MORNING"} onClick={()=>{setReportType("MORNING");setAnswers({});}} className={"rounded-[10px] px-3 py-2.5 text-xs font-extrabold transition "+(reportType==="MORNING"?"bg-[#FF6F2C] text-white shadow-sm":"text-[#766E66] hover:bg-white")}>Таңғы есеп</button>
      <button type="button" aria-pressed={reportType==="EVENING"} onClick={()=>{setReportType("EVENING");setAnswers({});}} className={"rounded-[10px] px-3 py-2.5 text-xs font-extrabold transition "+(reportType==="EVENING"?"bg-[#FF6F2C] text-white shadow-sm":"text-[#766E66] hover:bg-white")}>Кешкі есеп</button>
    </div>
    <label className="block text-[11px] font-extrabold text-[#3F3832]">Күні<input type="date" value={form.reportDate} onChange={e=>update("reportDate",e.target.value)} className={input}/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block text-[11px] font-extrabold text-[#3F3832]">Оқу минуттары<input type="number" min="0" value={form.studyMinutes} onChange={e=>update("studyMinutes",e.target.value)} className={input}/></label><label className="block text-[11px] font-extrabold text-[#3F3832]">Орындалған тапсырма<input type="number" min="0" value={form.completedTaskCount} onChange={e=>update("completedTaskCount",e.target.value)} className={input}/></label></div>
    <div className="rounded-[16px] border border-[#F1E4D8] bg-[#FFF9F3] px-4 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#C25100]">КҮНДЕЛІКТІ ЕСЕП</p>
      <p className="mt-1 text-xs leading-5 text-[#665B52]">Бүгінгі күніңді қысқа, нақты және шынайы қорытындыла. Әр бөлімді толықтыр.</p>
    </div>
    {questions.map(q=><label key={q.id} className="block text-[11px] font-extrabold text-[#3F3832]">{q.question}{q.required?" *":""}{q.field_type==="NUMBER"?<input required={q.required} type="number" value={answers[q.field_key]??""} onChange={e=>setAnswers(current=>({...current,[q.field_key]:e.target.value}))} className={input}/>:q.field_type==="SHORT_TEXT"?<input required={q.required} value={answers[q.field_key]??""} onChange={e=>setAnswers(current=>({...current,[q.field_key]:e.target.value}))} className={input}/>:<textarea required={q.required} rows={4} placeholder="Жауабыңды толық жаз..." value={answers[q.field_key]??""} onChange={e=>setAnswers(current=>({...current,[q.field_key]:e.target.value}))} className={input}/>}</label>)}
    {message?<div className="rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-semibold text-[#5C5149]">{message}</div>:null}
    <button disabled={loading} className="w-full rounded-[14px] bg-[#FF6F2C] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{loading?"Жіберілуде...":"Есепті жіберу"}</button>
  </form></div>;
}
