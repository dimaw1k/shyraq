import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  ListChecks,
  Trophy,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { calculateCurrentStreak, getSubmittedReportDates, todayInTimezone } from "@/lib/streak";
import { MARATHON_WEEKS } from "@/lib/marathon";
import { DashboardBanner } from "@/components/student/DashboardBanner";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "STUDENT";

  if (role === "MENTOR") redirect("/mentor");
  if (role === "CHIEF_MENTOR") redirect("/chief-mentor");
  if (role === "LEADER") redirect("/leader");

  const [
    { data: banners },
    { data: reports },
    { data: scores },
    { data: membership },
  ] = await Promise.all([
    supabase
      .from("marathon_banners")
      .select("id,title,description,image_path,href")
      .eq("published", true)
      .order("sort_order")
      .limit(8),
    supabase
      .from("daily_reports")
      .select("report_date,status")
      .eq("student_id", user.id)
      .order("report_date", { ascending: false })
      .limit(370),
    supabase.from("score_events").select("points").eq("student_id", user.id),
    supabase
      .from("team_members")
      .select("team_id,teams(name)")
      .eq("student_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle(),
  ]);

  const admin = createAdminSupabaseClient();

  const bannerItems = (banners ?? []).map((banner) => ({
    id: banner.id,
    title: banner.title,
    description: banner.description,
    href: banner.href,
    imageUrl: banner.image_path
      ? admin.storage.from("banners").getPublicUrl(banner.image_path).data.publicUrl
      : null,
  }));

  const today = todayInTimezone("Asia/Almaty");
  const streak = calculateCurrentStreak(
    getSubmittedReportDates(reports ?? []),
    today,
  );
  const score = (scores ?? []).reduce(
    (sum, item) => sum + Number(item.points ?? 0),
    0,
  );
  const team = Array.isArray(membership?.teams)
    ? membership.teams[0]
    : membership?.teams;

  const teamId = membership?.team_id ?? null;
  const todayReport = (reports ?? []).find((report) => report.report_date === today);

  const { data: meetSpace } = teamId
    ? await supabase
        .from("meet_spaces")
        .select("meeting_url,display_name,active")
        .eq("team_id", teamId)
        .eq("active", true)
        .maybeSingle()
    : { data: null };

  const firstName = profile?.full_name?.split(" ")[0] ?? "досым";
  const reportComplete = todayReport?.status === "SUBMITTED";

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Басты бет"
      hideHeader
    >
      <PageContainer className="max-w-[1380px] pb-4 lg:pb-6">
        <div className="space-y-4">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">
                БҮГІН
              </p>
              <h1 className="mt-1 text-[28px] font-extrabold leading-none tracking-[-.05em] text-[#172235] sm:text-[34px]">
                Сәлем, {firstName}.
              </h1>
              <p className="mt-2 text-[11px] font-medium text-[#8B8179]">
                Оқу, тапсырма және прогресс — бір жерде.
              </p>
            </div>

            <Link
              href="/tasks"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-[#E7E0D8] bg-white px-4 text-[10px] font-extrabold text-[#172235] shadow-[0_8px_22px_rgba(23,34,53,.035)] transition hover:-translate-y-0.5 hover:border-[#FFD1A8]"
            >
              Тапсырмаларды ашу
              <ArrowUpRight size={14} className="text-[#FF8000]" />
            </Link>
          </section>

          <DashboardBanner banners={bannerItems} />

          <section className="grid gap-4 lg:grid-cols-[1.45fr_.75fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                    БҮГІНГІ ЖОСПАР
                  </p>
                  <h2 className="mt-1 text-[19px] font-extrabold tracking-[-.04em] text-[#172235]">
                    Қазір не істеу керек?
                  </h2>
                </div>
                <span className="rounded-full bg-[#FFF1E2] px-2.5 py-1 text-[8px] font-extrabold text-[#B95D00]">
                  21 КҮН
                </span>
              </div>

              <div className="mt-4 divide-y divide-[#EFE8E1] rounded-[16px] border border-[#EFE8E1] bg-[#FFFCF9]">
                <Link
                  href="/lessons"
                  className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-white"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
                    <BookOpen size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold text-[#172235]">
                      Сабақты жалғастыр
                    </span>
                    <span className="mt-0.5 block text-[9px] font-medium text-[#9A9189]">
                      Бейнені көріп, тестті аш
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[#B6AEA6] transition group-hover:translate-x-0.5 group-hover:text-[#FF8000]" />
                </Link>

                <Link
                  href="/tasks"
                  className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-white"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#F4F1EC] text-[#5D554E]">
                    <ListChecks size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold text-[#172235]">
                      Тапсырмаларды тексер
                    </span>
                    <span className="mt-0.5 block text-[9px] font-medium text-[#9A9189]">
                      Ашылған жұмыстарды орында
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[#B6AEA6] transition group-hover:translate-x-0.5 group-hover:text-[#FF8000]" />
                </Link>

                <Link
                  href="/reports"
                  className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-white"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#F4F1EC] text-[#5D554E]">
                    {reportComplete ? (
                      <CheckCircle2 size={16} className="text-[#2E7E58]" />
                    ) : (
                      <Clock3 size={16} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold text-[#172235]">
                      Күндік есеп
                    </span>
                    <span className="mt-0.5 block text-[9px] font-medium text-[#9A9189]">
                      {reportComplete ? "Бүгінгі есеп жіберілді" : "Бүгінгі есепті аяқта"}
                    </span>
                  </span>
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[8px] font-extrabold",
                      reportComplete
                        ? "bg-[#EAF7F0] text-[#2E7E58]"
                        : "bg-[#FFF1E2] text-[#B95D00]",
                    ].join(" ")}
                  >
                    {reportComplete ? "ДАЙЫН" : "КҮТІЛУДЕ"}
                  </span>
                </Link>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                    ПРОГРЕСС
                  </p>
                  <h2 className="mt-1 text-[19px] font-extrabold tracking-[-.04em] text-[#172235]">
                    Нәтижең
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5">
                <div className="flex items-center gap-3 rounded-[15px] border border-[#EFE8E1] bg-[#FFFCF9] px-3.5 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
                    <Flame size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#9A9189]">
                      ҚАТАРЫНАН
                    </p>
                    <p className="mt-0.5 text-[18px] font-extrabold tracking-[-.04em] text-[#172235]">
                      {streak} күн
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-[15px] border border-[#EFE8E1] bg-[#FFFCF9] px-3.5 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
                    <Trophy size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#9A9189]">
                      ҰПАЙ
                    </p>
                    <p className="mt-0.5 text-[18px] font-extrabold tracking-[-.04em] text-[#172235]">
                      {score}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-[15px] border border-[#EFE8E1] bg-[#FFFCF9] px-3.5 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
                    <UsersRound size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#9A9189]">
                      КОМАНДА
                    </p>
                    <p className="mt-0.5 truncate text-[15px] font-extrabold tracking-[-.03em] text-[#172235]">
                      {team ? String(team.name) : "Күтілуде"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {meetSpace?.meeting_url ? (
            <section className="flex flex-col gap-3 rounded-[18px] border border-[#E8E1DA] bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(23,34,53,.035)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#EAF7F0] text-[#2E7E58]">
                  <Clock3 size={15} />
                </span>
                <div>
                  <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#2E7E58]">
                    БЕЙНЕ КЕЗДЕСУ
                  </p>
                  <p className="mt-0.5 text-[12px] font-extrabold text-[#172235]">
                    {meetSpace.display_name || "Meet – STUDY STREAM"}
                  </p>
                </div>
              </div>
              <a
                href={meetSpace.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[11px] bg-[#FF8000] px-4 text-[9px] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#E56F00]"
              >
                Кездесуге кіру
                <ArrowUpRight size={13} />
              </a>
            </section>
          ) : null}

          <section>
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                  МАРАФОН
                </p>
                <h2 className="mt-1 text-[19px] font-extrabold tracking-[-.04em] text-[#172235]">
                  21 күндік жол
                </h2>
              </div>
              <Link
                href="/lessons"
                className="text-[9px] font-extrabold text-[#FF8000] hover:underline"
              >
                Сабақтарды көру
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {MARATHON_WEEKS.map((week) => (
                <Link
                  key={week.week}
                  href={"/marathon/week/" + week.week}
                  className="group"
                >
                  <Card className="h-full p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#F3C7B0]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-[#FFF1E2] px-2.5 py-1 text-[8px] font-extrabold text-[#B95D00]">
                        {String(week.week).padStart(2, "0")}
                      </span>
                      <ArrowUpRight
                        size={15}
                        className="text-[#B6AEA6] transition group-hover:text-[#FF8000]"
                      />
                    </div>
                    <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#9A9189]">
                      {week.title}
                    </p>
                    <h3 className="mt-1 text-[18px] font-extrabold tracking-[-.035em] text-[#172235]">
                      {week.subtitle}
                    </h3>
                    <div className="mt-3 flex items-center gap-2 text-[9px] font-semibold text-[#8B8179]">
                      <span>Сабақ</span>
                      <span>·</span>
                      <span>Тест</span>
                      <span>·</span>
                      <span>Тапсырма</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
