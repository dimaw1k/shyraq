import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // This integration is supported for active chief mentors only. Enforce the
  // same authorization as the OAuth start/callback routes before using admin
  // privileges to remove the stored connection.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Аккаунтты тексеру мүмкін болмады." }, { status: 500 });
  }
  if (profile?.role !== "CHIEF_MENTOR" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Chief Mentor access required" }, { status: 403 });
  }

  const { error } = await createAdminSupabaseClient()
    .from("google_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Google аккаунтын ажырату сәтсіз аяқталды." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
