import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { consumeRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const MAX_ANSWER_LENGTH = 20000;
const MAX_LINK_LENGTH = 2048;

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = await consumeRateLimit(
      "task-submission:write",
      user.id,
      30,
      10 * 60,
      10 * 60,
    );
    if (!limited.allowed) {
      return rateLimitResponse(
        limited.retryAfterSeconds,
        "Тапсырма жіберу әрекеттері тым жиі орындалды. Біраз уақыттан кейін қайта көріңіз.",
      );
    }

    const { taskId } = await context.params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Жауап форматы дұрыс емес." }, { status: 400 });
    }

    const textAnswer =
      typeof body.textAnswer === "string" ? body.textAnswer.trim() : null;
    const linkUrl =
      typeof body.linkUrl === "string" ? body.linkUrl.trim() : null;

    if ((textAnswer?.length ?? 0) > MAX_ANSWER_LENGTH) {
      return NextResponse.json({ error: "Жауап 20 000 таңбадан аспауы керек." }, { status: 400 });
    }
    if ((linkUrl?.length ?? 0) > MAX_LINK_LENGTH) {
      return NextResponse.json({ error: "Сілтеме тым ұзын." }, { status: 400 });
    }

    if (linkUrl) {
      try {
        const url = new URL(linkUrl);
        if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
          throw new Error("bad URL");
        }
      } catch {
        return NextResponse.json(
          { error: "Сілтеме дұрыс емес. http:// немесе https:// қолдан." },
          { status: 400 },
        );
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Профильді тексеру мүмкін болмады." }, { status: 503 });
    }
    if (profile?.role !== "STUDENT") {
      return NextResponse.json({ error: "Тапсырманы тек оқушы жібере алады." }, { status: 403 });
    }

    const finalize = body.finalize !== false;
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id,team_id,active,starts_at,deadline,points,attachment_required,max_files")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError) {
      return NextResponse.json({ error: "Тапсырманы жүктеу мүмкін болмады." }, { status: 503 });
    }
    if (!task?.active) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const now = Date.now();
    if (task.starts_at && new Date(task.starts_at).getTime() > now) {
      return NextResponse.json({ error: "Task has not started yet" }, { status: 409 });
    }

    if (task.team_id !== null) {
      const { data: membership, error: membershipError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("student_id", user.id)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (membershipError) {
        return NextResponse.json({ error: "Топ мүшелігін тексеру мүмкін болмады." }, { status: 503 });
      }
      if (task.team_id !== membership?.team_id) {
        return NextResponse.json({ error: "Task is not assigned to your team" }, { status: 403 });
      }
    }

    const { data: existing, error: existingError } = await supabase
      .from("task_submissions")
      .select("id,status")
      .eq("task_id", taskId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Жауап күйін тексеру мүмкін болмады." }, { status: 503 });
    }
    if (existing?.status === "REVIEWED") {
      return NextResponse.json({ error: "Тексерілген тапсырманы өзгертуге болмайды." }, { status: 409 });
    }
    if (existing?.status === "SUBMITTED") {
      return NextResponse.json({ error: "Тапсырма тексеруде. Қайта ашуды ментор жасайды." }, { status: 409 });
    }

    let existingFileCount = 0;
    if (existing?.id) {
      const { count, error: fileCountError } = await supabase
        .from("submission_files")
        .select("id", { count: "exact", head: true })
        .eq("submission_id", existing.id);

      if (fileCountError) {
        return NextResponse.json({ error: "Тіркелген файлдарды тексеру мүмкін болмады." }, { status: 503 });
      }
      existingFileCount = count ?? 0;
    }

    if (finalize && task.attachment_required && existingFileCount === 0) {
      return NextResponse.json({ error: "Файл міндетті." }, { status: 409 });
    }

    const late = Boolean(task.deadline && new Date(task.deadline).getTime() < now);
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("task_submissions")
      .upsert(
        {
          task_id: taskId,
          student_id: user.id,
          status: finalize ? "SUBMITTED" : "DRAFT",
          text_answer: textAnswer,
          link_url: linkUrl || null,
          submitted_at: finalize ? new Date().toISOString() : null,
          submitted_late: finalize ? late : false,
        },
        { onConflict: "task_id,student_id" },
      )
      .select(
        "id,task_id,student_id,status,text_answer,link_url,submitted_at,submitted_late,review_comment,resubmission_deadline",
      )
      .single();

    if (error) {
      console.error("[task-submission] save failed", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { error: "Жауапты сақтау мүмкін болмады. Бірнеше секундтан кейін қайталаңыз." },
        { status: 503, headers: { "Retry-After": "5", "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ submission: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[task-submission] unexpected failure", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Тапсырманы жіберу кезінде қате болды." }, { status: 500 });
  }
}
