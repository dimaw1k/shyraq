import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateLessonForm } from "@/components/staff/StaffCreateLessonForm";
import { StaffLessonEditForm } from "@/components/staff/StaffLessonEditForm";

export default async function ChiefMentorLessonsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,published,starts_at,created_at")
    .order("sort_order", { ascending: true })
    .limit(100);

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Сабақтар"
      description="Марафон сабақтарын жасау, жариялау және video gate параметрлерін басқару."
    >
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="LESSONS"
            title="Сабақтар"
            description="Kinescope, 85% watch gate, жариялау және рет тәртібін басқару."
          />

          <StaffCreateLessonForm />

          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1.3fr_130px_100px_100px_470px] gap-3 border-b border-[#EFE8E1] bg-[#FCFAF8] px-6 py-3 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#9A9189] xl:grid">
              <span>Сабақ</span>
              <span>Video</span>
              <span>Watch</span>
              <span>Статус</span>
              <span className="text-right">Басқару</span>
            </div>

            <div className="divide-y divide-[#EFE8E1]">
              {(lessons ?? []).map((lesson) => (
                <div
                  key={lesson.id}
                  className="grid gap-4 px-5 py-4 xl:grid-cols-[1.3fr_130px_100px_100px_470px] xl:items-center xl:px-6"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]">
                      <BookOpen size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-[#354153]">{lesson.title}</p>
                      <p className="mt-1 line-clamp-2 text-[9px] text-[#9A9189]">{lesson.description ?? "Сипаттама жоқ"}</p>
                      <p className="mt-1 text-[9px] font-semibold text-[#8B8179]">
                        {Math.round(Number(lesson.duration_seconds) / 60)} мин · #{lesson.sort_order}
                      </p>
                    </div>
                  </div>

                  <p className="truncate text-[9px] font-semibold text-[#8B8179]" title={lesson.kinescope_video_id}>
                    {lesson.kinescope_video_id}
                  </p>

                  <p className="text-[10px] font-extrabold text-[#4B433C]">
                    {lesson.required_watch_percent}%
                  </p>

                  <StatusPill tone={lesson.published ? "green" : "orange"}>
                    {lesson.published ? "PUBLISHED" : "DRAFT"}
                  </StatusPill>

                  <div className="xl:justify-self-end">
                    <StaffLessonEditForm lesson={lesson} />
                  </div>
                </div>
              ))}

              {!lessons?.length ? (
                <div className="p-8">
                  <EmptyState title="Сабақ жоқ." />
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
