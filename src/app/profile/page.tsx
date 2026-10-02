import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/student/ProfileClient";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell role={profile?.role ?? "STUDENT"} userName={profile?.full_name ?? undefined} title="Профиль">
      <PageContainer className="max-w-5xl">
        <div className="space-y-5">
          <SectionHeader eyebrow="АККАУНТ" title="Профиль" description="Жеке деректеріңді және профиль суретіңді басқар." />
          <Card className="p-5 sm:p-6">
            <ProfileClient />
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
