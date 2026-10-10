"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TimeRange } from "@/lib/video/coverage";
import { mergeTimeRanges, watchedPercent } from "@/lib/video/coverage";

const KinescopePlayer=dynamic(()=>import("@kinescope/react-kinescope-player"),{ssr:false});

type YouTubePlayer={
  getCurrentTime:()=>number;
  destroy:()=>void;
};

type YouTubeApi={
  Player:new (
    element:HTMLElement,
    options:{
      videoId:string;
      playerVars:Record<string,number>;
      events:{
        onReady:()=>void;
        onStateChange:(event:{data:number})=>void;
      };
    }
  )=>YouTubePlayer;
};

declare global{
  interface Window{
    YT?:YouTubeApi;
    onYouTubeIframeAPIReady?:()=>void;
  }
}

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
      if(v)return v;
      const parts=url.pathname.split("/").filter(Boolean);
      if(parts[0]==="embed" || parts[0]==="shorts")return parts[1] ?? null;
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
  const youtubeContainerRef=useRef<HTMLDivElement|null>(null);
  const youtubePlayerRef=useRef<YouTubePlayer|null>(null);
  const youtubePollRef=useRef<number|null>(null);
  const gateConfigRef = useRef({ videoId, durationSeconds, requiredWatchPercent });
  const progressSessionReadyRef = useRef(false);
  const progressSessionPromiseRef = useRef<Promise<boolean> | null>(null);
  const youtubeId=getYouTubeId(videoId);
  const shouldTrackProgress=trackProgress;

  useEffect(()=>{rangesRef.current=ranges;},[ranges]);

  useEffect(() => {
    const previous = gateConfigRef.current;
    const changed =
      previous.videoId !== videoId ||
      previous.durationSeconds !== durationSeconds ||
      previous.requiredWatchPercent !== requiredWatchPercent;

    if (changed) {
      // A video or its gate settings changed while this component remained mounted.
      // Never carry old-player ranges or an old unlocked state into the new lesson version.
      rangesRef.current = [];
      lastTime.current = null;
      progressSessionReadyRef.current = false;
      progressSessionPromiseRef.current = null;
      setRanges([]);
      setPercent(0);
    }

    gateConfigRef.current = { videoId, durationSeconds, requiredWatchPercent };
  }, [videoId, durationSeconds, requiredWatchPercent]);

  const startProgressSession = useCallback(async () => {
    if (!shouldTrackProgress) return false;
    if (progressSessionReadyRef.current) return true;
    if (progressSessionPromiseRef.current) return progressSessionPromiseRef.current;

    const requestedConfig = { videoId, durationSeconds, requiredWatchPercent };
    const pending = (async () => {
      try {
        const response = await fetch("/api/lessons/" + lessonId + "/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", videoId, ranges: [] }),
        });
        const currentConfig = gateConfigRef.current;
        const configStillCurrent =
          currentConfig.videoId === requestedConfig.videoId &&
          currentConfig.durationSeconds === requestedConfig.durationSeconds &&
          currentConfig.requiredWatchPercent === requestedConfig.requiredWatchPercent;
        if (response.ok && configStillCurrent) {
          progressSessionReadyRef.current = true;
          return true;
        }
      } catch {
        // The next playback heartbeat will retry starting the session.
      }
      return false;
    })();

    progressSessionPromiseRef.current = pending;
    const ready = await pending;
    if (progressSessionPromiseRef.current === pending) progressSessionPromiseRef.current = null;
    return ready;
  }, [lessonId, videoId, durationSeconds, requiredWatchPercent, shouldTrackProgress]);

  const persist = useCallback(async (nextRanges: TimeRange[]) => {
    if (!shouldTrackProgress || !nextRanges.length) return;
    setSaving(true);
    try {
      const sessionReady = await startProgressSession();
      if (!sessionReady) return;

      const response = await fetch("/api/lessons/" + lessonId + "/progress", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ranges", videoId, ranges: nextRanges }),
      });
      if (!response.ok) {
        console.error("[lesson-progress] sync rejected", { status: response.status });
      }
    } catch {
      console.error("[lesson-progress] sync failed");
    } finally {
      setSaving(false);
    }
  }, [lessonId, videoId, shouldTrackProgress, startProgressSession]);

  const handleTimeUpdate = useCallback((event: { currentTime: number }) => {
    if (!shouldTrackProgress) return;
    const current = Math.max(0, Math.min(durationSeconds, event.currentTime));
    const previous = lastTime.current;
    lastTime.current = current;
    if (previous === null) {
      void startProgressSession();
      return;
    }
    const next = previous <= current && current - previous <= 4
      ? mergeTimeRanges([...rangesRef.current, { start: previous, end: current }])
      : rangesRef.current;
    rangesRef.current = next;
    setRanges(next);
    setPercent(watchedPercent(next, durationSeconds));
  }, [durationSeconds, shouldTrackProgress, startProgressSession]);

  useEffect(()=>{
    if(!youtubeId || !youtubeContainerRef.current || !shouldTrackProgress)return;

    let disposed=false;

    const startPolling=()=>{
      if(disposed || !youtubePlayerRef.current || youtubePollRef.current!==null)return;
      youtubePollRef.current=window.setInterval(()=>{
        const player=youtubePlayerRef.current;
        if(!player)return;
        try{
          const currentTime=player.getCurrentTime();
          if(Number.isFinite(currentTime))handleTimeUpdate({currentTime});
        }catch{}
      },1000);
    };

    const createPlayer=()=>{
      if(disposed || !youtubeContainerRef.current || !window.YT?.Player)return;
      youtubePlayerRef.current=new window.YT.Player(youtubeContainerRef.current,{
        videoId:youtubeId,
        playerVars:{rel:0,modestbranding:1,playsinline:1},
        events:{
          onReady:()=>{
            if(disposed)return;
            // Wait for the first PLAYING event before opening a server progress session.
          },
          onStateChange:(event)=>{
            // YouTube PLAYING=1. Stop polling while paused/buffered/ended.
            if(event.data===1)startPolling();
            else if(youtubePollRef.current!==null){
              window.clearInterval(youtubePollRef.current);
              youtubePollRef.current=null;
            }
          },
        },
      });
    };

    if(window.YT?.Player){
      createPlayer();
    }else{
      const previousReady=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=()=>{
        previousReady?.();
        createPlayer();
      };
      const scriptId="shyraq-youtube-iframe-api";
      if(!document.getElementById(scriptId)){
        const script=document.createElement("script");
        script.id=scriptId;
        script.src="https://www.youtube.com/iframe_api";
        script.async=true;
        document.head.appendChild(script);
      }
    }

    return()=>{
      disposed=true;
      if(youtubePollRef.current!==null){
        window.clearInterval(youtubePollRef.current);
        youtubePollRef.current=null;
      }
      try{youtubePlayerRef.current?.destroy();}catch{}
      youtubePlayerRef.current=null;
    };
  },[youtubeId,shouldTrackProgress,durationSeconds,handleTimeUpdate]);

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
          <div ref={youtubeContainerRef} className="h-full w-full" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-900">Бейне ілгерілеуі</p>
              <p className="mt-0.5 text-[10px] text-gray-400">Көрілген бірегей уақыт есептеледі.</p>
            </div>
            <strong className="text-sm text-[#C25100]">{percent.toFixed(0)}%</strong>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#C25100] transition-all duration-300 ease-in-out" style={{width:Math.min(100,percent)+"%"}}/>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] text-gray-400">
              {unlocked ? "Тест ашылды." : "Тестті ашу үшін кемінде "+requiredWatchPercent+"% көру керек."}
            </p>
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
