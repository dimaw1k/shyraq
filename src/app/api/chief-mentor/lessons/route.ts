import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

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

function parseIso(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

export async function POST(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const rateLimit = await consumeRateLimit("chief-mentor:lesson-create", profile.id, 20, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Сабақ құру әрекеттері тым жиі орындалды.");
  }
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

  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 120) {
    return NextResponse.json({ error: "Сабақ атауы 1–120 таңба болуы керек." }, { status: 400 });
  }
  if (body.description !== undefined && body.description !== null && (typeof body.description !== "string" || body.description.length > 5000)) {
    return NextResponse.json({ error: "Сабақ сипаттамасы 5000 таңбадан аспауы керек." }, { status: 400 });
  }

  const kinescopeVideoId = getKinescopeId(typeof body.kinescopeVideo === "string" ? body.kinescopeVideo : "");
  if (!kinescopeVideoId) {
    return NextResponse.json({ error: "Kinescope бейнесінің сілтемесін енгізіңіз." }, { status: 400 });
  }

  const duration = typeof body.durationSeconds === "number" && Number.isFinite(body.durationSeconds) && Number.isInteger(body.durationSeconds) ? body.durationSeconds : 0;
  if (duration <= 0 || duration > 86400) {
    return NextResponse.json({ error: "Видео ұзақтығы 1–86400 секунд болуы керек." }, { status: 400 });
  }

  if (body.requiredWatchPercent !== undefined && (
    typeof body.requiredWatchPercent !== "number" ||
    !Number.isInteger(body.requiredWatchPercent) ||
    body.requiredWatchPercent < 1 ||
    body.requiredWatchPercent > 100
  )) {
    return NextResponse.json({ error: "Видео көру пайызы 1–100 аралығында болуы керек." }, { status: 400 });
  }
  if (body.published !== undefined && typeof body.published !== "boolean") {
    return NextResponse.json({ error: "Сабақтың жариялану күйі дұрыс емес." }, { status: 400 });
  }
  if (body.lessonOrder !== undefined && (typeof body.lessonOrder !== "number" || !Number.isInteger(body.lessonOrder) || body.lessonOrder < 0 || body.lessonOrder > 10000)) {
    return NextResponse.json({ error: "lessonOrder 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  if (body.sortOrder !== undefined && (typeof body.sortOrder !== "number" || !Number.isInteger(body.sortOrder) || body.sortOrder < 0 || body.sortOrder > 10000)) {
    return NextResponse.json({ error: "sortOrder 0–10000 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  for (const field of ["startsAt", "deadlineAt"] as const) {
    const value = body[field];
    if (value !== undefined && value !== null && value !== "" && (typeof value !== "string" || !Number.isFinite(Date.parse(value)))) {
      return NextResponse.json({ error: "Сабақ уақыты дұрыс емес." }, { status: 400 });
    }
  }

  const teamId = body.teamId === null || body.teamId === "" || body.teamId === undefined
    ? null
    : typeof body.teamId === "string" && body.teamId.length <= 100
      ? body.teamId
      : "__INVALID_TEAM_ID__";
  if (teamId === "__INVALID_TEAM_ID__") return NextResponse.json({ error: "Команда идентификаторы дұрыс емес." }, { status: 400 });
  if (teamId) {
    const { data: team } = await supabase.from("teams").select("id").eq("id", teamId).maybeSingle();
    if (!team) return NextResponse.json({ error: "Команда табылмады." }, { status: 400 });
  }

  const marathonDay = body.marathonDay === null || body.marathonDay === "" || body.marathonDay === undefined
    ? null
    : typeof body.marathonDay === "number"
      ? body.marathonDay
      : NaN;
  if (marathonDay !== null && (!Number.isInteger(marathonDay) || marathonDay < 1 || marathonDay > 21)) {
    return NextResponse.json({ error: "Марафон күні 1–21 аралығында болуы керек." }, { status: 400 });
  }

  if (Array.isArray(body.materials) && body.materials.length > 20) {
    return NextResponse.json({ error: "Бір сабаққа ең көбі 20 материал қосуға болады." }, { status: 400 });
  }
  if (body.materials !== undefined && !Array.isArray(body.materials)) {
    return NextResponse.json({ error: "Материалдар тізімі дұрыс емес." }, { status: 400 });
  }
  const rawMaterials = Array.isArray(body.materials) ? body.materials : [];
  if (rawMaterials.some((item) =>
    !item || typeof item !== "object" || Array.isArray(item) ||
    typeof (item as { label?: unknown }).label !== "string" ||
    !(item as { label: string }).label.trim() ||
    (item as { label: string }).label.trim().length > 120 ||
    typeof (item as { url?: unknown }).url !== "string" ||
    !isSafeMaterialUrl((item as { url: string }).url) ||
    (item as { url: string }).url.trim().length > 500
  )) {
    return NextResponse.json({ error: "Материал атауы немесе сілтемесі дұрыс емес." }, { status: 400 });
  }
  const materials = rawMaterials.map((item) => ({
    label: (item as { label: string }).label.trim(),
    url: (item as { url: string }).url.trim(),
    type: typeof (item as { type?: unknown }).type === "string" ? (item as { type: string }).type.slice(0, 30) : "LINK",
  }));

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("lessons")
    .insert({
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      kinescope_video_id: kinescopeVideoId,
      duration_seconds: duration,
      required_watch_percent: typeof body.requiredWatchPercent === "number" ? body.requiredWatchPercent : 85,
      marathon_day: marathonDay,
      team_id: teamId,
      lesson_order: typeof body.lessonOrder === "number" ? body.lessonOrder : 0,
      sort_order: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      published: body.published === true,
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

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "LESSON_CREATED",
    entity_type: "LESSON",
    entity_id: data.id,
    metadata: { title: data.title, marathon_day: data.marathon_day, starts_at: data.starts_at, deadline_at: data.deadline_at },
  });

  return NextResponse.json({ lesson: data });
}
