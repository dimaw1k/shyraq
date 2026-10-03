import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await createAdminSupabaseClient()
    .from("google_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Google аккаунтын ажырату сәтсіз аяқталды." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
