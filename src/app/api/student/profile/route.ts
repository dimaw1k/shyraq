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

  // The age column was intentionally removed from profiles. Do not query it here:
  // PostgREST rejects the whole select when any requested column is missing.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,status,role,avatar_path,created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[student/profile] GET failed", { code: error.code });
    return NextResponse.json({ error: "Profile not found" }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.role !== "STUDENT") return NextResponse.json({ error: "Student access required" }, { status: 403 });
  if (profile.status === "INACTIVE") return NextResponse.json({ error: "Бұл аккаунт белсенді емес." }, { status: 403 });

  return NextResponse.json({ profile: await withProfileContext(supabase, profile, user.id) });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[student/profile] authorization lookup failed", { code: profileError.code });
    return NextResponse.json({ error: "Профильді тексеру мүмкін болмады." }, { status: 500 });
  }
  if (!currentProfile || currentProfile.role !== "STUDENT") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }
  if (currentProfile.status === "INACTIVE") {
    return NextResponse.json({ error: "Бұл аккаунт белсенді емес." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Деректер дұрыс емес." }, { status: 400 });
  }

  // Only editable, non-privileged columns are allow-listed. Profile role/status
  // writes are intentionally revoked from authenticated clients by migration.
  const updates: Record<string, unknown> = {};

  if (typeof body.fullName === "string") {
    const fullName = body.fullName.trim();
    if (fullName.length < 2 || fullName.length > 120) {
      return NextResponse.json({ error: "Аты-жөніңіз дұрыс емес." }, { status: 400 });
    }
    updates.full_name = fullName;
  }

  if (typeof body.phone === "string") {
    const phone = normalizePhone(body.phone);
    if (!/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Қазақстан телефон нөмірін дұрыс енгізіңіз." }, { status: 400 });
    }
    updates.phone = phone;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Өзгертілетін дерек жіберілмеді." }, { status: 400 });
  }

  // This write must go through the trusted server client because the latest
  // profile hardening migration removed direct UPDATE rights for authenticated.
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id,full_name,email,phone,status,role,avatar_path")
    .maybeSingle();

  if (error) {
    console.error("[student/profile] update failed", { code: error.code });
    if (error.code === "23505") {
      return NextResponse.json({ error: "Бұл телефон нөмірі бұрын тіркелген." }, { status: 409 });
    }
    return NextResponse.json({ error: "Профильді жаңарту сәтсіз аяқталды." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });

  return NextResponse.json({ profile: await withProfileContext(supabase, data, user.id) });
}
