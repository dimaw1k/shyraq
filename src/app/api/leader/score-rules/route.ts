import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const ALLOWED_CODES = ["TASKS", "TESTS", "VIDEO", "ATTENDANCE", "REPORTS", "STREAK"] as const;
type ScoreCode = (typeof ALLOWED_CODES)[number];

function isAllowedCode(value: string): value is ScoreCode {
  return ALLOWED_CODES.includes(value as ScoreCode);
}

export async function GET() {
  const { supabase } = await getAuthenticatedStaff("LEADER");
  const { data, error } = await supabase
    .from("score_rules")
    .select("id,code,label,weight,active,updated_at")
    .in("code", ALLOWED_CODES)
    .order("code");

  if (error) {
    return NextResponse.json({ error: "Ұпай ережелерін жүктеу сәтсіз аяқталды." }, { status: 500 });
  }

  return NextResponse.json({ rules: data ?? [] });
}

export async function PATCH(request: Request) {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const body = await request.json().catch(() => null);

  if (!Array.isArray(body?.rules)) {
    return NextResponse.json({ error: "rules массиві қажет." }, { status: 400 });
  }

  const submitted = new Map<string, { code: ScoreCode; weight: number; active: boolean }>();

  for (const item of body.rules) {
    const code = typeof item?.code === "string" ? item.code : "";
    const weight = Number(item?.weight);
    const active = Boolean(item?.active);

    if (!isAllowedCode(code)) {
      return NextResponse.json({ error: "Жарамсыз score rule коды." }, { status: 400 });
    }

    if (!Number.isFinite(weight) || weight < 0 || weight > 10000) {
      return NextResponse.json(
        { error: code + " үшін weight 0 мен 10000 арасында болуы керек." },
        { status: 400 },
      );
    }

    submitted.set(code, {
      code,
      weight: Number(weight.toFixed(2)),
      active,
    });
  }

  const rows = ALLOWED_CODES
    .map((code) => submitted.get(code))
    .filter((value): value is { code: ScoreCode; weight: number; active: boolean } => Boolean(value))
    .map((rule) => ({
      code: rule.code,
      weight: rule.weight,
      active: rule.active,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) {
    return NextResponse.json({ error: "Кемінде бір rule жіберіңіз." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("score_rules")
    .upsert(rows, { onConflict: "code" })
    .select("id,code,label,weight,active,updated_at")
    .order("code");

  if (error) {
    return NextResponse.json({ error: "Ұпай ережелерін сақтау сәтсіз аяқталды." }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "SCORE_RULES_UPDATED",
    entity_type: "SCORE_RULES",
    metadata: {
      rules: rows.map((row) => ({
        code: row.code,
        weight: row.weight,
        active: row.active,
      })),
    },
  });

  return NextResponse.json({ rules: data ?? [] });
}
