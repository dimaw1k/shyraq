import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { data, error } = await supabase.from("score_rules").select("id,code,label,weight,active,updated_at").order("code");
  if (error) return NextResponse.json({ error: "Unable to load score rules" }, { status: 400 });

  return NextResponse.json({ rules: data ?? [] });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_by: user.id };
  if (typeof body.weight === "number" && Number.isFinite(body.weight)) updates.weight = body.weight;
  if (typeof body.active === "boolean") updates.active = body.active;
  if (Object.keys(updates).length === 1) return NextResponse.json({ error: "No supported fields" }, { status: 400 });

  const { data, error } = await supabase.from("score_rules").update(updates).eq("code", code).select("id,code,label,weight,active,updated_at").single();
  if (error) return NextResponse.json({ error: "Score rule update failed" }, { status: 400 });

  return NextResponse.json({ rule: data });
}
