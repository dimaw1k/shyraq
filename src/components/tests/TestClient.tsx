"use client";

import { useMemo, useState } from "react";

type Option = { id:string; option_text:string; sort_order:number };
type Question = { id:string; question_text:string; points:number; sort_order:number; test_options:Option[] };

export function TestClient({testId,questions}:{testId:string;questions:Question[]}) {
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [result,setResult]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(){
    setLoading(true);setResult("");
    try{
      const response=await fetch("/api/tests/"+testId+"/attempts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({answers})});
      const body=await response.json();
      if(!response.ok)throw new Error(body.error??"Test failed");
      setResult("Нәтиже: "+String(body.attempt?.score??0)+" балл");
    }catch(error){setResult(error instanceof Error?error.message:"Қате");}
    finally{setLoading(false);}
  }

  return <div className="space-y-3">
    {questions.map((question,index)=>{
      const options=useMemo(()=>[...question.test_options].sort((a,b)=>a.sort_order-b.sort_order),[question.test_options]);
      return <section key={question.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#C25100]/10 text-[10px] font-semibold text-[#C25100]">{index+1}</span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-6 text-gray-900">{question.question_text}</h2>
            <p className="mt-0.5 text-[10px] text-gray-400">{question.points} ұпай</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {options.map(option=><label key={option.id} className={"flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-all duration-300 ease-in-out "+(answers[question.id]===option.id?"border-[#C25100] bg-[#C25100]/5":"border-gray-100 hover:bg-[#FAFAFA]")}>
            <input type="radio" name={question.id} checked={answers[question.id]===option.id} onChange={()=>setAnswers(current=>({...current,[question.id]:option.id}))} className="mt-0.5 accent-[#C25100]"/>
            <span className="leading-5 text-gray-700">{option.option_text}</span>
          </label>)}
        </div>
      </section>
    })}
    <button onClick={submit} disabled={loading||questions.length===0} className="w-full rounded-xl bg-[#C25100] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{loading?"Жіберілуде...":"Тестті тапсыру"}</button>
    {result?<div className="rounded-xl bg-[#FAFAFA] p-3.5 text-sm font-semibold text-gray-900">{result}</div>:null}
  </div>;
}
