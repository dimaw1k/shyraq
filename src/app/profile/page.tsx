import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/student/ProfileClient";
import { getStudentTranslator } from "@/lib/student-server-language";

export default async function ProfilePage() {
  const { t } = await getStudentTranslator();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell
      role={profile?.role ?? "STUDENT"}
      userName={profile?.full_name ?? undefined}
      title={t("profilePage")}
      hideHeader
    >
      <PageContainer className="max-w-5xl">
        <div>
          <Card className="p-5 sm:p-6">
            <ProfileClient />
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
