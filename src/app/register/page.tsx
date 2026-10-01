"use client";

import { FormEvent,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatKzPhone, isValidKzPhone, normalizePhone } from "@/lib/phone";

type FormState = {
  phone:string;
  email:string;
  firstName:string;
  lastName:string;
  age:string;
  educationType:string;
  educationPlace:string;
  password:string;
  confirmPassword:string;
};

type ErrorState = Partial<Record<keyof FormState, string>> & {form?: string};

const initialForm:FormState={
  phone:"",
  email:"",
  firstName:"",
  lastName:"",
  age:"",
  educationType:"UNIVERSITY",
  educationPlace:"",
  password:"",
  confirmPassword:"",
};

export default function RegisterPage(){
  const router=useRouter();
  const [form,setForm]=useState<FormState>(initialForm);
  const [errors,setErrors]=useState<ErrorState>({});
  const [loading,setLoading]=useState(false);

  const updateField=(key:keyof FormState,value:string)=>{
    setForm(current=>({...current,[key]:value}));
    setErrors(current=>({...current,[key]:undefined,form:undefined}));
  };

  function validate():ErrorState{
    const next:ErrorState={};
    const normalizedPhone=normalizePhone(form.phone);

    if(!isValidKzPhone(form.phone)) next.phone="Телефонды толық енгізіңіз: +7 (700) 000 00 00";
    if(!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email="Email мекенжайын дұрыс енгізіңіз";
    if(form.firstName.trim().length<2) next.firstName="Атыңызды енгізіңіз";
    if(form.lastName.trim().length<2) next.lastName="Тегіңізді енгізіңіз";

    const age=Number(form.age);
    if(!Number.isInteger(age) || age<10 || age>100) next.age="Жасыңызды дұрыс енгізіңіз";
    if(!form.educationPlace.trim()) next.educationPlace="Оқу орнын енгізіңіз";
    if(form.password.length<8) next.password="Құпиясөз кемінде 8 таңба болуы керек";
    if(form.password!==form.confirmPassword) next.confirmPassword="Құпиясөздер сәйкес емес";

    if(!normalizedPhone && !next.phone) next.phone="Телефонды енгізіңіз";

    return next;
  }

  async function handleSubmit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();

    const validationErrors=validate();
    if(Object.keys(validationErrors).length){
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const normalizedPhone=normalizePhone(form.phone);
    const fullName=`${form.firstName.trim()} ${form.lastName.trim()}`;

    const supabase=createBrowserSupabaseClient();
    const {data,error:signUpError}=await supabase.auth.signUp({
      email:form.email.trim().toLowerCase(),
      password:form.password,
      options:{
        data:{
          phone:normalizedPhone,
          full_name:fullName,
          age:Number(form.age),
          education_type:form.educationType,
          education_place:form.educationPlace.trim()
        }
      }
    });

    if(signUpError){
      const message=signUpError.message.toLowerCase();

      if(message.includes("user already registered") || message.includes("already been registered")){
        setErrors({email:"Бұл email арқылы аккаунт бұрын тіркелген."});
      }else if(message.includes("database error saving new user")){
        setErrors({form:"Тіркелу кезінде деректерді сақтау қатесі болды. Телефон, аты-жөні және басқа өрістерді тексеріңіз."});
      }else if(message.includes("password")){
        setErrors({password:signUpError.message});
      }else{
        setErrors({form:signUpError.message});
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

  const inputClass=(key:keyof FormState)=>`mt-2 w-full rounded-xl border ${errors[key] ? "border-red-300 bg-red-50/40" : "border-gray-200"} px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10`;
  const errorText=(key:keyof FormState)=>errors[key] ? <p className="mt-1.5 text-[11px] leading-4 text-red-600">{errors[key]}</p> : null;

  return <main className="min-h-screen bg-[#FAFAFA] px-4 py-8 sm:px-6">
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-900"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#C25100] text-sm font-bold text-white">S</span><span>Shyraq</span></Link>
          <Link href="/login" className="text-xs font-semibold text-[#C25100]">Кіру</Link>
        </div>

        <h1 className="mt-7 text-2xl font-semibold tracking-tight text-gray-900">Shyraq-қа тіркелу</h1>
        <p className="mt-1.5 text-sm leading-6 text-gray-500">Тіркелгеннен кейін сізді ментор телефон нөміріңіз арқылы өз командасына қоса алады.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-gray-700">
            Телефон
            <input
              required
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={e=>updateField("phone",formatKzPhone(e.target.value))}
              placeholder="+7 (700) 000 00 00"
              maxLength={18}
              className={inputClass("phone")}
            />
            {errorText("phone")}
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e=>updateField("email",e.target.value)}
              className={inputClass("email")}
            />
            {errorText("email")}
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Аты
            <input
              required
              autoComplete="given-name"
              value={form.firstName}
              onChange={e=>updateField("firstName",e.target.value)}
              placeholder="Мысалы: Динислам"
              className={inputClass("firstName")}
            />
            {errorText("firstName")}
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Тегі
            <input
              required
              autoComplete="family-name"
              value={form.lastName}
              onChange={e=>updateField("lastName",e.target.value)}
              placeholder="Мысалы: Жұмамұратов"
              className={inputClass("lastName")}
            />
            {errorText("lastName")}
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Жасы
            <input
              required
              min={10}
              max={100}
              type="number"
              value={form.age}
              onChange={e=>updateField("age",e.target.value)}
              className={inputClass("age")}
            />
            {errorText("age")}
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Оқу түрі
            <select
              value={form.educationType}
              onChange={e=>updateField("educationType",e.target.value)}
              className={inputClass("educationType")}
            >
              <option value="SCHOOL">Мектеп</option>
              <option value="COLLEGE">Колледж</option>
              <option value="UNIVERSITY">Университет</option>
              <option value="OTHER">Басқа</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-gray-700 sm:col-span-2">
            Оқу орны
            <input
              required
              value={form.educationPlace}
              onChange={e=>updateField("educationPlace",e.target.value)}
              placeholder="Мектеп / колледж / университет"
              className={inputClass("educationPlace")}
            />
            {errorText("educationPlace")}
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Құпиясөз
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={e=>updateField("password",e.target.value)}
              className={inputClass("password")}
            />
            <p className="mt-1.5 text-[11px] text-gray-400">Кемінде 8 таңба.</p>
            {errorText("password")}
          </label>

          <label className="block text-xs font-medium text-gray-700">
            Құпиясөзді қайталаңыз
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={e=>updateField("confirmPassword",e.target.value)}
              className={inputClass("confirmPassword")}
            />
            {errorText("confirmPassword")}
          </label>

          {errors.form ? <div className="rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700 sm:col-span-2">{errors.form}</div> : null}

          <button disabled={loading} type="submit" className="group flex items-center justify-center gap-2 rounded-xl bg-[#C25100] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">
            {loading?"Тіркелу...":"Тіркелу"}
            {!loading?<ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5"/>:null}
          </button>
        </form>
      </div>
    </div>
  </main>;
}
