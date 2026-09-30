"use client";

import { FormEvent,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage(){
  const router=useRouter();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);

  async function handleSubmit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setError("");
    const supabase=createBrowserSupabaseClient();
    const {error:signInError}=await supabase.auth.signInWithPassword({email,password});
    if(signInError){setError(signInError.message);setLoading(false);return;}
    router.push("/dashboard");router.refresh();
  }

  return <main className="min-h-screen bg-[#FAFAFA] px-4 py-8 sm:px-6">
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
      <div className="w-full rounded-3xl border border-gray-100 bg-white p-5 shadow-soft sm:p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-900"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#C25100] text-sm font-bold text-white">S</span><span>Shyraq</span></Link>
        <h1 className="mt-7 text-2xl font-semibold tracking-tight text-gray-900">Қайта оралыңыз</h1>
        <p className="mt-1.5 text-sm text-gray-500">Shyraq аккаунтыңызға кіріңіз.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-xs font-medium text-gray-700">Email
            <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/>
          </label>
          <label className="block text-xs font-medium text-gray-700">Құпиясөз
            <input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/>
          </label>
          {error?<div className="rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">{error}</div>:null}
          <button disabled={loading} type="submit" className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#C25100] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">
            {loading?"Кіру...":"Кіру"}{!loading?<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5"/>:null}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-500">Аккаунтыңыз жоқ па? <Link href="/register" className="font-semibold text-[#C25100]">Тіркелу</Link></p>
      </div>
    </div>
  </main>;
}
