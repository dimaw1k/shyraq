"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppNav";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  education_type: string;
  education_place: string;
  status: string;
  role: string;
  created_at: string;
};

const ROLES = ["STUDENT", "MENTOR", "ADMIN"];
const STATUSES = ["REGISTERED", "WAITING_FOR_TEAM", "ACTIVE", "INACTIVE", "COMPLETED"];

export default function AdminUsersPage() {
  const [users,setUsers]=useState<UserRow[]>([]);
  const [search,setSearch]=useState("");
  const [role,setRole]=useState("");
  const [status,setStatus]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function load() {
    setLoading(true);
    const params=new URLSearchParams();
    if(search.trim()) params.set("search",search.trim());
    if(role) params.set("role",role);
    if(status) params.set("status",status);
    const response=await fetch("/api/admin/users?"+params.toString());
    const data=await response.json().catch(()=>({}));
    if(response.ok){setUsers(data.users??[]);setMessage("");}else setMessage(data.error??"Пайдаланушылар жүктелмеді.");
    setLoading(false);
  }

  useEffect(()=>{void fetch("/api/admin/users").then(r=>r.json()).then((data:{users?:UserRow[];error?:string})=>{if(data.users)setUsers(data.users);else setMessage(data.error??"Пайдаланушылар жүктелмеді.");}).catch(()=>setMessage("Пайдаланушылар жүктелмеді."));},[]);

  async function updateUser(user:UserRow,patch:{role?:string;status?:string}) {
    const response=await fetch("/api/admin/users/"+user.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){setMessage(data.error??"Өзгерту орындалмады.");return;}
    setUsers(current=>current.map(item=>item.id===user.id?data.profile:item));
    setMessage("Пайдаланушы жаңартылды.");
  }

  return (
    <AppShell role="ADMIN" title="Оқушылар" description="Пайдаланушылардың рөлін және статусын басқарыңыз.">
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
          <div className="grid gap-2.5 lg:grid-cols-[1fr_170px_200px_auto]">
            <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void load();}} placeholder="Аты, email немесе телефон" className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/>
            <select value={role} onChange={e=>setRole(e.target.value)} className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none"><option value="">Барлық рөл</option>{ROLES.map(item=><option key={item} value={item}>{item}</option>)}</select>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none"><option value="">Барлық статус</option>{STATUSES.map(item=><option key={item} value={item}>{item}</option>)}</select>
            <button type="button" onClick={()=>void load()} disabled={loading} className="rounded-xl bg-[#C25100] px-4 py-2.5 text-xs font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">{loading?"Жүктелуде...":"Іздеу"}</button>
          </div>
        </div>

        {message?<div className="mt-3 rounded-xl bg-[#FAFAFA] px-3.5 py-3 text-xs text-gray-600">{message}</div>:null}

        <div className="mt-4 space-y-2">
          {users.map(user=>(
            <article key={user.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
              <div className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr_180px_190px] lg:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.full_name}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
                  <p className="mt-1 truncate text-xs text-gray-400">{user.phone} · {user.education_place}</p>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Жасы: <span className="font-medium text-gray-900">{user.age}</span></p>
                  <p className="mt-1">Оқу: <span className="font-medium text-gray-900">{user.education_type}</span></p>
                </div>
                <select value={user.role} onChange={e=>void updateUser(user,{role:e.target.value})} className="rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#C25100]">{ROLES.map(item=><option key={item}>{item}</option>)}</select>
                <select value={user.status} onChange={e=>void updateUser(user,{status:e.target.value})} className="rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#C25100]">{STATUSES.map(item=><option key={item}>{item}</option>)}</select>
              </div>
            </article>
          ))}
          {!users.length?<div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] p-10 text-center text-sm text-gray-500">Пайдаланушы табылмады.</div>:null}
        </div>
      </main>
    </AppShell>
  );
}
