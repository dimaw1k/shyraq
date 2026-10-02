import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();

  const { data: current, error: currentError } = await admin
    .from("lessons")
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,published,starts_at,deadline_at,materials")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "Сабақты жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Сабақ табылмады." }, { status: 404 });

  function getKinescopeId(value: string) {
    const raw = value.trim();
    if (!raw) return "";
    try {
      const url = new URL(raw);
      if (!url.hostname.includes("kinescope.io")) return raw;
      const parts = url.pathname.split("/").filter(Boolean);
      return parts.at(-1) ?? raw;
    } catch {
      return raw;
    }
  }

  const nextMaterials = Array.isArray(body?.materials)
    ? body.materials
        .filter((item: unknown) => item && typeof item === "object" && typeof (item as { label?: unknown }).label === "string" && typeof (item as { url?: unknown }).url === "string")
        .slice(0, 20)
        .map((item: { label: string; url: string; type?: string }) => ({
          label: item.label.trim().slice(0, 120),
          url: item.url.trim().slice(0, 500),
          type: typeof item.type === "string" ? item.type.slice(0, 30) : "LINK",
        }))
    : current.materials;

  const nextDay = body?.marathonDay === null || body?.marathonDay === "" ? null : typeof body?.marathonDay === "number" ? Math.floor(body.marathonDay) : current.marathon_day;
  if (nextDay !== null && (nextDay < 1 || nextDay > 21)) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығында болуы керек." }, { status: 400 });
  }

  const nextVideo = typeof body?.kinescopeVideo === "string" ? getKinescopeId(body.kinescopeVideo) : current.kinescope_video_id;

  const updatedData = {
    title: typeof body?.title === "string" && body.title.trim() ? body.title.trim() : current.title,
    description: body?.description === null ? null : typeof body?.description === "string" ? body.description.trim() || null : current.description,
    kinescope_video_id: nextVideo || current.kinescope_video_id,
    duration_seconds: typeof body?.durationSeconds === "number" && Number.isFinite(body.durationSeconds) ? Math.max(1, Math.floor(body.durationSeconds)) : current.duration_seconds,
    required_watch_percent: typeof body?.requiredWatchPercent === "number" && Number.isFinite(body.requiredWatchPercent) ? Math.min(100, Math.max(0, body.requiredWatchPercent)) : Number(current.required_watch_percent),
    sort_order: typeof body?.sortOrder === "number" ? Math.floor(body.sortOrder) : current.sort_order,
    lesson_order: typeof body?.lessonOrder === "number" ? Math.floor(body.lessonOrder) : current.lesson_order,
    marathon_day: nextDay,
    materials: nextMaterials,
    published: typeof body?.published === "boolean" ? body.published : current.published,
    starts_at: body?.startsAt === null || body?.startsAt === "" ? null : typeof body?.startsAt === "string" ? body.startsAt : current.starts_at,
    deadline_at: body?.deadlineAt === null || body?.deadlineAt === "" ? null : typeof body?.deadlineAt === "string" ? body.deadlineAt : current.deadline_at,
  };

  const { data: updated, error: updateError } = await admin
    .from("lessons")
    .update(updatedData)
    .eq("id", id)
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,published,starts_at,deadline_at,materials,updated_at")
    .single();

  if (updateError || !updated) return NextResponse.json({ error: "Сабақты жаңарту сәтсіз аяқталды." }, { status: 500 });

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "LESSON_UPDATED",
    entity_type: "LESSON",
    entity_id: id,
    metadata: {
      marathon_day: [current.marathon_day, updated.marathon_day],
      starts_at: [current.starts_at, updated.starts_at],
      deadline_at: [current.deadline_at, updated.deadline_at],
    },
  });

  return NextResponse.json({ lesson: updated });
}
