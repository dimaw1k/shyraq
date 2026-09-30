import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ROLES = new Set(["STUDENT", "MENTOR", "ADMIN"]);
const STATUSES = new Set(["REGISTERED", "WAITING_FOR_TEAM", "ACTIVE", "INACTIVE", "COMPLETED"]);

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { userId } = await context.params;
  const body = await request.json().catch(() => null);

  if (typeof body?.role === "string" && ROLES.has(body.role)) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: body.role })
      .eq("id", userId);
    if (error) return NextResponse.json({ error: "Role update failed" }, { status: 400 });
  }

  if (typeof body?.status === "string" && STATUSES.has(body.status)) {
    const { error } = await supabase
      .from("profiles")
      .update({ status: body.status })
      .eq("id", userId);
    if (error) return NextResponse.json({ error: "Status update failed" }, { status: 400 });
  }

  const { data: profile, error } = await supabase.from("profiles")
    .select("id,full_name,email,phone,age,education_type,education_place,status,role,created_at,updated_at")
    .eq("id", userId).single();

  if (error) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ profile });
}
