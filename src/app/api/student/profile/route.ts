import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("id,full_name,email,phone,age,education_type,education_place,status,role,created_at").eq("id", user.id).single();
  if (error) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (typeof body?.fullName === "string") updates.full_name = body.fullName.trim();
  if (typeof body?.phone === "string") updates.phone = normalizePhone(body.phone);
  if (typeof body?.age === "number") updates.age = body.age;
  if (typeof body?.educationType === "string") updates.education_type = body.educationType;
  if (typeof body?.educationPlace === "string") updates.education_place = body.educationPlace.trim();

  if (!Object.keys(updates).length) return NextResponse.json({ error: "No supported fields" }, { status: 400 });

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select("id,full_name,email,phone,age,education_type,education_place,status,role").single();
  if (error) return NextResponse.json({ error: "Profile update failed" }, { status: 400 });
  return NextResponse.json({ profile: data });
}
