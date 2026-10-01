import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LessonsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  const { data: lessons } = await supabase.from("lessons").select("id,title,description,duration_seconds,required_watch_percent,sort_order,starts_at").eq("published", true).order("sort_order", { ascending: true });
  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Сабақтар" description="Сабақтарды қарап, прогресті бір жерден басқар.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="ОҚУ" title="Сабақтар" description="Сабақты ашып, көру прогресіңді жалғастыр." />
          <div className="grid gap-4 md:grid-cols-2">
            {(lessons ?? []).map((lesson) => (
              <Card key={lesson.id} className="p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#F3C7B0]">
                <div className="flex items-center justify-between gap-3">
                  <StatusPill tone="orange">{String(lesson.sort_order + 1).padStart(2, "0")}</StatusPill>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9A9189]"><Clock3 size={12} /> {Math.ceil(lesson.duration_seconds / 60)} мин</span>
                </div>
                <h2 className="mt-4 text-[16px] font-extrabold tracking-[-.02em] text-[#172235]">{lesson.title}</h2>
                {lesson.description ? <p className="mt-1.5 text-xs font-medium leading-5 text-[#766E66]">{lesson.description}</p> : null}
                <div className="mt-5 rounded-[14px] bg-[#F6F2ED] px-3.5 py-3 text-[10px] font-semibold text-[#7F756D]">Тестке өту үшін кемінде {lesson.required_watch_percent}% көру керек.</div>
                <Link href={`/lessons/${lesson.id}` className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#FF6F2C]">Сабақты ашу <ArrowRight size={14} /></Link>
              </Card>
            ))}
            {!lessons?.length ? <div className="md:col-span-2"><EmptyState title="Жарияланған сабақ жоқ." /></div> : null}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
