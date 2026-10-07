import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getPasswordValidationError } from "@/lib/security/password";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "Қалпына келтіру сессиясы жарамсыз немесе мерзімі өткен." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const password =
      typeof body?.password === "string" ? body.password : "";

    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createClient(url, publishableKey, {
      global: {
        headers: {
          Authorization: "Bearer " + token,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Қалпына келтіру сессиясы жарамсыз немесе мерзімі өткен." },
        { status: 401 },
      );
    }

    const passwordError = getPasswordValidationError(password, [
      userData.user.email ?? "",
    ]);

    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error("[auth/reset-password] password update failed", {
        status: updateError.status,
        message: updateError.message,
      });

      return NextResponse.json(
        { error: "Құпиясөзді жаңарту мүмкін болмады." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Құпиясөзді жаңарту кезінде қате болды." },
      { status: 500 },
    );
  }
}
