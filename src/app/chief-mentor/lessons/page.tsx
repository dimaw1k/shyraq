import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateLessonForm } from "@/components/staff/StaffCreateLessonForm";
import { StaffLessonEditForm } from "@/components/staff/StaffLessonEditForm";
import { StaffTestEditor } from "@/components/staff/StaffTestEditor";
import { getStaffTestData } from "@/lib/staff/test-data";

export default async function ChiefMentorLessonsPage(){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const {data:lessons}=await supabase.from("lessons").select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,published,starts_at,created_at,materials").order("marathon_day").order("lesson_order").limit(100);
 const testData=await getStaffTestData((lessons??[]).map(l=>l.id));
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Сабақтар" description="Сабақтарды 21 күнге байлап, Kinescope, watch gate, тест және open time басқар."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="LESSONS" title="Сабақтар" description="Әр сабаққа күн, рет, Kinescope, watch %, open time және publish қой."/><StaffCreateLessonForm/><Card className="overflow-hidden"><div className="divide-y divide-[#EFE8E1]">{(lessons??[]).map(lesson=>{const lessonTest=testData.get(lesson.id)??{test:null,questions:[]};return <div key={lesson.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[1.2fr_130px_80px_120px_500px] xl:items-start xl:px-6"><div className="flex min-w-0 items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><BookOpen size={14}/></span><div className="min-w-0"><p className="truncate text-[11px] font-extrabold text-[#354153]">{lesson.title}</p><p className="mt-1 text-[9px] text-[#9A9189]">{lesson.marathon_day?lesson.marathon_day+"-күн":"Күн жоқ"} · {Math.round(Number(lesson.duration_seconds)/60)} мин · #{lesson.lesson_order}</p></div></div><p className="truncate text-[9px] font-semibold text-[#8B8179]" title={lesson.kinescope_video_id}>{lesson.kinescope_video_id}</p><p className="text-[10px] font-extrabold text-[#4B433C]">{lesson.required_watch_percent}%</p><p className="text-[9px] text-[#8B8179]">{lesson.starts_at?"Ашылады "+new Date(lesson.starts_at).toLocaleString("kk-KZ"):"Уақыт жоқ"}</p><div className="space-y-2"><StatusPill tone={lesson.published?"green":"orange"}>{lesson.published?"PUBLISHED":"DRAFT"}</StatusPill><StaffLessonEditForm lesson={lesson}/><StaffTestEditor lessonId={lesson.id} test={lessonTest.test} questions={lessonTest.questions}/></div></div>})}{!lessons?.length?<div className="p-8"><EmptyState title="Сабақ жоқ."/></div>:null}</div></Card></div></PageContainer></AppShell>;
}
