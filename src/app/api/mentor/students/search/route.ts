import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "MENTOR" && me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Mentor access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? normalizePhone(body.phone) : "";
  if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

  const { data, error } = await supabase.rpc("mentor_find_student_by_phone", { target_phone: phone });
  if (error) return NextResponse.json({ error: "Student lookup failed" }, { status: 400 });

  const student = Array.isArray(data) ? data[0] ?? null : data;
  return NextResponse.json({ student });
}
