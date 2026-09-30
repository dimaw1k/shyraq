"use client";

import { FormEvent, useMemo, useState } from "react";

export function DailyReportForm() {
  const today=useMemo(()=>{
    const date=new Date();
    const year=date.getFullYear();
    const month=String(date.getMonth()+1).padStart(2,"0");
    const day=String(date.getDate()).padStart(2,"0");
    return year+"-"+month+"-"+day;
  },[]);
  const [form,setForm]=useState({reportDate:today,studyMinutes:"",completedTaskCount:"",reflection:"",difficulties:"",nextDayGoal:""});
  const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  const update=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}));

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setMessage("");
    const response=await fetch("/api/reports/daily",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reportDate:form.reportDate,studyMinutes:Number(form.studyMinutes||0),completedTaskCount:Number(form.completedTaskCount||0),reflection:form.reflection,difficulties:form.difficulties,nextDayGoal:form.nextDayGoal})});
    const data=await response.json().catch(()=>({}));
    setMessage(response.ok?"Есеп сақталды.":(data.error??"Қате болды."));setLoading(false);
  }

  const input="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10";
  return <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">DAILY REPORT</p>
    <h2 className="mt-1 text-sm font-semibold tracking-tight text-gray-900">Бүгінгі есеп</h2>
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-xs font-medium text-gray-700">Күні<input type="date" value={form.reportDate} onChange={e=>update("reportDate",e.target.value)} className={input}/></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-gray-700">Оқу минуттары<input type="number" min="0" value={form.studyMinutes} onChange={e=>update("studyMinutes",e.target.value)} className={input}/></label>
        <label className="block text-xs font-medium text-gray-700">Орындалған тапсырма<input type="number" min="0" value={form.completedTaskCount} onChange={e=>update("completedTaskCount",e.target.value)} className={input}/></label>
      </div>
      <label className="block text-xs font-medium text-gray-700">Бүгін не істедіңіз?<textarea value={form.reflection} onChange={e=>update("reflection",e.target.value)} rows={3} className={input}/></label>
      <label className="block text-xs font-medium text-gray-700">Қиындықтар<textarea value={form.difficulties} onChange={e=>update("difficulties",e.target.value)} rows={2} className={input}/></label>
      <label className="block text-xs font-medium text-gray-700">Ертеңгі мақсат<textarea value={form.nextDayGoal} onChange={e=>update("nextDayGoal",e.target.value)} rows={2} className={input}/></label>
      {message?<div className="rounded-xl bg-[#FAFAFA] px-3.5 py-3 text-xs text-gray-600">{message}</div>:null}
      <button disabled={loading} className="w-full rounded-xl bg-[#C25100] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">{loading?"Сақталуда...":"Есепті жіберу"}</button>
    </form>
  </section>;
}
