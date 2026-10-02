import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { SupportTicketManager } from "@/components/staff/SupportTicketManager";

export default async function LeaderSupportPage(){
  const {profile}=await getAuthenticatedStaff("LEADER");
  return <AppShell role="LEADER" userName={profile.full_name} title="Қолдау"><PageContainer className="max-w-5xl"><div className="space-y-5"><SectionHeader eyebrow="ҚОЛДАУ" title="Қолдау өтініштері" /><Card className="p-5 sm:p-6"><SupportTicketManager/></Card></div></PageContainer></AppShell>;
}
