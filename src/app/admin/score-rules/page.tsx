"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppNav";

type Rule = { id:string; code:string; label:string; weight:number; active:boolean };

export default function AdminScoreRulesPage() {
  const [rules,setRules]=useState<Rule[]>([]);
  const [message,setMessage]=useState("");

  useEffect(()=>{let cancelled=false;void fetch("/api/admin/score-rules").then(r=>r.json()).then((data:{rules?:Rule[]})=>{if(!cancelled)setRules(data.rules??[]);}).catch(()=>{if(!cancelled)setMessage("Rules жүктелмеді.");});return()=>{cancelled=true;};},[]);

  async function save(rule:Rule){
    const response=await fetch("/api/admin/score-rules",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:rule.code,weight:Number(rule.weight),active:rule.active})});
    const data=await response.json().catch(()=>({}));
    setMessage(response.ok?"Сақталды.":(data.error??"Қате"));
    if(response.ok){const reload=await fetch("/api/admin/score-rules");const reloadData=await reload.json().catch(()=>({}));if(reload.ok)setRules(reloadData.rules??[]);}
  }

  return <AppShell role="ADMIN" title="Ұпай ережелері" description="Әр әрекеттің score салмағын басқару.">
    <main className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-7">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
        {rules.map(rule=><div key={rule.id} className="grid gap-3 border-b border-gray-100 p-4 last:border-b-0 sm:grid-cols-[1.5fr_120px_110px_80px] sm:items-center">
          <div><p className="text-sm font-semibold text-gray-900">{rule.label}</p><p className="mt-0.5 text-[10px] text-gray-400">{rule.code}</p></div>
          <input type="number" step="0.1" value={rule.weight} onChange={e=>setRules(current=>current.map(item=>item.id===rule.id?{...item,weight:Number(e.target.value)}:item))} className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C25100]"/>
          <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={rule.active} onChange={e=>setRules(current=>current.map(item=>item.id===rule.id?{...item,active:e.target.checked}:item))} className="h-4 w-4 accent-[#C25100]"/> Active</label>
          <button type="button" onClick={()=>void save(rule)} className="rounded-xl bg-[#C25100] px-3 py-2 text-xs font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90">Save</button>
        </div>)}
        {!rules.length?<div className="p-8 text-center text-sm text-gray-500">Rules жоқ.</div>:null}
      </div>
      {message?<p className="mt-3 text-xs text-gray-500">{message}</p>:null}
    </main>
  </AppShell>;
}
