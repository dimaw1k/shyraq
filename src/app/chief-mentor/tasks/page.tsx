import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorTasksPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { data: tasks } = await supabase.from("tasks").select("id,title,description,deadline,points,active,team_id,created_at").order("deadline",{ascending:true,nullsFirst:false}).limit(150);
  return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Тапсырмалар" description="Марафон тапсырмаларының жалпы басқару көрінісі."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="TASKS" title="Тапсырмалар" description="Active тапсырмалар мен deadline-дерді бақылау."/><Card className="overflow-hidden"><div className="divide-y divide-[#EFE8E1]">{(tasks??[]).map((task)=><div key={task.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.3fr_1fr_100px_100px] sm:items-center sm:px-6"><div><p className="truncate text-[11px] font-extrabold text-[#354153]">{task.title}</p><p className="mt-1 truncate text-[9px] text-[#9A9189]">{task.description}</p></div><p className="text-[9px] font-semibold text-[#8B8179]">{task.deadline?new Date(task.deadline).toLocaleString("kk-KZ"):"Deadline жоқ"}</p><p className="text-[10px] font-extrabold text-[#4B433C]">{task.points} ұпай</p><StatusPill tone={task.active?"green":"neutral"}>{task.active?"ACTIVE":"OFF"}</StatusPill></div>)}{!tasks?.length?<div className="p-8"><EmptyState title="Тапсырма жоқ."/></div>:null}</div></Card></div></PageContainer></AppShell>;
}
