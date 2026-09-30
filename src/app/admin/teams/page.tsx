"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
export default function AdminTeamsPage(){
 const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);const f=new FormData(event.currentTarget);
 const response=await fetch("/api/admin/teams",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:f.get("name"),mentorId:f.get("mentorId"),capacity:Number(f.get("capacity")||70)})});
 const data=await response.json().catch(()=>({}));setMessage(response.ok?"Команда жасалды.":(data.error??"Қате"));setLoading(false);if(response.ok) event.currentTarget.reset();}
 return <main className="min-h-screen bg-[var(--background)] px-6 py-10"><div className="mx-auto max-w-3xl"><Link href="/admin" className="text-sm font-semibold">← Admin</Link><h1 className="mt-6 text-3xl font-semibold">Жаңа команда</h1><form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6"><input name="name" required placeholder="Команда атауы" className="w-full rounded-xl border p-3"/><input name="mentorId" placeholder="Mentor UUID" className="w-full rounded-xl border p-3"/><input name="capacity" type="number" min="1" defaultValue="70" className="w-full rounded-xl border p-3"/>{message?<div className="rounded-xl bg-zinc-50 p-3 text-sm">{message}</div>:null}<button disabled={loading} className="w-full rounded-xl bg-black p-3 font-semibold text-white disabled:opacity-50">{loading?"Сақталуда...":"Жасау"}</button></form></div></main>;
}