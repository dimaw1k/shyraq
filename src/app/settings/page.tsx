import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SupportClient } from "@/components/student/SupportClient";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell role={profile?.role ?? "STUDENT"} userName={profile?.full_name ?? undefined} title="Баптаулар">
      <PageContainer className="max-w-5xl">
        <div className="space-y-5">
          <SectionHeader eyebrow="SUPPORT" title="Баптаулар және Support" description="Парольді қалпына келтіру үшін код күтпей, қолдау қызметіне өтініш жібер." />
          <Card className="p-5 sm:p-6"><SupportClient /></Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
