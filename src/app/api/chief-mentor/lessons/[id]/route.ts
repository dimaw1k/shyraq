import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;

  let body: {
    title?: string;
    description?: string | null;
    kinescopeVideoId?: string;
    durationSeconds?: number;
    requiredWatchPercent?: number;
    sortOrder?: number;
    published?: boolean;
    startsAt?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from("lessons")
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,published,starts_at")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "Сабақты жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Сабақ табылмады." }, { status: 404 });

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : current.title;
  const videoId =
    typeof body.kinescopeVideoId === "string" && body.kinescopeVideoId.trim()
      ? body.kinescopeVideoId.trim()
      : current.kinescope_video_id;

  const duration =
    typeof body.durationSeconds === "number" && Number.isFinite(body.durationSeconds)
      ? Math.max(1, Math.floor(body.durationSeconds))
      : current.duration_seconds;

  const requiredWatch =
    typeof body.requiredWatchPercent === "number" && Number.isFinite(body.requiredWatchPercent)
      ? Math.min(100, Math.max(0, body.requiredWatchPercent))
      : Number(current.required_watch_percent);

  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? Math.floor(body.sortOrder)
      : current.sort_order;

  const { data: updated, error: updateError } = await admin
    .from("lessons")
    .update({
      title,
      description: body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description.trim() || null
          : current.description,
      kinescope_video_id: videoId,
      duration_seconds: duration,
      required_watch_percent: requiredWatch,
      sort_order: sortOrder,
      published: typeof body.published === "boolean" ? body.published : current.published,
      starts_at:
        body.startsAt === null || body.startsAt === ""
          ? null
          : typeof body.startsAt === "string"
            ? body.startsAt
            : current.starts_at,
    })
    .eq("id", id)
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,published,starts_at,updated_at")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Сабақты жаңарту сәтсіз аяқталды." }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "LESSON_UPDATED",
    entity_type: "LESSON",
    entity_id: id,
    metadata: {
      changes: {
        title: [current.title, updated.title],
        published: [current.published, updated.published],
        required_watch_percent: [current.required_watch_percent, updated.required_watch_percent],
        sort_order: [current.sort_order, updated.sort_order],
      },
    },
  });

  return NextResponse.json({ lesson: updated });
}
