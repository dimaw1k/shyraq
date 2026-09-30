"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/app/AppNav";

export default function AdminLessonsPage(){
 const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);const f=new FormData(event.currentTarget);const response=await fetch("/api/admin/lessons",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:f.get("title"),description:f.get("description"),kinescopeVideoId:f.get("kinescopeVideoId"),durationSeconds:Number(f.get("durationSeconds")||0),requiredWatchPercent:Number(f.get("requiredWatchPercent")||85),sortOrder:Number(f.get("sortOrder")||0),published:f.get("published")==="on"})});const data=await response.json().catch(()=>({}));setMessage(response.ok?"Сабақ жасалды.":(data.error??"Қате"));setLoading(false);if(response.ok) event.currentTarget.reset();}
 return <AppShell role="ADMIN" title="Жаңа сабақ" description="Kinescope видеосын Shyraq сабағына тіркеңіз.">
  <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
   <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
    <div className="space-y-4">
     <label className="block text-sm font-medium text-gray-900">Сабақ атауы<input name="title" required placeholder="Мысалы: Алгебра — логарифмдер" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
     <label className="block text-sm font-medium text-gray-900">Сипаттама<textarea name="description" placeholder="Сабақ мазмұны" rows={3} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
     <label className="block text-sm font-medium text-gray-900">Kinescope video ID<input name="kinescopeVideoId" required placeholder="Video ID" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
     <div className="grid gap-3 sm:grid-cols-3">
      <label className="block text-sm font-medium text-gray-900">Ұзақтығы (сек.)<input name="durationSeconds" required type="number" min="1" placeholder="3600" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
      <label className="block text-sm font-medium text-gray-900">Watch gate<input name="requiredWatchPercent" type="number" min="0" max="100" defaultValue="85" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
      <label className="block text-sm font-medium text-gray-900">Реті<input name="sortOrder" type="number" defaultValue="0" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
     </div>
     <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input name="published" type="checkbox" className="h-4 w-4 accent-[#C25100]"/> Бірден жариялау</label>
    </div>
    {message?<div className="mt-4 rounded-xl bg-[#FAFAFA] p-3 text-sm text-gray-700">{message}</div>:null}
    <button disabled={loading} className="mt-4 w-full rounded-xl bg-[#C25100] p-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">{loading?"Сақталуда...":"Сабақ жасау"}</button>
   </form>
  </main>
 </AppShell>;
}