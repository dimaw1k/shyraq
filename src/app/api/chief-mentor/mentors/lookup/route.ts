import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { isValidKzPhone, normalizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  await getAuthenticatedStaff("CHIEF_MENTOR");
  const body = await request.json().catch(() => null);
  const rawPhone = typeof body?.phone === "string" ? body.phone : "";
  if (!isValidKzPhone(rawPhone)) return NextResponse.json({ error: "Телефон нөмірін толық енгізіңіз." }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("profiles")
    .select("id,full_name,email,phone,age,status,role")
    .eq("phone", normalizePhone(rawPhone))
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Пайдаланушыны іздеу кезінде қате болды." }, { status: 500 });
  if (!data) return NextResponse.json({ profile: null, registered: false });

  let team_name: string | null = null;
  const { data: membership } = await admin.from("team_members").select("team_id").eq("student_id", data.id).eq("status","ACTIVE").maybeSingle();
  if (membership?.team_id) {
    const { data: team } = await admin.from("teams").select("name").eq("id",membership.team_id).maybeSingle();
    team_name=team?.name??null;
  }
  return NextResponse.json({ registered:true, profile:{...data,team_name} });
}
