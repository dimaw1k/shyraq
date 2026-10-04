import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { HabitBoard } from "@/components/student/HabitBoard";
import { DEFAULT_HABITS } from "@/lib/habits";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { shiftDate, todayInTimezone } from "@/lib/streak";

const HABIT_SELECT =
  "id,name,description,icon,is_default,sort_order,frequency,weekdays,goal,start_date,goal_days,section,reminder_time,repeat_interval,repeat_unit";

export default async function HabitsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "STUDENT";

  if (role !== "STUDENT") {
    redirect(
      role === "MENTOR"
        ? "/mentor"
        : role === "CHIEF_MENTOR"
          ? "/chief-mentor"
          : role === "LEADER"
            ? "/leader"
            : "/dashboard",
    );
  }

  const today = todayInTimezone("Asia/Almaty");

  const { data: existingHabits } = await supabase
    .from("habits")
    .select(HABIT_SELECT)
    .eq("student_id", user.id)
    .eq("active", true)
    .order("sort_order")
    .order("created_at");

  if (!(existingHabits ?? []).length) {
    const admin = createAdminSupabaseClient();

    await admin.from("habits").upsert(
      DEFAULT_HABITS.map((habit) => ({
        student_id: user.id,
        name: habit.name,
        description: habit.description,
        icon: habit.icon,
        is_default: true,
        active: true,
        sort_order: habit.sort_order,
        frequency: habit.frequency,
        weekdays: habit.weekdays,
        goal: habit.goal,
        start_date: today,
        goal_days: null,
        section: habit.section,
        reminder_time: null,
        repeat_interval: 1,
        repeat_unit: "DAY",
      })),
      { onConflict: "student_id,name", ignoreDuplicates: true },
    );
  }

  const [{ data: habits }, { data: checkins }] = await Promise.all([
    supabase
      .from("habits")
      .select(HABIT_SELECT)
      .eq("student_id", user.id)
      .eq("active", true)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("habit_checkins")
      .select("habit_id,completed_date")
      .eq("student_id", user.id)
      .gte("completed_date", shiftDate(today, -90))
      .lte("completed_date", today),
  ]);

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Әдеттер"
      hideHeader
    >
      <PageContainer className="max-w-[1380px] pb-8 pt-4">
        <HabitBoard
          habits={habits ?? []}
          checkins={checkins ?? []}
          today={today}
        />
      </PageContainer>
    </AppShell>
  );
}
