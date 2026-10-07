import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { isValidKzPhone, normalizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  await getAuthenticatedStaff("LEADER");

  const body = await request.json().catch(() => null);
  const rawPhone = typeof body?.phone === "string" ? body.phone : "";

  if (!isValidKzPhone(rawPhone)) {
    return NextResponse.json({ error: "Телефон нөмірін толық енгізіңіз." }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone);
  const admin = createAdminSupabaseClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,status,role,created_at")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Пайдаланушыны іздеу кезінде қате болды." }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({
      registered: false,
      message: "Бұл нөмірмен платформада аккаунт табылмады. Алдымен тіркелу керек.",
    });
  }

  if (profile.role !== "STUDENT" && profile.role !== "MENTOR") {
    return NextResponse.json(
      { registered: true, profile: { ...profile, manageable: false, message: "Бұл аккаунттың рөлін Жетекші өзгерте алмайды." } },
      { status: 200 },
    );
  }

  return NextResponse.json({
    registered: true,
    profile: {
      ...profile,
      manageable: true,
    },
  });
}
