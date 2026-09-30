"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/app/AppNav";

export default function AdminTestsPage(){
 const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);const f=new FormData(event.currentTarget);const response=await fetch("/api/admin/tests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:f.get("lessonId"),title:f.get("title"),instructions:f.get("instructions"),maxAttempts:Number(f.get("maxAttempts")||1),passingScore:Number(f.get("passingScore")||0)})});const data=await response.json().catch(()=>({}));setMessage(response.ok?"Тест жасалды: "+String(data.test?.id??""):(data.error??"Қате"));setLoading(false);}
 return <AppShell role="ADMIN" title="Жаңа тест" description="Сабаққа тестті байланыстырып, лимиттерін орнатыңыз."><main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7"><form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
  <div className="space-y-4">
   <label className="block text-sm font-medium text-gray-900">Lesson UUID<input name="lessonId" required placeholder="Lesson ID" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
   <label className="block text-sm font-medium text-gray-900">Тест атауы<input name="title" required placeholder="Бақылау тесті" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
   <label className="block text-sm font-medium text-gray-900">Нұсқаулық<textarea name="instructions" placeholder="Тапсыру ережесі" rows={3} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
   <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium text-gray-900">Максимум әрекет<input name="maxAttempts" type="number" min="1" defaultValue="1" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label><label className="block text-sm font-medium text-gray-900">Өту балы<input name="passingScore" type="number" min="0" defaultValue="0" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label></div>
  </div>
  {message?<div className="mt-4 rounded-xl bg-[#FAFAFA] p-3 text-sm text-gray-700">{message}</div>:null}
  <button disabled={loading} className="mt-4 w-full rounded-xl bg-[#C25100] p-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">{loading?"Сақталуда...":"Тест жасау"}</button>
 </form></main></AppShell>;
}