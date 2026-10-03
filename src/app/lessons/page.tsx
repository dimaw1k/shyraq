import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import {
  Card,
  EmptyState,
  PageContainer,
  SectionHeader,
  StatusPill,
} from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MARATHON_WEEKS } from "@/lib/marathon";
import { formatKzDateTime } from "@/lib/datetime";

function weekForDay(day: number) {
  return MARATHON_WEEKS.find((week) => day >= week.startDay && day <= week.endDay) ?? MARATHON_WEEKS[0];
}

export default async function LessonsPage({
  searchParams,
}: {
  searchParams?: Promise<{ week?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: membership }, { data: lessons }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase
      .from("team_members")
      .select("team_id")
      .eq("student_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle(),
    supabase
      .from("lessons")
      .select(
        "id,title,description,duration_seconds,required_watch_percent,marathon_day,lesson_order,team_id,starts_at,published",
      )
      .eq("published", true)
      .order("marathon_day")
      .order("lesson_order")
      .limit(100),
  ]);

  const role = profile?.role ?? "STUDENT";
  const teamId = membership?.team_id ?? null;
  const visibleLessons =
    role === "STUDENT"
      ? (lessons ?? []).filter((lesson) => !lesson.team_id || lesson.team_id === teamId)
      : lessons ?? [];

  const selectedWeek = Number((await searchParams)?.week ?? 1);
  const activeWeek =
    MARATHON_WEEKS.find((week) => week.week === selectedWeek) ?? MARATHON_WEEKS[0];
  const weekLessons = visibleLessons.filter((lesson) => {
    const day = Number(lesson.marathon_day ?? 0);
    return day >= activeWeek.startDay && day <= activeWeek.endDay;
  });
  const featured = weekLessons[0] ?? visibleLessons[0] ?? null;
  const now = Date.now();

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Сабақтар"
      description="21 күндік оқу жоспарын бір жерден бақыла."
    >
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="ОҚУ"
            title="Сабақтар"
            description="Аптаны таңда, тақырыпты аш және сабақтың бүкіл статусын бірден көр."
          />

          <div className="rounded-[22px] border border-[#E8E1DA] bg-white p-2 shadow-[0_10px_30px_rgba(23,34,53,.035)]">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {MARATHON_WEEKS.map((week) => (
                <Link
                  key={week.week}
                  href={"/lessons?week=" + week.week}
                  className={[
                    "rounded-[15px] px-4 py-3 text-center transition-all",
                    activeWeek.week === week.week
                      ? "bg-[#172235] text-white shadow-[0_8px_18px_rgba(23,34,53,.12)]"
                      : "text-[#786F67] hover:bg-[#FAF8F5] hover:text-[#172235]",
                  ].join(" ")}
                >
                  <span className="block text-[9px] font-extrabold uppercase tracking-[.14em]">
                    {week.week}-апта
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold">
                    {week.subtitle}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {!visibleLessons.length ? (
            <EmptyState title="Жарияланған сабақ жоқ." />
          ) : (
            <section className="grid gap-4 xl:grid-cols-[300px_1fr]">
              <Card className="overflow-hidden">
                <div className="border-b border-[#EFE8E1] bg-[#FFFCF9] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                        {activeWeek.title}
                      </p>
                      <p className="mt-1 text-[13px] font-extrabold text-[#172235]">
                        Тақырыптар
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FFF1E2] px-2.5 py-1 text-[8px] font-extrabold text-[#B95D00]">
                      {weekLessons.length} сабақ
                    </span>
                  </div>

                  <div className="relative mt-3">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A19890]"
                    />
                    <div className="rounded-[11px] border border-[#E8E1DA] bg-white px-3 py-2 pl-9 text-[9px] font-semibold text-[#A19890]">
                      Сабақтар бойынша іздеу
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-[#EFE8E1]">
                  {weekLessons.map((lesson, index) => {
                    const locked =
                      Boolean(lesson.starts_at) &&
                      new Date(lesson.starts_at!).getTime() > now;

                    return (
                      <Link
                        key={lesson.id}
                        href={locked ? "#" : "/lessons/" + lesson.id}
                        aria-disabled={locked}
                        className={[
                          "flex items-center gap-3 px-4 py-3.5 transition",
                          index === 0 ? "bg-[#FFF7F0]" : "hover:bg-[#FFFCF9]",
                          locked ? "pointer-events-none opacity-65" : "",
                        ].join(" ")}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-[#172235] text-[9px] font-extrabold text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[10px] font-extrabold text-[#263247]">
                            {lesson.title}
                          </span>
                          <span className="mt-1 block text-[8px] font-semibold text-[#A19890]">
                            {lesson.marathon_day}-күн · {locked ? "Әлі ашылмаған" : "Лекция"}
                          </span>
                        </span>
                        {locked ? (
                          <LockKeyhole size={14} className="shrink-0 text-[#A19890]" />
                        ) : (
                          <ChevronRight size={14} className="shrink-0 text-[#A19890]" />
                        )}
                      </Link>
                    );
                  })}
                  {!weekLessons.length ? (
                    <div className="p-7 text-center text-[10px] font-semibold text-[#8B8179]">
                      Бұл аптада сабақ жоқ.
                    </div>
                  ) : null}
                </div>
              </Card>

              {featured ? (
                <Card className="overflow-hidden">
                  <div className="grid gap-5 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone="orange">{featured.marathon_day}-КҮН</StatusPill>
                          <span className="text-[9px] font-semibold text-[#A19890]">
                            {weekForDay(Number(featured.marathon_day ?? 1)).subtitle}
                          </span>
                        </div>
                        <h2 className="mt-3 text-[25px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[30px]">
                          {featured.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-xs font-medium leading-6 text-[#766E66]">
                          {featured.description ?? "Сабақты ашып, видеоны ретімен қарап шығыңыз."}
                        </p>
                      </div>

                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#FFF1E2] text-[#FF8000]">
                        <BookOpen size={19} />
                      </span>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                      {([
                        ["САБАҚ", "Лекция", BookOpen],
                        ["БЕЙНЕ КӨРУ", featured.required_watch_percent + "%+", CheckCircle2],
                        [
                          "ҰЗАҚТЫҒЫ",
                          Math.ceil(featured.duration_seconds / 60) + " мин",
                          Clock3,
                        ],
                        [
                          "СТАТУС",
                          featured.starts_at && new Date(featured.starts_at).getTime() > now
                            ? "Күтілуде"
                            : "Ашық",
                          featured.starts_at && new Date(featured.starts_at).getTime() > now
                            ? LockKeyhole
                            : CheckCircle2,
                        ],
                      ] as Array<[string, string, typeof BookOpen]>).map(([label, value, Icon]) => {
                        const MetaIcon = Icon as typeof BookOpen;
                        return (
                          <div
                            key={String(label)}
                            className="rounded-[16px] border border-[#ECE7E2] bg-[#FAF8F5] px-3.5 py-3"
                          >
                            <p className="text-[8px] font-extrabold uppercase tracking-[.13em] text-[#A19890]">
                              {label}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <MetaIcon size={13} className="text-[#FF8000]" />
                              <p className="text-[11px] font-extrabold text-[#334054]">
                                {String(value)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-[20px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#9A9189]">
                            КЕЛЕСІ ҚАДАМ
                          </p>
                          <p className="mt-1 text-[14px] font-extrabold text-[#172235]">
                            Видеоны толық қарап, тестке өту
                          </p>
                        </div>
                        <ArrowRight size={17} className="shrink-0 text-[#FF8000]" />
                      </div>
                      <p className="mt-2 text-[10px] font-semibold leading-5 text-[#8B8179]">
                        {featured.starts_at && new Date(featured.starts_at).getTime() > now
                          ? "Сабақ ашылған кезде осы беттен бірден кіре аласыз."
                          : "85% талап орындалғанда сабақ тесті backend арқылы ашылады."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE8E1] pt-4">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-[#8B8179]">
                        <Clock3 size={12} />
                        {featured.starts_at
                          ? "Ашылуы: " + formatKzDateTime(featured.starts_at)
                          : "Уақыт белгіленбеген"}
                      </span>

                      {featured.starts_at && new Date(featured.starts_at).getTime() > now ? (
                        <span className="inline-flex items-center gap-2 rounded-[12px] bg-[#F4F1EC] px-3.5 py-2.5 text-[9px] font-extrabold text-[#7F756D]">
                          <LockKeyhole size={13} />
                          Әзірге жабық
                        </span>
                      ) : (
                        <Link
                          href={"/lessons/" + featured.id}
                          className="inline-flex items-center gap-2 rounded-[12px] bg-[#FF8000] px-4 py-2.5 text-[9px] font-extrabold text-white shadow-[0_8px_20px_rgba(255,128,0,.16)] transition hover:-translate-y-0.5"
                        >
                          Сабақты ашу
                          <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-8">
                  <EmptyState title="Сабақ таңдаңыз." />
                </Card>
              )}
            </section>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
