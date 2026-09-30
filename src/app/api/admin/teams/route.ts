import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (typeof body?.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const mentorId = typeof body.mentorId === "string" && body.mentorId ? body.mentorId : null;
  if (mentorId) {
    const { data: mentor } = await supabase.from("profiles").select("id,role").eq("id", mentorId).maybeSingle();
    if (!mentor || mentor.role !== "MENTOR") {
      return NextResponse.json({ error: "mentorId must belong to a mentor profile" }, { status: 400 });
    }
  }

  const capacity = typeof body.capacity === "number"
    ? Math.max(1, Math.floor(body.capacity))
    : 70;

  const { data, error } = await supabase.from("teams").insert({
    name: body.name.trim(),
    mentor_id: mentorId,
    capacity,
    status: "ACTIVE",
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Team creation failed" }, { status: 400 });
  return NextResponse.json({ team: data });
}
