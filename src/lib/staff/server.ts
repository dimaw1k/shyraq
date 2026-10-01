import { redirect } from "next/navigation";
import type { AppRole } from "@/types/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAuthenticatedStaff(required: AppRole | AppRole[]) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,role,status")
    .eq("id", user.id)
    .maybeSingle();

  const roles = Array.isArray(required) ? required : [required];
  const role = profile?.role as AppRole | undefined;

  if (!profile || !role || !roles.includes(role)) {
    redirect("/dashboard");
  }

  return { supabase, user, profile: { ...profile, role } };
}
