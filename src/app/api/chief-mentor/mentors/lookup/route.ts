import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { isValidKzPhone, normalizePhone } from "@/lib/phone";

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
  const looksLikeEmail = identifier.includes("@");

  if (!looksLikeEmail && !isValidKzPhone(identifier)) {
    return NextResponse.json(
      { error: "Телефон нөмірін немесе email-ды дұрыс енгізіңіз." },
      { status: 400 },
    );
  }

  const { data, error } = looksLikeEmail
    ? await admin
        .from("profiles")
        .select("id,full_name,email,phone,status,role,avatar_path")
        .eq("email", identifier.toLowerCase())
        .maybeSingle()
    : await admin
        .from("profiles")
        .select("id,full_name,email,phone,status,role,avatar_path")
        .eq("phone", normalizePhone(identifier))
        .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Пайдаланушыны іздеу кезінде қате болды." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ profile: null, registered: false });
  }

  let team_name: string | null = null;
  const { data: managedTeams } = await admin
    .from("teams")
    .select("name")
    .eq("mentor_id", data.id)
    .eq("status", "ACTIVE")
    .order("name");

  team_name = (managedTeams ?? []).map((team) => team.name).join(", ") || null;

  const avatar_url = data.avatar_path
    ? admin.storage.from("avatars").getPublicUrl(data.avatar_path).data.publicUrl
    : null;

  return NextResponse.json({
    registered: true,
    profile: { ...data, avatar_url, team_name },
  });
}
