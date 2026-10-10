import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { displayKzPhone, isValidKzPhone, normalizePhone } from "@/lib/phone";
import { readLimitedJson } from "@/lib/http/read-limited-json";

export async function POST(request: Request) {
  await getAuthenticatedStaff("CHIEF_MENTOR");

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Іздеу деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Іздеу деректері дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;
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
    profile: { ...data, phone: displayKzPhone(data.phone), avatar_url, team_name },
  });
}
