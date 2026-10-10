import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }
  const rateLimit = await consumeRateLimit("student:task-submission", user.id, 30, 10 * 60, 10 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Тапсырма жауаптары тым жиі жаңартылды. Біраздан кейін қайталап көріңіз.");
  }

  const { taskId } = await context.params;
  const parsedBody = await readLimitedJson(request, 64 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Жіберілетін жауап тым үлкен." : "Жауап деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Жауап деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;
  const textAnswer = typeof body.textAnswer === "string" ? body.textAnswer.trim() : null;
  const linkUrl = typeof body.linkUrl === "string" ? body.linkUrl.trim() : null;

  if (textAnswer !== null && textAnswer.length > 10000) {
    return NextResponse.json({ error: "Жауап 10000 таңбадан аспауы керек." }, { status: 400 });
  }
  if (linkUrl !== null && linkUrl.length > 2048) {
    return NextResponse.json({ error: "Сілтеме тым ұзын." }, { status: 400 });
  }

  if (linkUrl) {
    try {
      const url = new URL(linkUrl);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("bad protocol");
    } catch {
      return NextResponse.json({ error: "Сілтеме дұрыс емес. http:// немесе https:// қолдан." }, { status: 400 });
    }
  }

  if (body.finalize !== undefined && typeof body.finalize !== "boolean") {
    return NextResponse.json({ error: "Тапсыру күйі дұрыс емес." }, { status: 400 });
  }
  const finalize = body.finalize !== false;
  const { data: task } = await supabase.from("tasks").select(
    "id,team_id,active,starts_at,deadline,points,attachment_required,max_files",
  ).eq("id", taskId).maybeSingle();

  if (!task?.active) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const now = new Date().getTime();
  if (task.starts_at && new Date(task.starts_at).getTime() > now) {
    return NextResponse.json({ error: "Task has not started yet" }, { status: 409 });
  }

  const { data: membership } = await supabase.from("team_members")
    .select("team_id,status")
    .eq("student_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (task.team_id !== null && task.team_id !== membership?.team_id) {
    return NextResponse.json({ error: "Task is not assigned to your team" }, { status: 403 });
  }

  const { data: existing } = await supabase.from("task_submissions")
    .select("id,status")
    .eq("task_id", taskId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (existing?.status === "REVIEWED") {
    return NextResponse.json({ error: "Тексерілген тапсырманы өзгертуге болмайды." }, { status: 409 });
  }

  if (existing?.status === "SUBMITTED") {
    return NextResponse.json({ error: "Тапсырма тексеруде. Қайта ашуды ментор жасайды." }, { status: 409 });
  }

  let existingFileCount = 0;
  if (existing?.id) {
    const { count } = await supabase.from("submission_files")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", existing.id);
    existingFileCount = count ?? 0;
  }

  if (finalize && task.attachment_required && existingFileCount === 0) {
    return NextResponse.json({ error: "Файл міндетті." }, { status: 409 });
  }

  const late = Boolean(task.deadline && new Date(task.deadline).getTime() < now);
  const admin = createAdminSupabaseClient();
  const { data: savedSubmission, error } = await admin.rpc("save_task_submission", {
    p_task_id: taskId,
    p_student_id: user.id,
    p_text_answer: textAnswer,
    p_link_url: linkUrl || null,
    p_finalize: finalize,
  });

  if (error) {
    if (error.code === "42501") {
      return NextResponse.json({ error: "Бұл тапсырма сіздің аккаунтыңызға немесе командаңызға рұқсат етілмеген." }, { status: 403 });
    }
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Тапсырма табылмады немесе белсенді емес." }, { status: 404 });
    }
    if (error.code === "23514") {
      return NextResponse.json({ error: "Файл міндетті немесе файл лимиті толған." }, { status: 409 });
    }
    if (error.code === "55000") {
      return NextResponse.json({ error: "Тапсырма жіберілді, тексерілуде немесе қайта тапсыру мерзімі аяқталды." }, { status: 409 });
    }
    if (error.code === "22023") {
      return NextResponse.json({ error: "Жауап деректері дұрыс емес." }, { status: 400 });
    }
    console.error("[tasks/submissions] atomic save failed", { code: error.code });
    return NextResponse.json({ error: "Жауапты сақтау сәтсіз аяқталды." }, { status: 500 });
  }

  const submission = Array.isArray(savedSubmission) ? savedSubmission[0] : savedSubmission;
  if (!submission) {
    return NextResponse.json({ error: "Сақталған жауапты растау мүмкін болмады." }, { status: 500 });
  }

  return NextResponse.json({ submission }, { headers: { "Cache-Control": "no-store" } });
}
