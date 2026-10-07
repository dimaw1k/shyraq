import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { displayKzPhone, normalizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  await getAuthenticatedStaff("CHIEF_MENTOR");

  const body = await request.json().catch(() => null);
  const identifier =
    typeof body?.identifier === "string" ? body.identifier.trim() : "";

  if (!identifier) {
    return NextResponse.json(
      { error: "Телефон немесе email енгізіңіз." },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();
  const normalizedEmail = identifier.toLowerCase();
  const looksLikeEmail = normalizedEmail.includes("@");

  const { data, error } = looksLikeEmail
    ? await admin
        .from("profiles")
        .select("id,full_name,email,phone,status,role,avatar_path")
        .eq("email", normalizedEmail)
        .maybeSingle()
    : await admin
        .from("profiles")
        .select("id,full_name,email,phone,status,role,avatar_path")
        .eq("phone", normalizePhone(identifier))
        .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Аккаунтты іздеу кезінде қате болды." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ profile: null });
  }

  if (data.role !== "STUDENT") {
    return NextResponse.json({
      profile: null,
      error: "Бұл аккаунт оқушы ретінде тіркелмеген.",
    });
  }

  const { data: membership } = await admin
    .from("team_members")
    .select("team_id,teams(id,name)")
    .eq("student_id", data.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const team = Array.isArray(membership?.teams)
    ? membership?.teams[0]
    : membership?.teams;

  const avatar_url = data.avatar_path
    ? admin.storage.from("avatars").getPublicUrl(data.avatar_path).data.publicUrl
    : null;

  return NextResponse.json({
    registered: true,
    profile: {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: displayKzPhone(data.phone),
      status: data.status,
      role: data.role,
      avatar_url,
      team_id: team?.id ?? null,
      team_name: team?.name ?? null,
    },
  });
}
