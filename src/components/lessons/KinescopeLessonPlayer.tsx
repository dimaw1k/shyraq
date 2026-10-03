"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TimeRange } from "@/lib/video/coverage";
import { mergeTimeRanges, watchedPercent } from "@/lib/video/coverage";

const KinescopePlayer=dynamic(()=>import("@kinescope/react-kinescope-player"),{ssr:false});

type Props={
  lessonId:string;
  videoId:string;
  durationSeconds:number;
  requiredWatchPercent:number;
  initialRanges?:TimeRange[];
  testHref?:string;
  initialTestUnlocked?:boolean;
  trackProgress?:boolean;
};

function getYouTubeId(value:string){
  const raw=value.trim();
  try{
    const url=new URL(raw);
    const host=url.hostname.toLowerCase();
    if(host==="youtu.be" || host.endsWith(".youtu.be")){
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if(host.includes("youtube.com")){
      const v=url.searchParams.get("v");
      if(v) return v;
      const parts=url.pathname.split("/").filter(Boolean);
      if(parts[0]==="embed" || parts[0]==="shorts") return parts[1] ?? null;
    }
  }catch{}
  return null;
}

export function KinescopeLessonPlayer({
  lessonId,
  videoId,
  durationSeconds,
  requiredWatchPercent,
  initialRanges=[],
  testHref,
  initialTestUnlocked=false,
  trackProgress=true,
}:Props){
  const [ranges,setRanges]=useState<TimeRange[]>(initialRanges);
  const [percent,setPercent]=useState(()=>watchedPercent(initialRanges,durationSeconds));
  const [saving,setSaving]=useState(false);
  const lastTime=useRef<number|null>(null);
  const rangesRef=useRef<TimeRange[]>(initialRanges);
  const youtubeId=getYouTubeId(videoId);
  const shouldTrackProgress=trackProgress && !youtubeId;

  useEffect(()=>{rangesRef.current=ranges;},[ranges]);

  const persist=useCallback(async(nextRanges:TimeRange[])=>{
    if(!nextRanges.length) return;
    setSaving(true);
    try{
      const response=await fetch("/api/lessons/"+lessonId+"/progress",{method:"POST",keepalive:true,headers:{"Content-Type":"application/json"},body:JSON.stringify({ranges:nextRanges})});
      if(!response.ok)throw new Error("Ілгерілеуді сақтау сәтсіз аяқталды.");
    }finally{setSaving(false);}
  },[lessonId]);

  function handleTimeUpdate(event:{currentTime:number}){
    if(!shouldTrackProgress)return;
    const current=Math.max(0,Math.min(durationSeconds,event.currentTime));
    const previous=lastTime.current;lastTime.current=current;if(previous===null)return;
    const next=previous<=current&&current-previous<=4?mergeTimeRanges([...rangesRef.current,{start:previous,end:current}]):rangesRef.current;
    rangesRef.current=next;setRanges(next);setPercent(watchedPercent(next,durationSeconds));
  }

  useEffect(()=>{
    if(!shouldTrackProgress)return;
    const timer=window.setInterval(()=>{void persist(rangesRef.current);},15000);
    return()=>window.clearInterval(timer);
  },[persist,shouldTrackProgress]);

  useEffect(()=>{
    if(!shouldTrackProgress)return;
    const flush=()=>void persist(rangesRef.current);
    window.addEventListener("beforeunload",flush);
    return()=>window.removeEventListener("beforeunload",flush);
  },[persist,shouldTrackProgress]);

  const unlocked=initialTestUnlocked || percent>=requiredWatchPercent;

  if(youtubeId){
    return (
      <div className="space-y-3">
        <div className="aspect-video overflow-hidden rounded-2xl bg-gray-950 shadow-soft">
          <iframe
            title="Видео сабақ"
            src={"https://www.youtube.com/embed/"+youtubeId+"?rel=0&modestbranding=1&playsinline=1"}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-soft">
          <p className="text-xs font-semibold text-gray-900">Видео сабақ</p>
          <p className="mt-1 text-[10px] leading-5 text-gray-500">Сабақты толық көріп, төмендегі практика мен тапсырманы орында.</p>
        </div>
      </div>
    );
  }

  return <div className="space-y-3">
    <div className="aspect-video overflow-hidden rounded-2xl bg-gray-950 shadow-soft">
      <KinescopePlayer videoId={videoId} width="100%" height="100%" onTimeUpdate={handleTimeUpdate}/>
    </div>
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-semibold text-gray-900">Бейне ілгерілеуі</p><p className="mt-0.5 text-[10px] text-gray-400">Бірегей көрілген уақыт есептеледі.</p></div>
        <strong className="text-sm text-[#C25100]">{percent.toFixed(0)}%</strong>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[#C25100] transition-all duration-300 ease-in-out" style={{width:Math.min(100,percent)+"%"}}/>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[10px] text-gray-400">{unlocked?"Тест ашылды.":"Тестті ашу үшін кемінде "+requiredWatchPercent+"% көру керек."}</p>
        {saving?<span className="text-[10px] text-gray-400">Сақталуда...</span>:null}
      </div>
      {unlocked && testHref ? (
        <Link
          href={testHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#C25100] px-4 py-2.5 text-xs font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90"
        >
          Тестке өту
        </Link>
      ) : null}
    </div>
  </div>;
}
