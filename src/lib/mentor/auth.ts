import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMentorWorkspaceData } from "@/lib/mentor/workspace";

export async function getMentorPageData() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "MENTOR") redirect("/dashboard");

  const workspace = await getMentorWorkspaceData(supabase, user.id);

  return {
    supabase,
    user,
    profile,
    workspace,
  };
}
