import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, ArrowRight, Flame, Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateCurrentStreak, calculateLongestStreak, getReviewedReportDates, todayInTimezone } from "@/lib/streak";

export default async function MarathonFinalPage(){
 const supabase=await createServerSupabaseClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const [{data:profile},{data:lessons},{data:video},{data:tasks},{data:reports},{data:tests},{data:scores}]=await Promise.all([
  supabase.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle(),
  supabase.from("lessons").select("id").eq("published",true),
  supabase.from("video_progress").select("lesson_id,test_unlocked").eq("student_id",user.id),
  supabase.from("task_submissions").select("id,status").eq("student_id",user.id),
  supabase.from("daily_reports").select("report_date,status,marathon_day").eq("student_id",user.id),
  supabase.from("test_attempts").select("id,score").eq("student_id",user.id),
  supabase.from("score_events").select("points").eq("student_id",user.id),
 ]);
 const completedLessons=new Set((video??[]).filter(x=>x.test_unlocked).map(x=>x.lesson_id)).size;
 const reviewedTasks=(tasks??[]).filter(x=>x.status==="REVIEWED").length;
 const reviewedReports=(reports??[]).filter(x=>x.status==="REVIEWED").length;
 const totalComponents=(lessons?.length??0)+(tasks?.length??0)+21;
 const completedComponents=completedLessons+reviewedTasks+reviewedReports;
 const progress=totalComponents?Math.min(100,Math.round(completedComponents/totalComponents*100)):0;
 const score=(scores??[]).reduce((sum,item)=>sum+Number(item.points??0),0);
 const currentStreak=calculateCurrentStreak(getReviewedReportDates(reports??[]),todayInTimezone("Asia/Almaty"));
 const longestStreak=calculateLongestStreak(getReviewedReportDates(reports??[]));
 const complete=reviewedReports>=21&&completedLessons===(lessons?.length??0)&&reviewedTasks===(tasks?.length??0);

 return <AppShell role={profile?.role??"STUDENT"} userName={profile?.full_name??undefined} title="21 күндік нәтиже" description="Шырақ марафонының қорытындысы">
  <PageContainer className="max-w-5xl"><div className="space-y-5">
   <SectionHeader eyebrow="FINAL RESULT" title="Шырақ марафоны · 21 күн" description={complete?"Марафон толық аяқталды.":"Марафон нәтижесі мен ағымдағы прогресс."}/>
   <Card className="overflow-hidden p-0"><div className="bg-[#172235] p-7 text-white sm:p-10"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF9A72]">SHYRAQ MARATHON</p><h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-6xl">{progress}%</h2><p className="mt-2 text-sm text-white/60">{completedComponents} / {totalComponents} негізгі компонент орындалды</p></div><StatusPill tone={complete?"green":"orange"}>{complete?"МАРАФОН АЯҚТАЛДЫ":"ОРЫНДАЛУДА"}</StatusPill></div></div>
    <div className="grid gap-3 p-5 sm:grid-cols-4"><MetricCard label="SCORE" value={String(score)} hint="жиналған ұпай" icon={<Trophy size={17}/>}/><MetricCard label="STREAK" value={String(currentStreak)+" күн"} hint={"рекорд "+longestStreak} icon={<Flame size={17}/>}/><MetricCard label="TESTS" value={String(tests?.length??0)} hint="орындалған тест"/><MetricCard label="REPORTS" value={String(reviewedReports)+" / 21"} hint="тексерілген есеп"/></div>
   </Card>

   {complete?<Card className="border-[#F3C7B0] bg-[#FFF8F3] p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-[18px] bg-[#FF6F2C] text-white"><Award size={26}/></span><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#C85E2F]">CERTIFICATE / BADGE</p><h3 className="mt-1 text-xl font-extrabold text-[#172235]">Шырақ 21 күн марафоны аяқталды</h3><p className="mt-1 text-xs text-[#7F756D]">Нәтижеңді сақтап, сертификатты баспаға шығара аласың.</p></div></div><div className="flex gap-2"><Link href="/rankings" className="inline-flex items-center gap-2 rounded-[12px] border border-[#E8D8CF] bg-white px-4 py-3 text-[10px] font-extrabold text-[#5C5149]">Рейтинг <ArrowRight size={13}/></Link><button type="button" onClick={()=>{}} className="rounded-[12px] bg-[#FF6F2C] px-4 py-3 text-[10px] font-extrabold text-white">Сертификат</button></div></div></Card>:null}

   <div className="grid gap-3 sm:grid-cols-3"><Link href="/marathon/week/1"><Card className="h-full p-5 hover:border-[#F3C7B0]"><p className="text-[10px] font-extrabold text-[#FF6F2C]">1–7</p><h3 className="mt-1 text-sm font-extrabold">1-апта</h3></Card></Link><Link href="/marathon/week/2"><Card className="h-full p-5 hover:border-[#F3C7B0]"><p className="text-[10px] font-extrabold text-[#FF6F2C]">8–13</p><h3 className="mt-1 text-sm font-extrabold">2-апта</h3></Card></Link><Link href="/marathon/week/3"><Card className="h-full p-5 hover:border-[#F3C7B0]"><p className="text-[10px] font-extrabold text-[#FF6F2C]">14–21</p><h3 className="mt-1 text-sm font-extrabold">3-апта</h3></Card></Link></div>
  </div></PageContainer>
 </AppShell>;
}
