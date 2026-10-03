import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { MarathonDayNavigator } from "@/components/staff/MarathonDayNavigator";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateTaskForm } from "@/components/staff/StaffCreateTaskForm";
import { StaffTaskEditForm } from "@/components/staff/StaffTaskEditForm";
import { MentorTaskRequestQueue } from "@/components/staff/MentorTaskRequestQueue";

export default async function ChiefMentorTasksPage({ searchParams }: { searchParams?: Promise<{ day?: string }> }) {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const selectedDay = Math.min(21, Math.max(1, Number((await searchParams)?.day ?? 1) || 1));
  const [{ data: tasks }, { data: teams }] = await Promise.all([
    supabase.from("tasks").select("id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,max_files,late_points_percent,marathon_day,task_order,active,created_at").order("marathon_day").order("task_order").limit(150),
    supabase.from("teams").select("id,name").order("name"),
  ]);
  const teamMap = new Map((teams ?? []).map((team) => [team.id, team.name]));

  return (
    <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Тапсырмалар">
      <PageContainer>
        <div className="space-y-5">
          <MarathonDayNavigator basePath="/chief-mentor/tasks" selectedDay={selectedDay} />
          <MentorTaskRequestQueue />
          <section className="flex flex-wrap items-end justify-between gap-3">
            <StaffCreateTaskForm teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))} />
          </section>

          <Card className="overflow-hidden">
            <div className="divide-y divide-[#EFE8E1]">
              {(tasks ?? []).filter((task) => Number(task.marathon_day ?? 0) === selectedDay).map((task) => (
                <div key={task.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:px-6">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]"><ClipboardList size={14} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-extrabold text-[#354153]">{task.title}</p>
                    <p className="mt-1 text-[9px] text-[#9A9189]">
                      {task.marathon_day ? task.marathon_day + "-күн" : "Күн жоқ"} · {task.points} ұпай · {task.team_id ? teamMap.get(task.team_id) ?? "Команда" : "Барлық команда"}
                      {task.starts_at ? " · ашылу " + new Date(task.starts_at).toLocaleString("kk-KZ") : ""}
                      {task.deadline ? " · соңғы мерзім " + new Date(task.deadline).toLocaleString("kk-KZ") : ""}
                    </p>
                  </div>
                  <StatusPill tone={task.active ? "green" : "neutral"}>{task.active ? "Белсенді" : "Өшірулі"}</StatusPill>
                  <StaffTaskEditForm task={task} teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))} />
                </div>
              ))}
              {!tasks?.length ? <div className="p-8"><EmptyState title="Тапсырма жоқ." /></div> : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
