import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

function withAvatarUrl<T extends Record<string, unknown>>(profile: T) {
  const avatarPath = typeof profile.avatar_path === "string" ? profile.avatar_path : null;
  if (!avatarPath) return { ...profile, avatar_url: null };
  const admin = createAdminSupabaseClient();
  const { data } = admin.storage.from("avatars").getPublicUrl(avatarPath);
  return { ...profile, avatar_url: data.publicUrl };
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,age,education_type,education_place,status,role,avatar_path,created_at")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ profile: withAvatarUrl(data) });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (typeof body?.fullName === "string") updates.full_name = body.fullName.trim();
  if (typeof body?.phone === "string") updates.phone = normalizePhone(body.phone);
  if (typeof body?.age === "number" && Number.isFinite(body.age)) updates.age = body.age;
  if (typeof body?.educationType === "string") updates.education_type = body.educationType;
  if (typeof body?.educationPlace === "string") updates.education_place = body.educationPlace.trim();

  if (!Object.keys(updates).length) return NextResponse.json({ error: "No supported fields" }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id,full_name,email,phone,age,education_type,education_place,status,role,avatar_path")
    .single();

  if (error) return NextResponse.json({ error: "Profile update failed" }, { status: 400 });
  return NextResponse.json({ profile: withAvatarUrl(data) });
}
