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
  const firstName = profile?.full_name?.split(" ")[0] ?? "досым";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Басты бет" hideHeader>
      <PageContainer>
        <div className="space-y-6">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF6F2C]">SHYRAQ MARATHON</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em] text-[#172235] sm:text-4xl">Сәлем, {firstName}</h1>
              <p className="mt-2 text-sm text-[#8B8179]">Бүгінгі қадамыңды баста. Әр күн — нәтиже.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-2 text-[10px] font-extrabold text-[#7A7068] ring-1 ring-[#E8E1DA]"><Flame size={12} className="mr-1 inline text-[#FF6F2C]" />{streak} күн streak</span>
              <span className="rounded-full bg-white px-3 py-2 text-[10px] font-extrabold text-[#7A7068] ring-1 ring-[#E8E1DA]"><Trophy size={12} className="mr-1 inline text-[#FF6F2C]" />{score} ұпай</span>
            </div>
          </section>

          <DashboardBanner banners={bannerItems} />

          <section className="grid gap-4 md:grid-cols-3">
            {MARATHON_WEEKS.map((week) => (
              <Link key={week.week} href={"/marathon/week/" + week.week} className="group">
                <Card className="h-full overflow-hidden p-0 transition duration-200 group-hover:-translate-y-1 group-hover:border-[#F3C7B0] group-hover:shadow-[0_24px_70px_rgba(255,111,44,.10)]">
                  <div className="relative min-h-[190px] p-5 sm:p-6">
                    <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#FFF0E8] blur-2xl transition group-hover:scale-125" />
                    <div className="relative">
                      <span className="inline-flex rounded-full bg-[#FFF0E8] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#C85E2F]">21 КҮН</span>
                      <p className="mt-10 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">{week.title}</p>
                      <h2 className="mt-1 text-2xl font-extrabold tracking-[-.04em] text-[#172235]">{week.subtitle}</h2>
                      <p className="mt-4 text-xs leading-5 text-[#8B8179]">Аптаны ашып, сол кезеңнің сабақтарын, тесттерін, тапсырмаларын және күндік есептерін орында.</p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#FF6F2C]">Аптаны ашу <ArrowRight size={13} /></span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="STREAK" value={streak + " күн"} hint="күндік белсенділік" icon={<Flame size={17} />} />
            <MetricCard label="ҰПАЙ" value={String(score)} hint="жиналған ұпай" icon={<Trophy size={17} />} />
            <MetricCard label="КОМАНДА" value={team ? String(team.name) : "Күтілуде"} hint="қазіргі командаң" />
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
