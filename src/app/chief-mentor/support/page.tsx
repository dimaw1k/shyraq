import { LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { ChiefMentorSupportManager } from "@/components/staff/ChiefMentorSupportManager";
import { getAuthenticatedStaff } from "@/lib/staff/server";
export default async function ChiefMentorSupportPage(){const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Қолдау" description="Оқушылардың support өтініштері."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="SUPPORT" title="Қолдау өтініштері" action={<LifeBuoy size={18} className="text-[var(--accent)]"/>}/><Card className="p-5"><ChiefMentorSupportManager/></Card></div></PageContainer></AppShell>;}