import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";

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

function parseIso(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

export async function POST(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const body = await request.json().catch(() => null);

  if (typeof body?.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Сабақ атауы қажет." }, { status: 400 });
  }

  const kinescopeVideoId = getKinescopeId(typeof body?.kinescopeVideo === "string" ? body.kinescopeVideo : "");
  if (!kinescopeVideoId) {
    return NextResponse.json({ error: "Kinescope бейнесінің сілтемесін енгізіңіз." }, { status: 400 });
  }

  const duration = typeof body?.durationSeconds === "number" ? Math.floor(body.durationSeconds) : 0;
  if (duration <= 0) {
    return NextResponse.json({ error: "Видео ұзақтығын енгізіңіз." }, { status: 400 });
  }

  const teamId = body?.teamId === null || body?.teamId === "" || body?.teamId === undefined ? null : String(body.teamId);
  if (teamId) {
    const { data: team } = await supabase.from("teams").select("id").eq("id", teamId).maybeSingle();
    if (!team) return NextResponse.json({ error: "Команда табылмады." }, { status: 400 });
  }

  const marathonDay = body?.marathonDay === null || body?.marathonDay === "" || body?.marathonDay === undefined ? null : Number(body.marathonDay);
  if (marathonDay !== null && (!Number.isInteger(marathonDay) || marathonDay < 1 || marathonDay > 21)) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығында болуы керек." }, { status: 400 });
  }

  const materials = Array.isArray(body?.materials)
    ? body.materials
        .filter((item: unknown) => item && typeof item === "object" && typeof (item as { label?: unknown }).label === "string" && typeof (item as { url?: unknown }).url === "string")
        .slice(0, 20)
        .map((item: { label: string; url: string; type?: string }) => ({
          label: item.label.trim().slice(0, 120),
          url: item.url.trim().slice(0, 500),
          type: typeof item.type === "string" ? item.type.slice(0, 30) : "LINK",
        }))
    : [];

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      kinescope_video_id: kinescopeVideoId,
      duration_seconds: duration,
      required_watch_percent: typeof body.requiredWatchPercent === "number" ? Math.min(100, Math.max(0, body.requiredWatchPercent)) : 85,
      marathon_day: marathonDay,
      team_id: teamId,
      lesson_order: typeof body.lessonOrder === "number" ? Math.floor(body.lessonOrder) : 0,
      sort_order: typeof body.sortOrder === "number" ? Math.floor(body.sortOrder) : 0,
      published: Boolean(body.published),
      materials,
      starts_at: parseIso(body.startsAt),
      deadline_at: parseIso(body.deadlineAt),
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Сабақты сақтау сәтсіз аяқталды." }, { status: 400 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "LESSON_CREATED",
    entity_type: "LESSON",
    entity_id: data.id,
    metadata: { title: data.title, marathon_day: data.marathon_day, starts_at: data.starts_at, deadline_at: data.deadline_at },
  });

  return NextResponse.json({ lesson: data });
}
