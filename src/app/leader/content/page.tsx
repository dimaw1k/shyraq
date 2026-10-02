import { BookOpen, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateLessonForm } from "@/components/staff/StaffCreateLessonForm";
import { StaffCreateTaskForm } from "@/components/staff/StaffCreateTaskForm";
import { StaffTaskEditForm } from "@/components/staff/StaffTaskEditForm";
import { StaffLessonEditForm } from "@/components/staff/StaffLessonEditForm";
import { StaffTestEditor } from "@/components/staff/StaffTestEditor";
import { getStaffTestData } from "@/lib/staff/test-data";
import { BannerManager } from "@/components/staff/BannerManager";

export default async function LeaderContentPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const [{ data: lessons }, { data: tasks }, { data: teams }, { data: banners }] = await Promise.all([
    supabase.from("lessons").select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,published,starts_at").order("marathon_day").order("lesson_order").limit(100),
    supabase.from("tasks").select("id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,max_files,marathon_day,task_order,active").order("marathon_day").order("task_order").limit(150),
    supabase.from("teams").select("id,name").order("name"),
    supabase.from("marathon_banners").select("id,title,description,image_path,href,published,starts_at,ends_at,sort_order").order("sort_order").limit(30),
  ]);
  const testData = await getStaffTestData((lessons ?? []).map((lesson) => lesson.id));
  const bannerItems = (banners ?? []).map((banner) => ({...banner, imageUrl:supabase.storage.from("banners").getPublicUrl(banner.image_path).data.publicUrl}));

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Контент" description="Сабақ, тест, тапсырма және dashboard banner-лерін басқар.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="CONTENT" title="Контент" description="Марафонның 21 күндік құрылымын, ашылу уақытын, deadline және жариялануын басқарыңыз." />
          <BannerManager initialBanners={bannerItems} />
          <div className="space-y-3"><StaffCreateLessonForm /><StaffCreateTaskForm teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))} /></div>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[#EFE8E1] px-5 py-4"><BookOpen size={17} className="text-[#FF6F2C]" /><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF6F2C]">LESSONS</p><h2 className="mt-1 text-[16px] font-extrabold text-[#172235]">Сабақтар және тесттер</h2></div></div>
              <div className="divide-y divide-[#EFE8E1]">{(lessons ?? []).map((lesson) => {const lessonTest=testData.get(lesson.id)??{test:null,questions:[]};return <div key={lesson.id} className="space-y-3 px-5 py-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-extrabold text-[#354153]">{lesson.title}</p><p className="mt-1 text-[9px] text-[#9A9189]">{lesson.marathon_day ? lesson.marathon_day+"-күн · " : "Күн тағайындалмаған · "}{Math.round(Number(lesson.duration_seconds)/60)} мин · {lesson.required_watch_percent}% gate{lesson.starts_at ? " · "+new Date(lesson.starts_at).toLocaleString("kk-KZ") : ""}</p></div><StatusPill tone={lesson.published?"green":"orange"}>{lesson.published?"PUBLISHED":"DRAFT"}</StatusPill></div><StaffLessonEditForm lesson={lesson}/><StaffTestEditor lessonId={lesson.id} test={lessonTest.test} questions={lessonTest.questions}/></div>})}{!lessons?.length?<div className="p-8"><EmptyState title="Сабақ жоқ."/></div>:null}</div>
            </Card>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[#EFE8E1] px-5 py-4"><ClipboardList size={17} className="text-[#FF6F2C]"/><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF6F2C]">TASKS</p><h2 className="mt-1 text-[16px] font-extrabold text-[#172235]">Тапсырмаларды басқару</h2></div></div>
              <div className="divide-y divide-[#EFE8E1]">{(tasks ?? []).map((task)=><div key={task.id} className="space-y-3 px-5 py-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-extrabold text-[#354153]">{task.title}</p><p className="mt-1 text-[9px] text-[#9A9189]">{task.marathon_day ? task.marathon_day+"-күн" : "Күн тағайындалмаған"} · {task.points} ұпай · {task.team_id ? teams?.find(t=>t.id===task.team_id)?.name??"Команда табылмады":"Барлық командалар"} · {task.starts_at ? "ашылады "+new Date(task.starts_at).toLocaleString("kk-KZ") : "ашылу уақыты жоқ"} · {task.deadline ? "deadline "+new Date(task.deadline).toLocaleString("kk-KZ") : "deadline жоқ"}</p></div><StatusPill tone={task.active?"green":"neutral"}>{task.active?"ACTIVE":"OFF"}</StatusPill></div><StaffTaskEditForm task={task} teams={(teams ?? []).map(t=>({id:t.id,name:t.name}))}/></div>)}{!tasks?.length?<div className="p-8"><EmptyState title="Тапсырма жоқ."/></div>:null}</div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
