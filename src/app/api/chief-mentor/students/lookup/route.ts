import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { displayKzPhone, normalizePhone } from "@/lib/phone";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");

  const rateLimit = await consumeRateLimit("chief-mentor:student-lookup", profile.id, 30, 10 * 60, 10 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Оқушыны іздеу тым жиі орындалды. Кейінірек қайта көріңіз.");
  }

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
  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  if (identifier.length > 180) {
    return NextResponse.json({ error: "Телефон немесе email тым ұзын." }, { status: 400 });
  }

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
