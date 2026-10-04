import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

const EDUCATION_TYPES = new Set(["SCHOOL", "COLLEGE", "UNIVERSITY", "OTHER"]);

async function getContext(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,education_type,status,role,avatar_path,created_at,updated_at")
    .eq("id", userId)
    .single();

  if (error || !profile) throw new Error("PROFILE_NOT_FOUND");

  const { data: studentMembership } = await admin
    .from("team_members")
    .select("team_id,teams(name,mentor_id)")
    .eq("student_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  let teamNames: string[] = [];
  let mentorName: string | null = null;

  const studentTeam = Array.isArray(studentMembership?.teams)
    ? studentMembership.teams[0]
    : studentMembership?.teams;

  if (studentTeam?.name) {
    teamNames = [studentTeam.name];
    if (studentTeam.mentor_id) {
      const { data: mentor } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", studentTeam.mentor_id)
        .maybeSingle();
      mentorName = mentor?.full_name ?? null;
    }
  } else {
    const { data: managedTeams } = await admin
      .from("teams")
      .select("name")
      .eq("mentor_id", userId)
      .order("name");
    teamNames = (managedTeams ?? []).map((team) => team.name);
  }

  const avatarUrl = profile.avatar_path
    ? admin.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl
    : null;

  return {
    ...profile,
    avatar_url: avatarUrl,
    team_names: teamNames,
    mentor_name: mentorName,
  };
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ profile: await getContext(user.id) });
  } catch {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Деректер дұрыс емес." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,education_type,role,status,avatar_path")
    .eq("id", user.id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : current.full_name;
  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : current.phone;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : current.email;
  const educationType =
    typeof body.educationType === "string"
      ? body.educationType.trim().toUpperCase()
      : current.education_type;

  if (fullName.length < 2 || fullName.length > 120) {
    return NextResponse.json({ error: "Аты-жөніңіз 2–120 таңба болуы керек." }, { status: 400 });
  }

  if (!/^\+7\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "Қазақстан телефон нөмірін дұрыс енгізіңіз." }, { status: 400 });
  }

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 180) {
    return NextResponse.json({ error: "Электрондық пошта дұрыс емес." }, { status: 400 });
  }


  if (!EDUCATION_TYPES.has(educationType)) {
    return NextResponse.json({ error: "Білім алу деңгейі дұрыс емес." }, { status: 400 });
  }

  const newPassword =
    typeof body.newPassword === "string" && body.newPassword.length > 0
      ? body.newPassword
      : null;
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";

  if (newPassword && newPassword.length < 8) {
    return NextResponse.json({ error: "Жаңа құпиясөз кемінде 8 таңбадан тұруы керек." }, { status: 400 });
  }

  if (newPassword) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: current.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: "Құпиясөзді өзгерту үшін қазіргі құпиясөзді дұрыс енгізіңіз." }, { status: 400 });
    }
  }

  const profileUpdate = {
    full_name: fullName,
    phone,
    education_type: educationType,
    updated_at: new Date().toISOString(),
    ...(email !== current.email ? { email } : {}),
  };

  const { error: profileError } = await admin
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (profileError) {
    console.error("[profile] profile update failed", {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
    });

    if (
      profileError.code === "23505" &&
      profileError.message.includes("profiles_phone_unique")
    ) {
      return NextResponse.json(
        {
          error:
            "Бұл телефон нөмірі Shyraq платформасында бұрын тіркелген. Басқа нөмір енгізіңіз.",
        },
        { status: 409 },
      );
    }

    if (profileError.code === "23505") {
      return NextResponse.json(
        { error: "Бұл деректердің біреуі платформада бұрын тіркелген." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Профильді сақтау сәтсіз аяқталды." },
      { status: 400 },
    );
  }

  if (email !== current.email || newPassword || fullName !== current.full_name || phone !== current.phone) {
    const authUpdate = await admin.auth.admin.updateUserById(user.id, {
      ...(email !== current.email ? { email, email_confirm: true } : {}),
      ...(newPassword ? { password: newPassword } : {}),
      user_metadata: {
        ...(user.user_metadata ?? {}),
        full_name: fullName,
        phone,
        education_type: educationType,
      },
    });

    if (authUpdate.error) {
      await admin.from("profiles").update({
        full_name: current.full_name,
        phone: current.phone,
        email: current.email,
        education_type: current.education_type,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);

      return NextResponse.json({
        error: authUpdate.error.message?.toLowerCase().includes("already") 
          ? "Бұл электрондық пошта бос емес."
          : "Auth деректерін жаңарту сәтсіз аяқталды.",
      }, { status: 400 });
    }
  }

  return NextResponse.json({ profile: await getContext(user.id) });
}
