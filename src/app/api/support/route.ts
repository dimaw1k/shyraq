import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  const body = await request.json().catch(() => null);
  const category = typeof body?.category === "string" ? body.category.trim().slice(0, 40) : "OTHER";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!subject || !message) return NextResponse.json({ error: "Тақырып пен хабарлама міндетті." }, { status: 400 });

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      student_id: user.id,
      category,
      subject: subject.slice(0, 160),
      message: message.slice(0, 5000),
    })
    .select("id,category,subject,message,status,created_at")
    .single();

  if (error) return NextResponse.json({ error: "Support өтінішін жіберу сәтсіз аяқталды." }, { status: 400 });
  return NextResponse.json({ ticket: data });
}
