import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { calculateCurrentStreak, getSubmittedReportDates, todayInTimezone } from "@/lib/streak";
import { MARATHON_WEEKS } from "@/lib/marathon";
import { DashboardBanner } from "@/components/student/DashboardBanner";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  const role = profile?.role ?? "STUDENT";
  if (role === "MENTOR") redirect("/mentor");
  if (role === "CHIEF_MENTOR") redirect("/chief-mentor");
  if (role === "LEADER") redirect("/leader");

  const [{ data: banners }, { data: reports }, { data: scores }, { data: membership }] = await Promise.all([
    supabase.from("marathon_banners").select("id,title,description,image_path,href").eq("published", true).order("sort_order").limit(8),
    supabase.from("daily_reports").select("report_date,status").eq("student_id", user.id).order("report_date", { ascending: false }).limit(370),
    supabase.from("score_events").select("points").eq("student_id", user.id),
    supabase.from("team_members").select("team_id,teams(name)").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
  ]);

  const admin = createAdminSupabaseClient();
  const bannerItems = (banners ?? []).map((banner) => ({
    id: banner.id,
    title: banner.title,
    description: banner.description,
    href: banner.href,
    imageUrl: banner.image_path ? admin.storage.from("banners").getPublicUrl(banner.image_path).data.publicUrl : null,
  }));

  const today = todayInTimezone("Asia/Almaty");
  const streak = calculateCurrentStreak(getSubmittedReportDates(reports ?? []), today);
  const score = (scores ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0);
  const team = Array.isArray(membership?.teams) ? membership.teams[0] : membership?.teams;
  const teamId = membership?.team_id ?? null;
  const { data: meetSpace } = teamId
    ? await supabase.from("meet_spaces").select("meeting_url,display_name,active").eq("team_id", teamId).eq("active", true).maybeSingle()
    : { data: null };
  const firstName = profile?.full_name?.split(" ")[0] ?? "досым";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Басты бет" hideHeader>
      <PageContainer>
        <div className="space-y-6">
          <DashboardBanner banners={bannerItems} />

          <section className="grid gap-4 md:grid-cols-3">
            {MARATHON_WEEKS.map((week) => (
              <Link key={week.week} href={"/marathon/week/" + week.week} className="group">
                <Card className="h-full overflow-hidden p-0 transition duration-200 group-hover:-translate-y-1 group-hover:border-[#F3C7B0] group-hover:shadow-[0_24px_70px_rgba(255,128,0,.10)]">
                  <div className="relative min-h-[190px] p-5 sm:p-6">
                    <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#FFF0E8] blur-2xl transition group-hover:scale-125" />
                    <div className="relative">
                      <span className="inline-flex rounded-full bg-[#FFF0E8] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#C85E2F]">21 КҮН</span>
                      <p className="mt-10 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">{week.title}</p>
                      <h2 className="mt-1 text-2xl font-extrabold tracking-[-.04em] text-[#172235]">{week.subtitle}</h2>
                      <p className="mt-4 text-xs leading-5 text-[#8B8179]">Сабақ, тест, тапсырма және есеп.</p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#ff8000]">Аптаны ашу <ArrowRight size={13} /></span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </section>

          {meetSpace?.meeting_url ? (
            <section className="rounded-[20px] border border-[#E8E1DA] bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#ff8000]">БЕЙНЕ КЕЗДЕСУ</p>
                  <h2 className="mt-1.5 text-lg font-extrabold text-[#172235]">{meetSpace.display_name || "Meet – STUDY STREAM"}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#8B8179]">Өз командаңның онлайн сабағына осы жерден кір.</p>
                </div>
                <a
                  href={meetSpace.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-[12px] bg-[#ff8000] px-5 py-3 text-[10px] font-extrabold text-white transition hover:-translate-y-0.5 hover:opacity-90"
                >
                  Кездесуге кіру
                </a>
              </div>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="ҚАТАРЫНАН ОҚУ КҮНДЕРІ" value={streak + " күн"} hint="күндік белсенділік" icon={<Flame size={17} />} />
            <MetricCard label="ҰПАЙ" value={String(score)} hint="жиналған ұпай" icon={<Trophy size={17} />} />
            <MetricCard label="КОМАНДА" value={team ? String(team.name) : "Күтілуде"} hint="қазіргі командаң" />
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
