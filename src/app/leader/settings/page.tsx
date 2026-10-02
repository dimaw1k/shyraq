import { Settings } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { ScoreRulesManager } from "@/components/staff/ScoreRulesManager";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderSettingsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const [{ data: settings }, { data: scoreRules }] = await Promise.all([
    supabase
      .from("marathon_settings")
      .select("name,default_video_watch_percent,default_team_capacity,updated_at")
      .eq("id", true)
      .maybeSingle(),
    supabase
      .from("score_rules")
      .select("id,code,label,weight,active,updated_at")
      .order("code"),
  ]);

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Баптаулар" >
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="БАПТАУЛАР"
            title="Марафон баптаулары"
            description="Негізгі параметрлер."
          />

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#FFF0E8] text-[#FF6F2C]">
                <Settings size={17} />
              </span>
              <div>
                <p className="text-sm font-extrabold text-[#172235]">{settings?.name ?? "Shyraq"}</p>
                <p className="mt-1 text-[10px] text-[#9A9189]">
                  Соңғы жаңарту: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString("kk-KZ") : "—"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] bg-[#FFFCF9] p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">БЕЙНЕ КӨРУ</p>
                <p className="mt-2 text-[22px] font-extrabold text-[#172235]">{settings?.default_video_watch_percent ?? 85}%</p>
              </div>
              <div className="rounded-[16px] bg-[#FFFCF9] p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">КОМАНДА СЫЙЫМДЫЛЫҒЫ</p>
                <p className="mt-2 text-[22px] font-extrabold text-[#172235]">{settings?.default_team_capacity ?? 70}</p>
              </div>
            </div>
          </Card>

          <ScoreRulesManager
            initialRules={(scoreRules ?? []).map((rule) => ({
              ...rule,
              weight: Number(rule.weight ?? 0),
              updated_at: rule.updated_at ?? new Date().toISOString(),
            }))}
          />

          <Card className="p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">РӨЛ ДЕҢГЕЙІ</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill tone="orange">ЖЕТЕКШІ</StatusPill>
              <span className="text-[#9A9189]">→</span>
              <StatusPill tone="orange">АҒА МЕНТОР</StatusPill>
              <span className="text-[#9A9189]">→</span>
              <StatusPill tone="green">МЕНТОР</StatusPill>
              <span className="text-[#9A9189]">→</span>
              <StatusPill>ОҚУШЫ</StatusPill>
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
