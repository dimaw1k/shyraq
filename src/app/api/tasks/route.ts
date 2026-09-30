import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("tasks").select("id,title,description,instructions,team_id,starts_at,deadline,points,attachment_required,active,created_at").eq("active", true).order("deadline", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: "Unable to load tasks" }, { status: 400 });
  return NextResponse.json({ tasks: data ?? [] });
}
