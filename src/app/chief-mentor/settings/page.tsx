import { Settings } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { ChiefMentorSettingsManager } from "@/components/staff/ChiefMentorSettingsManager";
import { getAuthenticatedStaff } from "@/lib/staff/server";
export default async function ChiefMentorSettingsPage(){const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Баптаулар" description="Операциялық марафон параметрлері."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="SETTINGS" title="Баптаулар" description="Марафонның оқу процесіне қатысты параметрлері." action={<Settings size={18} className="text-[var(--accent)]"/>}/><ChiefMentorSettingsManager/></div></PageContainer></AppShell>;}
