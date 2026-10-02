import { FileClock } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { ChiefMentorAuditManager } from "@/components/staff/ChiefMentorAuditManager";
import { getAuthenticatedStaff } from "@/lib/staff/server";
export default async function ChiefMentorAuditPage(){const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");const {data:logs}=await supabase.from("audit_logs").select("id,actor_id,actor_role,action,entity_type,entity_id,metadata,created_at").order("created_at",{ascending:false}).limit(300);return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Журнал" description="Chief Mentor жасаған әрекеттердің толық тарихы."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="AUDIT" title="Әрекет журналы" description="Before / after metadata сақталған операциялық тарих." action={<FileClock size={18} className="text-[var(--accent)]"/>}/><Card className="overflow-hidden"><ChiefMentorAuditManager initialLogs={logs??[]}/></Card></div></PageContainer></AppShell>;}
