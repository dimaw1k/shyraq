import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  const { data: tasks } = await supabase.from("tasks").select("id,title,description,deadline,points").eq("active", true).order("deadline", { ascending: true, nullsFirst: false });
  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Тапсырмалар" description="Оқу үшін берілген барлық белсенді тапсырма.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="ЖҰМЫС" title="Тапсырмалар" description="Келесі қадамды таңда да, орындауға кіріс." />
          <div className="space-y-3">
            {(tasks ?? []).map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="block">
                <Card className="p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#F3C7B0] hover:shadow-[0_18px_48px_rgba(255,111,44,.08)] sm:p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#FFF0E8] text-[#FF6F2C]"><ClipboardList size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[14px] font-extrabold text-[#172235] sm:text-[15px]">{task.title}</h2>
                        <StatusPill tone="orange">+{task.points} ұпай</StatusPill>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-5 text-[#766E66]">{task.description}</p>
                      <p className="mt-3 text-[10px] font-semibold text-[#9A9189]">{task.deadline ? "Мерзімі: " + new Date(task.deadline).toLocaleString("kk-KZ") : "Мерзімі көрсетілмеген"}</p>
                    </div>
                    <ArrowRight size={16} className="mt-1 shrink-0 text-[#B4A9A0]" />
                  </div>
                </Card>
              </Link>
            ))}
            {!tasks?.length ? <EmptyState title="Қазір тапсырма жоқ." description="Жаңа тапсырма шыққанда осы жерден көрінеді." /> : null}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
