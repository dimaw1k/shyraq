"use client";

import { FormEvent,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isValidKzPhone, normalizePhone } from "@/lib/phone";

export default function RegisterPage(){
  const router=useRouter();
  const [form,setForm]=useState({phone:"",email:"",fullName:"",age:"",educationType:"UNIVERSITY",educationPlace:"",password:""});
  const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  const updateField=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}));

  async function handleSubmit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setError("");

    const normalizedPhone=normalizePhone(form.phone);
    if(!isValidKzPhone(form.phone)){
      setError("Телефон нөмірін дұрыс енгізіңіз: +7 700 000 00 00");
      setLoading(false);
      return;
    }

    const supabase=createBrowserSupabaseClient();
    const {data,error:signUpError}=await supabase.auth.signUp({
      email:form.email.trim(),
      password:form.password,
      options:{
        data:{
          phone:normalizedPhone,
          full_name:form.fullName.trim(),
          age:Number(form.age),
          education_type:form.educationType,
          education_place:form.educationPlace.trim()
        }
      }
    });

    if(signUpError){
      const message=signUpError.message.toLowerCase();
      if(message.includes("database error saving new user")){
        setError("Тіркелу орындалмады. Енгізілген деректерді, әсіресе телефон нөмірін, тексеріңіз.");
      }else{
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if(!data.session){
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return <main className="min-h-screen bg-[#FAFAFA] px-4 py-8 sm:px-6">
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-900"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#C25100] text-sm font-bold text-white">S</span><span>Shyraq</span></Link>
          <Link href="/login" className="text-xs font-semibold text-[#C25100]">Кіру</Link>
        </div>
        <h1 className="mt-7 text-2xl font-semibold tracking-tight text-gray-900">Shyraq-қа тіркелу</h1>
        <p className="mt-1.5 text-sm leading-6 text-gray-500">Тіркелгеннен кейін сізді ментор телефон нөміріңіз арқылы өз командасына қоса алады.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-gray-700">Телефон<input required value={form.phone} onChange={e=>updateField("phone",e.target.value)} placeholder="+7 700 000 00 00" className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/></label>
          <label className="block text-xs font-medium text-gray-700">Email<input required type="email" value={form.email} onChange={e=>updateField("email",e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/></label>
          <label className="block text-xs font-medium text-gray-700 sm:col-span-2">Аты-жөні<input required value={form.fullName} onChange={e=>updateField("fullName",e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/></label>
          <label className="block text-xs font-medium text-gray-700">Жасы<input required min={10} max={100} type="number" value={form.age} onChange={e=>updateField("age",e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/></label>
          <label className="block text-xs font-medium text-gray-700">Оқу түрі<select value={form.educationType} onChange={e=>updateField("educationType",e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"><option value="SCHOOL">Мектеп</option><option value="COLLEGE">Колледж</option><option value="UNIVERSITY">Университет</option><option value="OTHER">Басқа</option></select></label>
          <label className="block text-xs font-medium text-gray-700 sm:col-span-2">Оқу орны<input required value={form.educationPlace} onChange={e=>updateField("educationPlace",e.target.value)} placeholder="Мектеп / колледж / университет" className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/></label>
          <label className="block text-xs font-medium text-gray-700 sm:col-span-2">Құпиясөз<input required minLength={6} type="password" value={form.password} onChange={e=>updateField("password",e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10"/></label>
          {error?<div className="rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700 sm:col-span-2">{error}</div>:null}
          <button disabled={loading} type="submit" className="group flex items-center justify-center gap-2 rounded-xl bg-[#C25100] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50 sm:col-span-2">{loading?"Тіркелу...":"Тіркелу"}{!loading?<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5"/>:null}</button>
        </form>
      </div>
    </div>
  </main>;
}
