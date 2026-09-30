import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (typeof body?.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (typeof body?.description !== "string" || !body.description.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const points = typeof body.points === "number" ? Math.max(0, body.points) : 0;

  const { data, error } = await supabase.from("tasks").insert({
    title: body.title.trim(),
    description: body.description.trim(),
    instructions: typeof body.instructions === "string" ? body.instructions.trim() : null,
    team_id: typeof body.teamId === "string" && body.teamId ? body.teamId : null,
    starts_at: typeof body.startsAt === "string" ? body.startsAt : null,
    deadline: typeof body.deadline === "string" ? body.deadline : null,
    points,
    attachment_required: Boolean(body.attachmentRequired),
    active: body.active !== false,
    created_by: user.id,
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Task creation failed" }, { status: 400 });
  return NextResponse.json({ task: data });
}
