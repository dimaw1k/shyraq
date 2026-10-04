import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const day = Number(params.get("day") ?? 0);
  const reportType = params.get("type") === "MORNING" ? "MORNING" : "EVENING";

  const { data, error } = await supabase
    .from("daily_report_questions")
    .select(
      "id,marathon_day,report_type,question,field_key,field_type,required,sort_order",
    )
    .eq("active", true)
    .eq("report_type", reportType)
    .order("sort_order");

  if (error) {
    return NextResponse.json(
      { error: "Есеп сұрақтарын жүктеу сәтсіз." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    questions: (data ?? []).filter(
      (item) => !item.marathon_day || Number(item.marathon_day) === day,
    ),
  });
}
