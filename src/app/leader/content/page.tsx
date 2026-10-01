import { BookOpen, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderContentPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const [{ data: lessons }, { data: tasks }] = await Promise.all([
    supabase.from("lessons").select("id,title,description,published,sort_order,starts_at").order("sort_order", { ascending: true }).limit(12),
    supabase.from("tasks").select("id,title,deadline,points,active,team_id").order("deadline", { ascending: true, nullsFirst: false }).limit(12),
  ]);

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Контент" description="Марафон сабақтары мен тапсырмаларының жалпы күйі.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="CONTENT" title="Контент" description="Лидер контенттің толық жағдайын көреді; редакциялау нақты бөлімдерде орындалады." />
          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[#EFE8E1] px-5 py-4"><BookOpen size={17} className="text-[#FF6F2C]" /><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF6F2C]">LESSONS</p><h2 className="mt-1 text-[16px] font-extrabold text-[#172235]">Соңғы сабақтар</h2></div></div>
              <div className="divide-y divide-[#EFE8E1]">
                {(lessons ?? []).map((lesson) => <div key={lesson.id} className="flex items-center gap-3 px-5 py-4"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-extrabold text-[#354153]">{lesson.title}</p><p className="mt-1 truncate text-[9px] text-[#9A9189]">{lesson.description ?? "Сипаттама жоқ"}</p></div><StatusPill tone={lesson.published ? "green" : "orange"}>{lesson.published ? "PUBLISHED" : "DRAFT"}</StatusPill></div>)}
                {!lessons?.length ? <div className="p-8"><EmptyState title="Сабақ жоқ." /></div> : null}
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[#EFE8E1] px-5 py-4"><ClipboardList size={17} className="text-[#FF6F2C]" /><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF6F2C]">TASKS</p><h2 className="mt-1 text-[16px] font-extrabold text-[#172235]">Белсенді тапсырмалар</h2></div></div>
              <div className="divide-y divide-[#EFE8E1]">
                {(tasks ?? []).map((task) => <div key={task.id} className="flex items-center gap-3 px-5 py-4"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-extrabold text-[#354153]">{task.title}</p><p className="mt-1 text-[9px] text-[#9A9189]">{task.points} ұпай · {task.deadline ? new Date(task.deadline).toLocaleDateString("kk-KZ") : "deadline жоқ"}</p></div><StatusPill tone={task.active ? "green" : "neutral"}>{task.active ? "ACTIVE" : "OFF"}</StatusPill></div>)}
                {!tasks?.length ? <div className="p-8"><EmptyState title="Тапсырма жоқ." /></div> : null}
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
