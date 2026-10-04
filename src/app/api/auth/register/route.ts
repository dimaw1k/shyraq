import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isValidKzPhone, normalizePhone } from "@/lib/phone";

type RegisterPayload = {
  phone?: unknown;
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  age?: unknown;
  password?: unknown;
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
    const age = Number(body.age);

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

    if (!Number.isInteger(age) || age < 10 || age > 100) {
      return NextResponse.json({ field: "age", error: "Жасыңызды дұрыс енгізіңіз." }, { status: 400 });
    }


    if (password.length < 8) {
      return NextResponse.json({ field: "password", error: "Құпиясөз кемінде 8 таңба болуы керек." }, { status: 400 });
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
        { field: "phone", error: "Бұл телефон нөмірімен аккаунт бұрын тіркелген." },
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
        age,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes("already registered") || message.includes("already been registered")) {
        return NextResponse.json(
          { field: "email", error: "Бұл email арқылы аккаунт бұрын тіркелген." },
          { status: 409 },
        );
      }

      if (message.includes("phone") && (message.includes("duplicate") || message.includes("unique"))) {
        return NextResponse.json(
          { field: "phone", error: "Бұл телефон нөмірімен аккаунт бұрын тіркелген." },
          { status: 409 },
        );
      }

      if (message.includes("database error saving new user")) {
        return NextResponse.json(
          { field: "form", error: "Тіркелгіні сақтау кезінде қате болды. Деректерді тексеріп қайта көріңіз." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { field: "form", error: error.message },
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
