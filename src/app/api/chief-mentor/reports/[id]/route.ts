import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const ALLOWED_STATUSES = new Set(["REVIEWED", "REJECTED"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Жарамсыз есеп статусы." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: existing, error: existingError } = await admin
    .from("daily_reports")
    .select("id,student_id,status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Есепті жүктеу сәтсіз аяқталды." }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Есеп табылмады." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await admin
    .from("daily_reports")
    .update({
      status: body.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
    })
    .eq("id", id)
    .select("id,student_id,report_date,status,reviewed_at,reviewed_by")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Есеп статусын өзгерту сәтсіз аяқталды." }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "DAILY_REPORT_REVIEWED",
    entity_type: "DAILY_REPORT",
    entity_id: id,
    metadata: {
      student_id: existing.student_id,
      from_status: existing.status,
      to_status: body.status,
    },
  });

  return NextResponse.json({ report: updated });
}
