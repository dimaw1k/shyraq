import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const reportDate = typeof body?.reportDate === "string" ? body.reportDate : "";
  const marathonDay = typeof body?.marathonDay === "number" && Number.isInteger(body.marathonDay) ? body.marathonDay : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return NextResponse.json({ error: "Есеп күні дұрыс емес." }, { status: 400 });
  if (marathonDay !== null && (marathonDay < 1 || marathonDay > 21)) return NextResponse.json({ error: "Марафон күні дұрыс емес." }, { status: 400 });

  const { data, error } = await supabase.from("daily_reports").upsert({
    student_id:user.id,
    report_date:reportDate,
    marathon_day:marathonDay,
    study_minutes:Math.max(0, Number(body?.studyMinutes ?? 0)),
    completed_task_count:Math.max(0, Number(body?.completedTaskCount ?? 0)),
    reflection:typeof body?.reflection === "string" ? body.reflection.trim() || null : null,
    difficulties:typeof body?.difficulties === "string" ? body.difficulties.trim() || null : null,
    next_day_goal:typeof body?.nextDayGoal === "string" ? body.nextDayGoal.trim() || null : null,
    status:"SUBMITTED",
    submitted_at:new Date().toISOString(),
  }, { onConflict:"student_id,report_date" }).select("id,student_id,report_date,marathon_day,study_minutes,completed_task_count,reflection,difficulties,next_day_goal,status,submitted_at").single();

  if (error) return NextResponse.json({ error: "Есепті сақтау мүмкін болмады." }, { status: 400 });
  return NextResponse.json({ report:data });
}
