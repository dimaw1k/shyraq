import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (typeof body?.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (typeof body?.kinescopeVideoId !== "string" || !body.kinescopeVideoId.trim()) return NextResponse.json({ error: "kinescopeVideoId is required" }, { status: 400 });

  const durationSeconds = typeof body.durationSeconds === "number" ? Math.floor(body.durationSeconds) : 0;
  if (durationSeconds <= 0) return NextResponse.json({ error: "durationSeconds must be positive" }, { status: 400 });

  const requiredWatchPercent =
    typeof body.requiredWatchPercent === "number"
      ? Math.min(100, Math.max(0, body.requiredWatchPercent))
      : 85;

  const { data, error } = await supabase.from("lessons").insert({
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() : null,
    kinescope_video_id: body.kinescopeVideoId.trim(),
    duration_seconds: durationSeconds,
    required_watch_percent: requiredWatchPercent,
    sort_order: typeof body.sortOrder === "number" ? Math.floor(body.sortOrder) : 0,
    published: Boolean(body.published),
    starts_at: typeof body.startsAt === "string" ? body.startsAt : null,
    created_by: user.id,
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Lesson creation failed" }, { status: 400 });
  return NextResponse.json({ lesson: data });
}
