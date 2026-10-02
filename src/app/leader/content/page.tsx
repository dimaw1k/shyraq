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
    supabase.from("lessons").select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,published,starts_at,deadline_at,materials").order("marathon_day").order("lesson_order").limit(100),
    supabase.from("tasks").select("id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,active").order("marathon_day").order("task_order").limit(150),
    supabase.from("teams").select("id,name").order("name"),
    supabase.from("marathon_banners").select("id,title,description,image_path,href,published,starts_at,ends_at,sort_order").order("sort_order").limit(30),
  ]);

  const testData = await getStaffTestData((lessons ?? []).map((lesson) => lesson.id));
  const bannerItems = (banners ?? []).map((banner) => ({
    ...banner,
    imageUrl: supabase.storage.from("banners").getPublicUrl(banner.image_path).data.publicUrl,
  }));

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Контент">
      <PageContainer>
        <div className="space-y-5">
          <section className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeader eyebrow="КОНТЕНТ" title="Марафон материалдары" description="Баннер, сабақ және тапсырманы бөлек батырмалар арқылы басқарыңыз." />
            <div className="flex flex-wrap gap-2">
              <StaffCreateLessonForm />
              <StaffCreateTaskForm teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))} />
            </div>
          </section>

          <BannerManager initialBanners={bannerItems} />

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[#EFE8E1] px-5 py-4">
                <BookOpen size={17} className="text-[#FF8000]" />
                <div><h2 className="text-[16px] font-extrabold text-[#172235]">Сабақтар</h2><p className="mt-1 text-[9px] text-[#9A9189]">Қысқа тізім және өңдеу.</p></div>
              </div>
              <div className="divide-y divide-[#EFE8E1]">
                {(lessons ?? []).map((lesson) => {
                  const lessonTest = testData.get(lesson.id) ?? { test: null, questions: [] };
                  return (
                    <div key={lesson.id} className="space-y-3 px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-extrabold text-[#354153]">{lesson.title}</p>
                          <p className="mt-1 text-[9px] text-[#9A9189]">
                            {lesson.marathon_day ? lesson.marathon_day + "-күн · " : ""}
                            {Math.round(Number(lesson.duration_seconds) / 60)} мин
                            {lesson.starts_at ? " · ашылу " + new Date(lesson.starts_at).toLocaleString("kk-KZ") : ""}
                            {lesson.deadline_at ? " · дедлайн " + new Date(lesson.deadline_at).toLocaleString("kk-KZ") : ""}
                          </p>
                        </div>
                        <StatusPill tone={lesson.published ? "green" : "orange"}>{lesson.published ? "Жарияланған" : "Жоба"}</StatusPill>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StaffLessonEditForm lesson={lesson} />
                        <StaffTestEditor lessonId={lesson.id} test={lessonTest.test} questions={lessonTest.questions} />
                      </div>
                    </div>
                  );
                })}
                {!lessons?.length ? <div className="p-8"><EmptyState title="Сабақ жоқ." /></div> : null}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[#EFE8E1] px-5 py-4">
                <ClipboardList size={17} className="text-[#FF8000]" />
                <div><h2 className="text-[16px] font-extrabold text-[#172235]">Тапсырмалар</h2><p className="mt-1 text-[9px] text-[#9A9189]">Қысқа тізім және өңдеу.</p></div>
              </div>
              <div className="divide-y divide-[#EFE8E1]">
                {(tasks ?? []).map((task) => (
                  <div key={task.id} className="space-y-3 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-extrabold text-[#354153]">{task.title}</p>
                        <p className="mt-1 text-[9px] text-[#9A9189]">
                          {task.marathon_day ? task.marathon_day + "-күн" : "Күн жоқ"} · {task.points} ұпай
                          {task.team_id ? " · " + (teams?.find((team) => team.id === task.team_id)?.name ?? "Команда") : " · Барлық команда"}
                          {task.deadline ? " · дедлайн " + new Date(task.deadline).toLocaleString("kk-KZ") : ""}
                        </p>
                      </div>
                      <StatusPill tone={task.active ? "green" : "neutral"}>{task.active ? "Белсенді" : "Өшірулі"}</StatusPill>
                    </div>
                    <StaffTaskEditForm task={task} teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))} />
                  </div>
                ))}
                {!tasks?.length ? <div className="p-8"><EmptyState title="Тапсырма жоқ." /></div> : null}
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
