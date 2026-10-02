import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateTaskForm } from "@/components/staff/StaffCreateTaskForm";
import { StaffTaskEditForm } from "@/components/staff/StaffTaskEditForm";

export default async function ChiefMentorTasksPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const [{ data: tasks }, { data: teams }] = await Promise.all([
    supabase.from("tasks").select("id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,active,created_at").order("marathon_day").order("task_order").limit(150),
    supabase.from("teams").select("id,name").order("name"),
  ]);
  const teamMap=new Map((teams ?? []).map(t=>[t.id,t.name]));
  return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Тапсырмалар" description="21 күндік тапсырмаларды жасау, ашылу уақытын және deadline басқару."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="TASKS" title="Тапсырмалар" description="Әр тапсырмаға күн, рет, open time, deadline, team және файл лимитін қой."/><StaffCreateTaskForm teams={(teams ?? []).map(t=>({id:t.id,name:t.name}))}/><Card className="overflow-hidden"><div className="divide-y divide-[#EFE8E1]">{(tasks ?? []).map(task=><div key={task.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[1.25fr_160px_150px_100px_520px] xl:items-center xl:px-6"><div className="flex min-w-0 items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><ClipboardList size={14}/></span><div className="min-w-0"><p className="truncate text-[11px] font-extrabold text-[#354153]">{task.title}</p><p className="mt-1 line-clamp-2 text-[9px] text-[#9A9189]">{task.description}</p><p className="mt-1 text-[9px] font-semibold text-[#8B8179]">{task.marathon_day ? task.marathon_day+"-күн · " : ""}{task.points} ұпай · кеш {task.late_points_percent}% · {task.attachment_required ? "Файл міндетті" : "Файл optional"}</p></div></div><p className="text-[9px] font-semibold text-[#8B8179]">{task.team_id?teamMap.get(task.team_id)??"Команда табылмады":"Барлығы"}</p><p className="text-[9px] font-semibold text-[#8B8179]">{task.starts_at?"Ашылады "+new Date(task.starts_at).toLocaleString("kk-KZ"):"Ашылу уақыты жоқ"}</p><StatusPill tone={task.active?"green":"neutral"}>{task.active?"ACTIVE":"OFF"}</StatusPill><div><StaffTaskEditForm task={task} teams={(teams ?? []).map(t=>({id:t.id,name:t.name}))}/></div></div>)}{!tasks?.length?<div className="p-8"><EmptyState title="Тапсырма жоқ."/></div>:null}</div></Card></div></PageContainer></AppShell>;
}
