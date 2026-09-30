import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ teamId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { teamId } = await context.params;
  const body = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};

  if (typeof body?.name === "string" && body.name.trim()) updates.name = body.name.trim();

  if (typeof body?.mentorId === "string") {
    const mentorId = body.mentorId || null;
    if (mentorId) {
      const { data: mentor } = await supabase.from("profiles").select("id,role").eq("id", mentorId).maybeSingle();
      if (!mentor || mentor.role !== "MENTOR") {
        return NextResponse.json({ error: "mentorId must belong to a mentor profile" }, { status: 400 });
      }
    }
    updates.mentor_id = mentorId;
  }

  if (typeof body?.capacity === "number") updates.capacity = Math.max(1, Math.floor(body.capacity));
  if (body?.status === "ACTIVE" || body?.status === "INACTIVE") updates.status = body.status;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No supported fields" }, { status: 400 });
  }

  const { data, error } = await supabase.from("teams").update(updates).eq("id", teamId).select("*").single();
  if (error) return NextResponse.json({ error: "Team update failed" }, { status: 400 });
  return NextResponse.json({ team: data });
}
