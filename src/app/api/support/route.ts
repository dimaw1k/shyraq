import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id,category,subject,message,status,staff_note,created_at,updated_at,resolved_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Support тарихын жүктеу сәтсіз аяқталды." }, { status: 400 });
  return NextResponse.json({ tickets: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rateLimit = await consumeRateLimit("student:support-ticket", user.id, 5, 60 * 60, 60 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Support өтініштері тым жиі жіберілді. Бір сағаттан кейін қайта көріңіз.");
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Өтініш деректері тым үлкен." : "Өтініш деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Өтініш деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;
  const category = typeof body.category === "string" ? body.category.trim().slice(0, 40) : "OTHER";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!subject || !message) return NextResponse.json({ error: "Тақырып пен хабарлама міндетті." }, { status: 400 });
  if (subject.length > 160 || message.length > 5000) {
    return NextResponse.json({ error: "Тақырып 160, хабарлама 5000 таңбадан аспауы керек." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      student_id: user.id,
      category,
      subject,
      message,
    })
    .select("id,category,subject,message,status,created_at")
    .single();

  if (error) return NextResponse.json({ error: "Support өтінішін жіберу сәтсіз аяқталды." }, { status: 400 });
  return NextResponse.json({ ticket: data });
}
