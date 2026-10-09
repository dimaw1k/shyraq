import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getMentorContext(studentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { supabase, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "MENTOR" || profile.status !== "ACTIVE") {
    return { supabase, error: NextResponse.json({ error: "Mentor access required" }, { status: 403 }) };
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("mentor_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!team) return { supabase, error: NextResponse.json({ error: "Team not found" }, { status: 404 }) };

  const { data: member } = await supabase
    .from("team_members")
    .select("student_id")
    .eq("team_id", team.id)
    .eq("student_id", studentId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!member) {
    return { supabase, error: NextResponse.json({ error: "Оқушы сіздің командаңызда емес." }, { status: 403 }) };
  }

  return { supabase, mentorId: user.id, teamId: team.id };
}

export async function GET(request: Request) {
  const studentId = new URL(request.url).searchParams.get("studentId")?.trim() ?? "";
  if (!UUID_RE.test(studentId)) return NextResponse.json({ error: "studentId дұрыс емес." }, { status: 400 });

  const context = await getMentorContext(studentId);
  if ("error" in context) return context.error;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("mentor_student_messages")
    .select("id,body,sender_id,created_at,read_at")
    .eq("mentor_id", context.mentorId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: "Чатты жүктеу сәтсіз аяқталды." }, { status: 500 });

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Хабарлама тым үлкен." : "Хабарлама деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Хабарлама деректері дұрыс емес." }, { status: 400 });
  }

  const body = parsedBody.value as Record<string, unknown>;
  const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!UUID_RE.test(studentId) || !messageBody || messageBody.length > 4000) {
    return NextResponse.json({ error: "Дұрыс оқушы ID және 1–4000 таңбалы хабарлама қажет." }, { status: 400 });
  }

  const context = await getMentorContext(studentId);
  if ("error" in context) return context.error;

  const limited = await consumeRateLimit("mentor-chat:send", context.mentorId, 30, 10 * 60, 10 * 60);
  if (!limited.available) return rateLimitUnavailableResponse();
  if (!limited.allowed) return rateLimitResponse(limited.retryAfterSeconds, "Хабарламалар тым жиі жіберілді. Кейінірек көріңіз.");

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("mentor_student_messages")
    .insert({
      mentor_id: context.mentorId,
      student_id: studentId,
      sender_id: context.mentorId,
      body: messageBody,
    })
    .select("id,body,sender_id,created_at,read_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Хабарлама жіберу сәтсіз аяқталды." }, { status: 500 });

  return NextResponse.json({ message: data });
}
