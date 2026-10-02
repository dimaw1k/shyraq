import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateLessonForm } from "@/components/staff/StaffCreateLessonForm";
import { StaffLessonEditForm } from "@/components/staff/StaffLessonEditForm";
import { StaffTestEditor } from "@/components/staff/StaffTestEditor";
import { getStaffTestData } from "@/lib/staff/test-data";

export default async function ChiefMentorLessonsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,published,starts_at,deadline_at,created_at,materials")
    .order("marathon_day")
    .order("lesson_order")
    .limit(100),
    supabase.from("teams").select("id,name").order("name"),
  ]);

  const testData = await getStaffTestData((lessons ?? []).map((lesson) => lesson.id));

  return (
    <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Сабақтар">
      <PageContainer>
        <div className="space-y-5">
          <section className="flex flex-wrap items-end justify-between gap-3">
            <StaffCreateLessonForm teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))} />
          </section>

          <Card className="overflow-hidden">
            <div className="divide-y divide-[#EFE8E1]">
              {(lessons ?? []).map((lesson) => {
                const lessonTest = testData.get(lesson.id) ?? { test: null, questions: [] };
                return (
                  <div key={lesson.id} className="space-y-3 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]"><BookOpen size={14} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-extrabold text-[#354153]">{lesson.title}</p>
                        <p className="mt-1 text-[9px] text-[#9A9189]">
                          {lesson.marathon_day ? lesson.marathon_day + "-күн" : "Күн жоқ"} · {lesson.team_id ? (teams?.find((team) => team.id === lesson.team_id)?.name ?? "Команда") : "Барлық команда"}
                          {lesson.starts_at ? " · ашылу " + new Date(lesson.starts_at).toLocaleString("kk-KZ") : ""}
                          {lesson.deadline_at ? " · соңғы мерзім " + new Date(lesson.deadline_at).toLocaleString("kk-KZ") : ""}
                        </p>
                      </div>
                      <StatusPill tone={lesson.published ? "green" : "orange"}>{lesson.published ? "Жарияланған" : "Жоба"}</StatusPill>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StaffLessonEditForm lesson={lesson} teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))} />
                      <StaffTestEditor lessonId={lesson.id} test={lessonTest.test} questions={lessonTest.questions} />
                    </div>
                  </div>
                );
              })}
              {!lessons?.length ? <div className="p-8"><EmptyState title="Сабақ жоқ." /></div> : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
