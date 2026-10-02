import { FileClock } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderAuditPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const { data: logs } = await supabase.from("audit_logs").select("id,actor_id,actor_role,action,entity_type,entity_id,metadata,created_at").order("created_at", { ascending: false }).limit(100);

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Журнал">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="ЖУРНАЛ" title="Әрекет журналы" />
          <Card className="overflow-hidden">
            <div className="divide-y divide-[#EFE8E1]">
              {(logs ?? []).map((log) => (
                <div key={log.id} className="flex gap-3 px-5 py-4 sm:px-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F6F2ED] text-[#6F665E]"><FileClock size={14} /></span>
                  <div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold text-[#354153]">{log.action}</p><p className="mt-1 text-[9px] text-[#9A9189]">{log.entity_type} · {log.actor_role ?? "ЖҮЙЕ"} · {new Date(log.created_at).toLocaleString("kk-KZ")}</p></div><StatusPill tone="neutral">{log.entity_id ? log.entity_id.slice(0, 8) : "ЖҮЙЕ"}</StatusPill>
                </div>
              ))}
              {!logs?.length ? <div className="p-8"><EmptyState title="Audit журналы бос." /></div> : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
