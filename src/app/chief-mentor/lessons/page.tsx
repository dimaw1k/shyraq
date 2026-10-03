import Link from "next/link";
import { BookOpen, CalendarClock, CheckCircle2, ChevronRight, FileText, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateLessonForm } from "@/components/staff/StaffCreateLessonForm";
import { StaffLessonEditForm } from "@/components/staff/StaffLessonEditForm";
import { StaffTestEditor } from "@/components/staff/StaffTestEditor";
import { getStaffTestData } from "@/lib/staff/test-data";
import { MARATHON_WEEKS } from "@/lib/marathon";

export default async function ChiefMentorLessonsPage({
  searchParams,
}: {
  searchParams?: Promise<{ week?: string }>;
}) {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const [{ data: lessons }, { data: teams }] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        "id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,team_id,published,starts_at,deadline_at,created_at,materials",
      )
      .order("marathon_day")
      .order("lesson_order")
      .limit(100),
    supabase.from("teams").select("id,name").order("name"),
  ]);

  const testData = await getStaffTestData((lessons ?? []).map((lesson) => lesson.id));
  const teamOptions = (teams ?? []).map((team) => ({ id: team.id, name: team.name }));
  const selectedWeek = Number((await searchParams)?.week ?? 1);
  const activeWeek =
    MARATHON_WEEKS.find((week) => week.week === selectedWeek) ?? MARATHON_WEEKS[0];
  const weekLessons = (lessons ?? []).filter((lesson) => {
    const day = Number(lesson.marathon_day ?? 0);
    return day >= activeWeek.startDay && day <= activeWeek.endDay;
  });

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Сабақтар"
      description="21 күндік контентті реттеу, тексеру және жариялау."
    >
      <PageContainer>
        <div className="space-y-5">
          <section className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeader
              eyebrow="КОНТЕНТ"
              title="Сабақтар"
              description="Аптаны таңдап, сабақтарды скриншоттағыдай ықшам карточкамен басқар."
            />
            <StaffCreateLessonForm teams={teamOptions} />
          </section>

          <div className="rounded-[22px] border border-[#E8E1DA] bg-white p-2 shadow-[0_10px_30px_rgba(23,34,53,.035)]">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {MARATHON_WEEKS.map((week) => (
                <Link
                  key={week.week}
                  href={"/chief-mentor/lessons?week=" + week.week}
                  className={[
                    "rounded-[15px] px-4 py-3 text-center transition-all",
                    activeWeek.week === week.week
                      ? "border border-[#FFD9B3] bg-[#FFF1E2] text-[#B95D00] shadow-[0_6px_18px_rgba(255,128,0,.08)]"
                      : "text-[#786F67] hover:bg-[#FAF8F5] hover:text-[#172235]",
                  ].join(" ")}
                >
                  <span className="block text-[9px] font-extrabold uppercase tracking-[.14em]">
                    {week.week}-апта
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold">{week.subtitle}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
            <Card className="hidden h-fit overflow-hidden xl:block">
              <div className="border-b border-[#EFE8E1] bg-[#FFFCF9] px-4 py-3">
                <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                  {activeWeek.title}
                </p>
                <p className="mt-1 text-[13px] font-extrabold text-[#172235]">Сабақтар тізімі</p>
              </div>
              <div className="divide-y divide-[#EFE8E1]">
                {weekLessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center gap-2.5 px-4 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#172235] text-[8px] font-extrabold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[9px] font-extrabold text-[#364154]">
                        {lesson.title}
                      </span>
                      <span className="mt-0.5 block text-[7px] font-semibold text-[#A19890]">
                        {lesson.marathon_day}-күн
                      </span>
                    </span>
                    <ChevronRight size={12} className="text-[#B0A79F]" />
                  </div>
                ))}
                {!weekLessons.length ? (
                  <div className="p-6 text-center text-[9px] font-semibold text-[#8B8179]">
                    Бұл аптада сабақ жоқ.
                  </div>
                ) : null}
              </div>
            </Card>

            <div className="space-y-3">
              {weekLessons.map((lesson, index) => {
                const lessonTest = testData.get(lesson.id) ?? { test: null, questions: [] };
                const teamName = lesson.team_id
                  ? teams?.find((team) => team.id === lesson.team_id)?.name ?? "Команда"
                  : "Барлық команда";

                const materialCount = Array.isArray(lesson.materials)
                  ? lesson.materials.length
                  : lesson.materials && typeof lesson.materials === "object"
                    ? Object.keys(lesson.materials as Record<string, unknown>).length
                    : 0;

                return (
                  <Card
                    key={lesson.id}
                    className="overflow-hidden border-[#E8E1DA] shadow-[0_10px_35px_rgba(23,34,53,.045)]"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-[#FFF1E2] text-[#B95D00] ring-1 ring-[#FFDDBB]">
                            <span className="text-[9px] font-extrabold">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill tone="orange">{lesson.marathon_day}-КҮН</StatusPill>
                              <span className="text-[8px] font-semibold text-[#A19890]">
                                {teamName}
                              </span>
                            </div>
                            <h2 className="mt-2 text-[16px] font-extrabold tracking-[-.025em] text-[#172235]">
                              {lesson.title}
                            </h2>
                            <p className="mt-1.5 max-w-3xl text-[9px] leading-5 text-[#8B8179]">
                              {lesson.description ?? "Сабақ сипаттамасы қосылмаған."}
                            </p>
                          </div>
                        </div>

                        <StatusPill tone={lesson.published ? "green" : "orange"}>
                          {lesson.published ? "Жарияланған" : "Жоба"}
                        </StatusPill>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                          ["БЕЙНЕ КӨРУ", lesson.required_watch_percent + "%+", PlayCircle],
                          ["ТЕСТ", lessonTest.test ? "Бар" : "Жоқ", CheckCircle2],
                          ["МАТЕРИАЛ", materialCount ? String(materialCount) : "—", FileText],
                          ["АШЫЛУЫ", lesson.starts_at ? "Жоспарланған" : "Бірден", CalendarClock],
                          ["КОМАНДА", teamName, BookOpen],
                        ].map(([label, value, Icon]) => {
                          const MetaIcon = Icon as typeof BookOpen;
                          return (
                            <div
                              key={String(label)}
                              className="rounded-[15px] border border-[#EEE7E1] bg-[#FAF8F5] px-3 py-2.5"
                            >
                              <p className="text-[7px] font-extrabold uppercase tracking-[.13em] text-[#A19890]">
                                {label}
                              </p>
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <MetaIcon size={12} className="text-[#FF8000]" />
                                <p className="truncate text-[9px] font-extrabold text-[#334054]">
                                  {String(value)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F0EBE6] pt-3.5">
                        <StaffLessonEditForm lesson={lesson} teams={teamOptions} />
                        <StaffTestEditor
                          lessonId={lesson.id}
                          test={lessonTest.test}
                          questions={lessonTest.questions}
                        />
                        {lesson.starts_at ? (
                          <span className="ml-auto text-[8px] font-semibold text-[#9A9189]">
                            Ашылуы: {new Date(lesson.starts_at).toLocaleString("kk-KZ")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {!weekLessons.length ? (
                <Card className="p-8">
                  <EmptyState title="Бұл аптада сабақ жоқ." />
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
