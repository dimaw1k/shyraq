import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ROLES = new Set(["STUDENT", "MENTOR", "ADMIN"]);
const STATUSES = new Set(["REGISTERED", "WAITING_FOR_TEAM", "ACTIVE", "INACTIVE", "COMPLETED"]);

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const url = new URL(request.url);
  const search = (url.searchParams.get("search") ?? "").trim();
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");
  const limitValue = Number(url.searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(limitValue) ? Math.min(200, Math.max(1, Math.floor(limitValue))) : 100;

  let query = supabase
    .from("profiles")
    .select("id,full_name,email,phone,age,education_type,education_place,status,role,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) {
    const term = search.replace(/[%_]/g, "");
    query = query.or("full_name.ilike.%" + term + "%,email.ilike.%" + term + "%,phone.ilike.%" + term + "%");
  }

  if (role && ROLES.has(role)) query = query.eq("role", role);
  if (status && STATUSES.has(status)) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Unable to load users" }, { status: 500 });

  return NextResponse.json({ users: data ?? [] });
}
