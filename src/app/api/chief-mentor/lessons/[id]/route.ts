import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const rateLimit = await consumeRateLimit("chief-mentor:lesson-update", profile.id, 30, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Сабақ өзгерістері тым жиі жіберілді.");
  }
  const { id } = await params;
  const parsedBody = await readLimitedJson(request, 64 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сабақ деректері тым үлкен." : "Сабақ деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Сабақ деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;
  const admin = createAdminSupabaseClient();

  const { data: current, error: currentError } = await admin
    .from("lessons")
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,team_id,published,starts_at,deadline_at,materials")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "Сабақты жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Сабақ табылмады." }, { status: 404 });

  function getKinescopeId(value: string) {
    const raw = value.trim();
    if (!raw || raw.length > 128) return "";
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" || !(url.hostname === "kinescope.io" || url.hostname.endsWith(".kinescope.io"))) return "";
      const id = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
      return /^[a-zA-Z0-9_-]{1,128}$/.test(id) ? id : "";
    } catch {
      return /^[a-zA-Z0-9_-]{1,128}$/.test(raw) ? raw : "";
    }
  }

  function isSafeMaterialUrl(value: string) {
    const raw = value.trim();
    if (!raw || raw.length > 500 || /[\\\u0000-\u001f\u007f]/.test(raw)) return false;
    if (raw.startsWith("/") && !raw.startsWith("//")) return true;
    try {
      const url = new URL(raw);
      return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
    } catch {
      return false;
    }
  }

  if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 120)) {
    return NextResponse.json({ error: "Сабақ атауы 1–120 таңба болуы керек." }, { status: 400 });
  }
  if (body.description !== undefined && body.description !== null && (typeof body.description !== "string" || body.description.length > 5000)) {
    return NextResponse.json({ error: "Сабақ сипаттамасы 5000 таңбадан аспауы керек." }, { status: 400 });
  }
  if (body.requiredWatchPercent !== undefined && (
    typeof body.requiredWatchPercent !== "number" ||
    !Number.isFinite(body.requiredWatchPercent) ||
    body.requiredWatchPercent < 1 ||
    body.requiredWatchPercent > 100
  )) {
    return NextResponse.json({ error: "Видео көру пайызы 1–100 аралығында болуы керек." }, { status: 400 });
  }
  if (body.published !== undefined && typeof body.published !== "boolean") {
    return NextResponse.json({ error: "Сабақтың жариялану күйі дұрыс емес." }, { status: 400 });
  }
  if (body.sortOrder !== undefined && (typeof body.sortOrder !== "number" || !Number.isInteger(body.sortOrder) || body.sortOrder < 0 || body.sortOrder > 10000)) {
    return NextResponse.json({ error: "sortOrder 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  if (body.lessonOrder !== undefined && (typeof body.lessonOrder !== "number" || !Number.isInteger(body.lessonOrder) || body.lessonOrder < 0 || body.lessonOrder > 10000)) {
    return NextResponse.json({ error: "lessonOrder 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  if (Array.isArray(body.materials) && body.materials.some((item) =>
    !item || typeof item !== "object" || Array.isArray(item) ||
    typeof (item as { label?: unknown }).label !== "string" ||
    typeof (item as { url?: unknown }).url !== "string" ||
    !isSafeMaterialUrl((item as { url: string }).url)
  )) {
    return NextResponse.json({ error: "Материал сілтемесі HTTP/HTTPS немесе ішкі жол болуы керек." }, { status: 400 });
  }
  for (const field of ["startsAt", "deadlineAt"] as const) {
    const value = body[field];
    if (value !== undefined && value !== null && value !== "" && (typeof value !== "string" || !Number.isFinite(Date.parse(value)))) {
      return NextResponse.json({ error: "Сабақ уақыты дұрыс емес." }, { status: 400 });
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

  const nextTeamId =
    body?.teamId === null || body?.teamId === ""
      ? null
      : typeof body?.teamId === "string"
        ? body.teamId
        : current.team_id;

  if (nextTeamId) {
    const { data: team } = await admin.from("teams").select("id").eq("id", nextTeamId).maybeSingle();
    if (!team) return NextResponse.json({ error: "Команда табылмады." }, { status: 400 });
  }

  const nextDay = body?.marathonDay === null || body?.marathonDay === "" ? null : typeof body?.marathonDay === "number" ? Math.floor(body.marathonDay) : current.marathon_day;
  if (nextDay !== null && (nextDay < 1 || nextDay > 21)) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығында болуы керек." }, { status: 400 });
  }

  const nextVideo = typeof body.kinescopeVideo === "string" ? getKinescopeId(body.kinescopeVideo) : current.kinescope_video_id;
  if (typeof body.kinescopeVideo === "string" && !nextVideo) {
    return NextResponse.json({ error: "Kinescope бейне сілтемесі дұрыс емес." }, { status: 400 });
  }

  const updatedData = {
    title: typeof body?.title === "string" && body.title.trim() ? body.title.trim() : current.title,
    description: body?.description === null ? null : typeof body?.description === "string" ? body.description.trim() || null : current.description,
    kinescope_video_id: nextVideo || current.kinescope_video_id,
    duration_seconds: typeof body?.durationSeconds === "number" && Number.isFinite(body.durationSeconds) ? Math.max(1, Math.floor(body.durationSeconds)) : current.duration_seconds,
    required_watch_percent: typeof body.requiredWatchPercent === "number" ? body.requiredWatchPercent : Math.min(100, Math.max(1, Number(current.required_watch_percent) || 85)),
    sort_order: typeof body?.sortOrder === "number" ? Math.floor(body.sortOrder) : current.sort_order,
    lesson_order: typeof body?.lessonOrder === "number" ? Math.floor(body.lessonOrder) : current.lesson_order,
    marathon_day: nextDay,
    team_id: nextTeamId,
    materials: nextMaterials,
    published: typeof body?.published === "boolean" ? body.published : current.published,
    starts_at: body?.startsAt === null || body?.startsAt === "" ? null : typeof body?.startsAt === "string" ? body.startsAt : current.starts_at,
    deadline_at: body?.deadlineAt === null || body?.deadlineAt === "" ? null : typeof body?.deadlineAt === "string" ? body.deadlineAt : current.deadline_at,
  };

  const { data: updated, error: updateError } = await admin
    .from("lessons")
    .update(updatedData)
    .eq("id", id)
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,sort_order,lesson_order,marathon_day,team_id,published,starts_at,deadline_at,materials,updated_at")
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
