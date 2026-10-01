import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorLessonsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { data: lessons } = await supabase.from("lessons").select("id,title,description,published,sort_order,starts_at,created_at").order("sort_order", { ascending: true }).limit(100);
  return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Сабақтар" description="Марафон сабақтарының операциялық контент бөлімі."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="LESSONS" title="Сабақтар" description="Жарияланған және draft сабақтарды бақылау."/><Card className="overflow-hidden"><div className="divide-y divide-[#EFE8E1]">{(lessons??[]).map((lesson)=><div key={lesson.id} className="flex gap-3 px-5 py-4 sm:px-6"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><BookOpen size={14}/></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-extrabold text-[#354153]">{lesson.title}</p><p className="mt-1 text-[9px] text-[#9A9189]">{lesson.description??"Сипаттама жоқ"}</p></div><StatusPill tone={lesson.published?"green":"orange"}>{lesson.published?"PUBLISHED":"DRAFT"}</StatusPill></div>)}{!lessons?.length?<div className="p-8"><EmptyState title="Сабақ жоқ."/></div>:null}</div></Card></div></PageContainer></AppShell>;
}
