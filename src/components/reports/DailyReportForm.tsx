"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ReportQuestion={id:string;question:string;field_key:string;field_type:string;required:boolean;sort_order:number};
const input="mt-2 w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-medium text-[#172235] outline-none transition focus:border-[#FF6F2C] focus:bg-white focus:ring-4 focus:ring-[#FF6F2C]/10";

export function DailyReportForm({ marathonDay }: { marathonDay?: number }) {
  const today=useMemo(()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");},[]);
  const [form,setForm]=useState({reportDate:today,studyMinutes:"",completedTaskCount:"",reflection:"",difficulties:"",nextDayGoal:""});
  const [questions,setQuestions]=useState<ReportQuestion[]>([]);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  useEffect(()=>{if(!marathonDay)return;let active=true;fetch("/api/reports/questions?day="+marathonDay).then(r=>r.json()).then(d=>{if(active)setQuestions((d.questions??[]).sort((a:ReportQuestion,b:ReportQuestion)=>a.sort_order-b.sort_order));}).catch(()=>{});return()=>{active=false;};},[marathonDay]);
  const update=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}));
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setMessage("");try{const response=await fetch("/api/reports/daily",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reportDate:form.reportDate,marathonDay,studyMinutes:Number(form.studyMinutes||0),completedTaskCount:Number(form.completedTaskCount||0),reflection:form.reflection,difficulties:form.difficulties,nextDayGoal:form.nextDayGoal,answers})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error??"Қате болды.");setMessage("Есеп жіберілді.");}catch(error){setMessage(error instanceof Error?error.message:"Қате болды.");}finally{setLoading(false);}}
  return <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">{marathonDay?marathonDay+"-КҮН":"БҮГІН"}</p><h2 className="mt-1.5 text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">Оқу есебі</h2><form onSubmit={submit} className="mt-5 space-y-4">
    <label className="block text-[11px] font-extrabold text-[#3F3832]">Күні<input type="date" value={form.reportDate} onChange={e=>update("reportDate",e.target.value)} className={input}/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block text-[11px] font-extrabold text-[#3F3832]">Оқу минуттары<input type="number" min="0" value={form.studyMinutes} onChange={e=>update("studyMinutes",e.target.value)} className={input}/></label><label className="block text-[11px] font-extrabold text-[#3F3832]">Орындалған тапсырма<input type="number" min="0" value={form.completedTaskCount} onChange={e=>update("completedTaskCount",e.target.value)} className={input}/></label></div>
    <label className="block text-[11px] font-extrabold text-[#3F3832]">Бүгін не істедің?<textarea required value={form.reflection} onChange={e=>update("reflection",e.target.value)} rows={3} className={input}/></label>
    <label className="block text-[11px] font-extrabold text-[#3F3832]">Қиындықтар<textarea value={form.difficulties} onChange={e=>update("difficulties",e.target.value)} rows={2} className={input}/></label>
    <label className="block text-[11px] font-extrabort text-[#3F3832]">Ертеңгі мақсат<textarea value={form.nextDayGoal} onChange={e=>update("nextDayGoal",e.target.value)} rows={2} className={input}/></label>
    {questions.map(q=><label key={q.id} className="block text-[11px] font-extrabold text-[#3F3832]">{q.question}{q.required?" *":""}{q.field_type==="NUMBER"?<input required={q.required} type="number" value={answers[q.field_key]??""} onChange={e=>setAnswers(current=>({...current,[q.field_key]:e.target.value}))} className={input}/>:q.field_type==="SHORT_TEXT"?<input required={q.required} value={answers[q.field_key]??""} onChange={e=>setAnswers(current=>({...current,[q.field_key]:e.target.value}))} className={input}/>:<textarea required={q.required} rows={3} value={answers[q.field_key]??""} onChange={e=>setAnswers(current=>({...current,[q.field_key]:e.target.value}))} className={input}/>}</label>)}
    {message?<div className="rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-semibold text-[#5C5149]">{message}</div>:null}
    <button disabled={loading} className="w-full rounded-[14px] bg-[#FF6F2C] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{loading?"Жіберілуде...":"Есепті жіберу"}</button>
  </form></div>;
}
