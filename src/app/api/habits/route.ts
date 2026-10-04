import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isAllowedHabitIcon } from "@/lib/habits";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "STUDENT") {
    return NextResponse.json({ error: "Әдеттер бөлімі тек оқушыларға арналған." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = cleanText(body?.name);
  const description = cleanText(body?.description);
  const icon = cleanText(body?.icon) || "Sparkles";

  if (name.length < 2 || name.length > 60) {
    return NextResponse.json(
      { error: "Әдет атауы 2-60 таңба аралығында болуы керек." },
      { status: 400 },
    );
  }

  if (description.length > 140) {
    return NextResponse.json(
      { error: "Сипаттама 140 таңбадан аспауы керек." },
      { status: 400 },
    );
  }

  if (!isAllowedHabitIcon(icon)) {
    return NextResponse.json({ error: "Әдет белгішесі дұрыс емес." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: existing } = await admin
    .from("habits")
    .select("id")
    .eq("student_id", user.id)
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Мұндай әдет бұрыннан бар." }, { status: 409 });
  }

  const { data, error } = await admin
    .from("habits")
    .insert({
      student_id: user.id,
      name,
      description: description || null,
      icon,
      is_default: false,
      active: true,
      sort_order: 1000,
    })
    .select("id,name,description,icon,is_default,sort_order")
    .single();

  if (error) {
    console.error("[habits] create failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json({ error: "Әдетті қосу мүмкін болмады." }, { status: 400 });
  }

  return NextResponse.json({ habit: data }, { status: 201 });
}
