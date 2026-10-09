import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
  rateLimitUnavailableResponse,
} from "@/lib/security/rate-limit";

type LoginPayload = {
  identifier?: unknown;
  password?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function looksLikePhone(value: string) {
  return /^[+\d\s()\-]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginPayload;
    const rawIdentifier = text(body.identifier);
    const password = typeof body.password === "string" ? body.password : "";

    if (!rawIdentifier || password.length < 1) {
      return NextResponse.json(
        { error: "Email немесе телефон нөмірі мен құпиясөзді енгізіңіз." },
        { status: 400 },
      );
    }

    const clientIp = getClientIp(request);
    const normalizedIdentifierKey = looksLikePhone(rawIdentifier)
      ? normalizePhone(rawIdentifier) ?? rawIdentifier.replace(/[\s()-]/g, "").toLowerCase()
      : rawIdentifier.toLowerCase();

    const [ipBurst, identifierBurst] = await Promise.all([
      consumeRateLimit("auth:login:ip", clientIp, 12, 10 * 60, 10 * 60),
      consumeRateLimit(
        "auth:login:identifier",
        normalizedIdentifierKey,
        8,
        15 * 60,
        15 * 60,
      ),
    ]);

    const limitResults = [ipBurst, identifierBurst];
    if (limitResults.some((result) => !result.available)) {
      return rateLimitUnavailableResponse();
    }

    const blocked = limitResults.find((result) => !result.allowed);
    if (blocked) {
      return rateLimitResponse(
        blocked.retryAfterSeconds,
        "Кіру әрекеттері тым жиі орындалды. Біраз уақыттан кейін қайта көріңіз.",
      );
    }

    let email = rawIdentifier.toLowerCase();

    if (looksLikePhone(rawIdentifier)) {
      const phone = normalizePhone(rawIdentifier);

      if (!phone || !/^\+7\d{10}$/.test(phone)) {
        return NextResponse.json(
          { error: "Email немесе телефон нөмірін дұрыс енгізіңіз." },
          { status: 400 },
        );
      }

      const admin = createAdminSupabaseClient();
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("email")
        .eq("phone", phone)
        .maybeSingle();

      if (profileError) {
        console.error("[auth/login] profiles phone lookup failed", {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });
      }

      if (profileError || !profile?.email) {
        return NextResponse.json(
          { error: "Көрсетілген деректер бойынша тіркелгі табылмады немесе құпиясөз қате." },
          { status: 401 },
        );
      }

      email = profile.email.toLowerCase();
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[auth/login] signInWithPassword failed", {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      return NextResponse.json(
        { error: "Көрсетілген деректер бойынша тіркелгі табылмады немесе құпиясөз қате." },
        { status: 401 },
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: accountProfile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .maybeSingle();

      if (accountProfile?.status === "INACTIVE") {
        await supabase.auth.signOut({ scope: "local" });
        return NextResponse.json(
          { error: "Бұл аккаунт белсенді емес. Әкімшіге хабарласыңыз." },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Кіру кезінде қате болды. Қайта көріңіз." },
      { status: 400 },
    );
  }
}
