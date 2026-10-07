import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

async function withProfileContext<T extends Record<string, unknown>>(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  profile: T,
  userId: string,
) {
  const admin = createAdminSupabaseClient();
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id,teams(name,mentor_id)")
    .eq("student_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const team = Array.isArray(membership?.teams) ? membership?.teams[0] : membership?.teams;
  let mentorName: string | null = null;

  if (team?.mentor_id) {
    const { data: mentor } = await admin.from("profiles").select("full_name").eq("id", team.mentor_id).maybeSingle();
    mentorName = mentor?.full_name ?? null;
  }

  const avatarPath = typeof profile.avatar_path === "string" ? profile.avatar_path : null;
  const avatarUrl = avatarPath ? admin.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl : null;

  return { ...profile, avatar_url: avatarUrl, team_name: team?.name ?? null, mentor_name: mentorName };
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,age,status,role,avatar_path,created_at")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({ profile: await withProfileContext(supabase, profile, user.id) });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};

  if (typeof body?.fullName === "string") {
    const fullName = body.fullName.trim();
    if (fullName.length < 2 || fullName.length > 120) {
      return NextResponse.json({ error: "Аты-жөніңіз дұрыс емес." }, { status: 400 });
    }
    updates.full_name = fullName;
  }

  if (typeof body?.phone === "string") {
    const phone = normalizePhone(body.phone);
    if (!/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Қазақстан телефон нөмірі дұрыс емес." }, { status: 400 });
    }
    updates.phone = phone;
  }

  if (typeof body?.age === "number" && Number.isFinite(body.age)) {
    if (!Number.isInteger(body.age) || body.age < 10 || body.age > 100) {
      return NextResponse.json({ error: "Жас 10–100 аралығында болуы керек." }, { status: 400 });
    }
    updates.age = body.age;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No supported fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id,full_name,email,phone,age,status,role,avatar_path")
    .single();

  if (error) return NextResponse.json({ error: "Profile update failed" }, { status: 400 });

  return NextResponse.json({ profile: await withProfileContext(supabase, data, user.id) });
}
