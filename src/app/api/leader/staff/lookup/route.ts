import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { isValidKzPhone, normalizePhone } from "@/lib/phone";

function educationLabel(value: string | null | undefined) {
  if (value === "SCHOOL") return "Мектеп";
  if (value === "COLLEGE") return "Колледж";
  if (value === "UNIVERSITY") return "Университет";
  return "Басқа";
}

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
    .select("id,full_name,email,phone,age,education_type,status,role,created_at")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Пайдаланушыны іздеу кезінде қате болды." }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({
      registered: false,
      phone,
      message: "Бұл нөмірмен платформада аккаунт табылмады. Алдымен тіркелу керек.",
    });
  }

  const { data: membership } = await admin
    .from("team_members")
    .select("team_id,teams(name,mentor_id)")
    .eq("student_id", profile.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const team = Array.isArray(membership?.teams) ? membership?.teams[0] : membership?.teams;
  let mentorName: string | null = null;

  if (team?.mentor_id) {
    const { data: mentor } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", team.mentor_id)
      .maybeSingle();
    mentorName = mentor?.full_name ?? null;
  }

  return NextResponse.json({
    registered: true,
    profile: {
      ...profile,
      education_label: educationLabel(profile.education_type),
      team_name: team?.name ?? null,
      mentor_name: mentorName,
    },
  });
}
