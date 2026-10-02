import Link from "next/link";
import { ArrowLeft, BarChart3, BookOpen, ClipboardCheck, FileText, Video } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorStudentProfilePage({params}:{params:Promise<{id:string}>}){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");const {id}=await params;
 const {data:student}=await supabase.from("profiles").select("id,full_name,email,phone,age,education_type,status,created_at").eq("id",id).eq("role","STUDENT").maybeSingle();
 if(!student)notFound();
 const {data:membership}=await supabase.from("team_members").select("team_id").eq("student_id",id).eq("status","ACTIVE").maybeSingle();
 const teamId=membership?.team_id??null;
 const [{data:team},{data:attendance},{data:scores},{data:reports},{data:subs},{data:video},{data:attempts}]=await Promise.all([
  teamId?supabase.from("teams").select("id,name,mentor_id,capacity,status").eq("id",teamId).maybeSingle():Promise.resolve({data:null}),
  supabase.from("attendance_records").select("attendance_percent,status,attended_seconds,meeting_duration_seconds,started_at,ended_at").eq("student_id",id).order("imported_at",{ascending:false}).limit(50),
  supabase.from("score_events").select("source_code,points,created_at,metadata").eq("student_id",id).order("created_at",{ascending:false}).limit(100),
  supabase.from("daily_reports").select("report_date,status,study_minutes,completed_task_count,reflection,difficulties,next_day_goal").eq("student_id",id).order("report_date",{ascending:false}).limit(30),
  supabase.from("task_submissions").select("id,task_id,status,submitted_at,submitted_late,review_comment").eq("student_id",id).order("submitted_at",{ascending:false}).limit(50),
  supabase.from("video_progress").select("lesson_id,watched_percent,completed,test_unlocked,last_watched_at").eq("student_id",id).order("last_watched_at",{ascending:false}).limit(50),
  supabase.from("test_attempts").select("test_id,attempt_number,score,submitted_at").eq("student_id",id).order("submitted_at",{ascending:false}).limit(50),
 ]);
 const mentor=team?.mentor_id?await supabase.from("profiles").select("full_name,phone,email").eq("id",team.mentor_id).maybeSingle():{data:null};
 const avgAttendance=(attendance??[]).length?(attendance??[]).reduce((a,r)=>a+Number(r.attendance_percent??0),0)/(attendance??[]).length:0;
 const scoreTotal=(scores??[]).reduce((a,r)=>a+Number(r.points??0),0);
 const videoAvg=(video??[]).length?(video??[]).reduce((a,r)=>a+Number(r.watched_percent??0),0)/(video??[]).length:0;
 const taskIds=[...new Set((subs??[]).map(x=>x.task_id))];const lessonIds=[...new Set((video??[]).map(x=>x.lesson_id))];
 const [{data:tasks},{data:lessons}]=await Promise.all([
  taskIds.length?supabase.from("tasks").select("id,title,points,deadline").in("id",taskIds):Promise.resolve({data:[] as Array<{id:string;title:string;points:number;deadline:string|null}>}),
  lessonIds.length?supabase.from("lessons").select("id,title,marathon_day").in("id",lessonIds):Promise.resolve({data:[] as Array<{id:string;title:string;marathon_day:number|null}>}),
 ]);
 const taskMap=new Map((tasks??[]).map(x=>[x.id,x]));const lessonMap=new Map((lessons??[]).map(x=>[x.id,x]));
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title={student.full_name} description="Оқушының толық progress профилі">
  <PageContainer><div className="space-y-5">
   <Link href="/chief-mentor/students" className="inline-flex items-center gap-2 text-[10px] font-extrabold text-[#7D746C]"><ArrowLeft size={13}/> Оқушыларға қайту</Link>
   <SectionHeader eyebrow="STUDENT PROFILE" title={student.full_name} description={student.email+" · "+(student.phone||"Телефон жоқ")} action={<StatusPill tone={student.status==="ACTIVE"?"green":student.status==="INACTIVE"?"red":"orange"}>{student.status}</StatusPill>}/>
   <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="SCORE" value={String(Math.round(scoreTotal))} hint="жалпы ұпай" icon={<BarChart3 size={17}/>}/><MetricCard label="ATTENDANCE" value={avgAttendance?avgAttendance.toFixed(1)+"%":"—"} hint="орташа" icon={<BarChart3 size={17}/>}/><MetricCard label="VIDEO" value={videoAvg?videoAvg.toFixed(1)+"%":"—"} hint="орташа қарау" icon={<Video size={17}/>}/><MetricCard label="TEST" value={String((attempts??[]).length)} hint="attempt" icon={<BookOpen size={17}/>}/></section>
   <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
    <Card className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">ПРОФИЛЬ</p><div className="mt-4 grid gap-2">{[["Телефон",student.phone||"—"],["Email",student.email],["Жасы",String(student.age??"—")],["Команда",team?.name??"Команда жоқ"],["Ментор",mentor.data?.full_name??"Ментор жоқ"],["Capacity",String(team?.capacity??"—")]].map(([l,v])=><div key={l} className="rounded-[12px] bg-[#FFFCF9] px-3.5 py-3"><p className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">{l}</p><p className="mt-1 text-[10px] font-bold text-[#172235]">{v}</p></div>)}</div></Card>
    <Card className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4 flex items-center justify-between"><p className="text-[13px] font-extrabold text-[#172235]">Тапсырмалар</p><ClipboardCheck size={16} className="text-[var(--accent)]"/></div><div className="divide-y divide-[#EFE8E1]">{(subs??[]).slice(0,20).map(s=>{const t=taskMap.get(s.task_id);return <div key={s.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_100px_120px] sm:items-center"><div><p className="text-[10px] font-extrabold text-[#354153]">{t?.title??"Тапсырма"}</p><p className="mt-1 text-[8px] text-[#9A9189]">{s.submitted_at?new Date(s.submitted_at).toLocaleString("kk-KZ"):"Жіберілмеген"}{s.submitted_late?" · кеш":""}</p></div><p className="text-[9px] font-semibold text-[#8B8179]">{t?.points??0} ұпай</p><StatusPill tone={s.status==="REVIEWED"?"green":s.status==="REJECTED"?"red":"orange"}>{s.status}</StatusPill></div>})}{!(subs??[]).length?<div className="p-8 text-center text-xs text-[#8B8179]">Submission жоқ.</div>:null}</div></Card>
   </section>
   <section className="grid gap-4 lg:grid-cols-2">
    <Card className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4 flex items-center justify-between"><p className="text-[13px] font-extrabold text-[#172235]">Daily reports</p><FileText size={16} className="text-[var(--accent)]"/></div><div className="divide-y divide-[#EFE8E1]">{(reports??[]).slice(0,15).map((r,i)=><div key={i} className="px-5 py-4"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold text-[#354153]">{r.report_date}</p><StatusPill tone={r.status==="REVIEWED"?"green":r.status==="REJECTED"?"red":"orange"}>{r.status}</StatusPill></div><p className="mt-2 text-[9px] leading-5 text-[#655B53]">{r.reflection||"Мәтін жоқ"} · {r.study_minutes??0} мин · {r.completed_task_count??0} тапсырма</p></div>)}</div></Card>
    <Card className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4 flex items-center justify-between"><p className="text-[13px] font-extrabold text-[#172235]">Видео progress</p><Video size={16} className="text-[var(--accent)]"/></div><div className="divide-y divide-[#EFE8E1]">{(video??[]).slice(0,20).map(v=>{const l=lessonMap.get(v.lesson_id);return <div key={v.lesson_id} className="flex items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><p className="truncate text-[10px] font-extrabold text-[#354153]">{l?.title??"Сабақ"}</p><p className="mt-1 text-[8px] text-[#9A9189]">{l?.marathon_day?l.marathon_day+"-күн":"—"}</p></div><StatusPill tone={v.completed?"green":v.test_unlocked?"orange":"neutral"}>{Number(v.watched_percent??0).toFixed(0)}%</StatusPill></div>})}</div></Card>
   </section>
   <Card className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4"><p className="text-[13px] font-extrabold text-[#172235]">Attendance history</p></div><div className="divide-y divide-[#EFE8E1]">{(attendance??[]).slice(0,30).map((a,i)=><div key={i} className="grid grid-cols-[1fr_90px_120px] gap-3 px-5 py-3.5"><p className="text-[9px] text-[#8B8179]">{a.started_at?new Date(a.started_at).toLocaleDateString("kk-KZ"):"Күн жоқ"}</p><p className="text-[10px] font-extrabold text-[#172235]">{Number(a.attendance_percent??0).toFixed(1)}%</p><p className="text-[9px] font-semibold text-[#8B8179]">{Math.round(Number(a.attended_seconds??0)/60)} мин / {Math.round(Number(a.meeting_duration_seconds??0)/60)} мин</p></div>)}</div></Card>
  </div></PageContainer>
 </AppShell>;
}
