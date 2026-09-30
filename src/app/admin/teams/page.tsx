"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/app/AppNav";

export default function AdminTeamsPage(){
 const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);const f=new FormData(event.currentTarget);const response=await fetch("/api/admin/teams",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:f.get("name"),mentorId:f.get("mentorId"),capacity:Number(f.get("capacity")||70)})});const data=await response.json().catch(()=>({}));setMessage(response.ok?"Команда жасалды.":(data.error??"Қате"));setLoading(false);if(response.ok) event.currentTarget.reset();}
 return <AppShell role="ADMIN" title="Жаңа команда" description="Командаға mentor бекітіп, capacity орнатыңыз."><main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7"><form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
  <div className="space-y-4">
   <label className="block text-sm font-medium text-gray-900">Команда атауы<input name="name" required placeholder="Team 01" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
   <label className="block text-sm font-medium text-gray-900">Mentor UUID<input name="mentorId" placeholder="Mentor ID" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
   <label className="block text-sm font-medium text-gray-900">Capacity<input name="capacity" type="number" min="1" defaultValue="70" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" /></label>
  </div>
  {message?<div className="mt-4 rounded-xl bg-[#FAFAFA] p-3 text-sm text-gray-700">{message}</div>:null}
  <button disabled={loading} className="mt-4 w-full rounded-xl bg-[#C25100] p-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">{loading?"Сақталуда...":"Команда жасау"}</button>
 </form></main></AppShell>;
}