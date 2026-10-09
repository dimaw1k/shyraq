import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isValidKzPhone, normalizePhone } from "@/lib/phone";
import { getPasswordValidationError } from "@/lib/security/password";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

type RegisterPayload = {
  phone?: unknown;
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  password?: unknown;
  website?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterPayload;

    const phone = text(body.phone);
    const email = text(body.email).toLowerCase();
    const firstName = text(body.firstName);
    const lastName = text(body.lastName);
    const password = typeof body.password === "string" ? body.password : "";
    const website = text(body.website);
    const clientIp = getClientIp(request);

    if (website) {
      return NextResponse.json(
        { field: "form", error: "Тіркелу кезінде қате болды. Қайта көріңіз." },
        { status: 400 },
      );
    }

    // Students often register through the same school Wi-Fi/NAT IP.
    // Cohort mode relaxes only the shared-IP quotas; per-email limits remain strict.
    const cohortMode =
      process.env.NODE_ENV === "production" &&
      process.env.REGISTRATION_COHORT_MODE === "true";

    const [ipBurst, ipHourly, emailBurst] = await Promise.all([
      consumeRateLimit(
        "auth:register:ip:burst",
        clientIp,
        cohortMode ? 600 : 5,
        10 * 60,
        10 * 60,
      ),
      consumeRateLimit(
        "auth:register:ip:hour",
        clientIp,
        cohortMode ? 1000 : 30,
        60 * 60,
        30 * 60,
      ),
      consumeRateLimit(
        "auth:register:email",
        email,
        3,
        30 * 60,
        30 * 60,
      ),
    ]);

    const blocked = [ipBurst, ipHourly, emailBurst].find((result) => !result.allowed);
    if (blocked) {
      return rateLimitResponse(
        blocked.retryAfterSeconds,
        "Тіркелу әрекеттері тым жиі орындалды. Біраз уақыттан кейін қайта көріңіз.",
      );
    }

    if (!isValidKzPhone(phone)) {
      return NextResponse.json({ field: "phone", error: "Телефон нөмірін толық енгізіңіз." }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ field: "email", error: "Email мекенжайын дұрыс енгізіңіз." }, { status: 400 });
    }

    if (firstName.length < 2) {
      return NextResponse.json({ field: "firstName", error: "Атыңызды дұрыс енгізіңіз." }, { status: 400 });
    }

    if (lastName.length < 2) {
      return NextResponse.json({ field: "lastName", error: "Тегіңізді дұрыс енгізіңіз." }, { status: 400 });
    }



    const passwordError = getPasswordValidationError(password, [
      firstName,
      lastName,
      email.split("@")[0] ?? "",
      phone.replace(/\D/g, ""),
    ]);

    if (passwordError) {
      return NextResponse.json(
        { field: "password", error: passwordError },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const admin = createAdminSupabaseClient();

    const { data: existingPhone, error: phoneLookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (phoneLookupError) {
      console.error("[auth/register] profiles phone lookup failed", {
        code: phoneLookupError.code,
        message: phoneLookupError.message,
        details: phoneLookupError.details,
        hint: phoneLookupError.hint,
      });

      return NextResponse.json(
        { field: "form", error: "Тіркелу алдында деректер қорын тексеру мүмкін болмады." },
        { status: 503 },
      );
    }

    if (existingPhone) {
      return NextResponse.json(
        { field: "form", error: "Бұл деректермен аккаунт ашу мүмкін болмады." },
        { status: 409 },
      );
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        phone: normalizedPhone,
        full_name: [firstName, lastName].join(" "),
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes("already registered") || message.includes("already been registered")) {
        return NextResponse.json(
          { field: "form", error: "Бұл деректермен аккаунт ашу мүмкін болмады." },
          { status: 409 },
        );
      }

      if (message.includes("phone") && (message.includes("duplicate") || message.includes("unique"))) {
        return NextResponse.json(
          { field: "form", error: "Бұл деректермен аккаунт ашу мүмкін болмады." },
          { status: 409 },
        );
      }

      if (message.includes("database error saving new user")) {
        return NextResponse.json(
          { field: "form", error: "Тіркелгіні сақтау кезінде қате болды. Деректерді тексеріп қайта көріңіз." },
          { status: 400 },
        );
      }

      console.error("[auth/register] createUser failed", {
        status: error.status,
        code: error.code,
        message: error.message,
      });

      if (error.status === 429) {
        return NextResponse.json(
          { field: "form", error: "Қазір тіркелушілер көп. Бір минуттан кейін қайта көріңіз." },
          {
            status: 429,
            headers: { "Retry-After": "60", "Cache-Control": "no-store" },
          },
        );
      }

      if (typeof error.status === "number" && error.status >= 500) {
        return NextResponse.json(
          { field: "form", error: "Серверге сұраныс көп түсті. 15 секундтан кейін қайта көріңіз." },
          {
            status: 503,
            headers: { "Retry-After": "15", "Cache-Control": "no-store" },
          },
        );
      }

      return NextResponse.json(
        { field: "form", error: "Тіркелу кезінде қате болды. Қайта көріңіз." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { userId: data.user?.id ?? null, email },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { field: "form", error: "Тіркелу кезінде қате болды. Қайта көріңіз." },
      { status: 400 },
    );
  }
}
