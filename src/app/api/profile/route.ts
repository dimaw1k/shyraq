import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { displayKzPhone, normalizePhone } from "@/lib/phone";
import { getPasswordValidationError } from "@/lib/security/password";
import { readLimitedJson } from "@/lib/http/read-limited-json";

async function getContext(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,status,role,avatar_path,created_at,updated_at")
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

  const { data: googleConnection } = profile.role === "CHIEF_MENTOR"
    ? await admin
        .from("google_connections")
        .select("google_email")
        .eq("user_id", userId)
        .maybeSingle()
    : { data: null };

  return {
    ...profile,
    phone: displayKzPhone(profile.phone),
    avatar_url: avatarUrl,
    team_names: teamNames,
    mentor_name: mentorName,
    google_connected: Boolean(googleConnection?.google_email),
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

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Деректер дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const body = parsedBody.value as Record<string, unknown>;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Деректер дұрыс емес." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,role,status,avatar_path")
    .eq("id", user.id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "Профиль табылмады." }, { status: 404 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : current.full_name;
  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : current.phone;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : current.email;

  if (fullName.length < 2 || fullName.length > 120) {
    return NextResponse.json({ error: "Аты-жөніңіз 2–120 таңба болуы керек." }, { status: 400 });
  }

  if (!/^\+7\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "Қазақстан телефон нөмірін дұрыс енгізіңіз." }, { status: 400 });
  }

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 180) {
    return NextResponse.json({ error: "Электрондық пошта дұрыс емес." }, { status: 400 });
  }

  // Never silently confirm a new mailbox with the service-role API.
  // Email changes must use a separate verification flow before this endpoint can support them.
  if (email !== current.email) {
    return NextResponse.json(
      { error: "Қауіпсіздік үшін жаңа email мекенжайын растау процесінсіз ауыстыруға болмайды." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }


  const newPassword =
    typeof body.newPassword === "string" && body.newPassword.length > 0
      ? body.newPassword
      : null;
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const phoneChanged = phone !== current.phone;

  if (newPassword) {
    const passwordError = getPasswordValidationError(newPassword, [
      current.full_name,
      current.email,
      current.phone,
    ]);

    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
  }

  if (phoneChanged || newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Телефонды немесе құпиясөзді өзгерту үшін қазіргі құпиясөзді енгізіңіз." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: current.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: "Қазіргі құпиясөз дұрыс емес." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const profileUpdate = {
    full_name: fullName,
    phone,
    updated_at: new Date().toISOString(),
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

  if (newPassword || fullName !== current.full_name || phone !== current.phone) {
    const authUpdate = await admin.auth.admin.updateUserById(user.id, {
      ...(newPassword ? { password: newPassword } : {}),
      user_metadata: {
        ...(user.user_metadata ?? {}),
        full_name: fullName,
        phone,
      },
    });

    if (authUpdate.error) {
      await admin.from("profiles").update({
        full_name: current.full_name,
        phone: current.phone,
        email: current.email,
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
