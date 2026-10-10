import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyRecoveryGrant } from "@/lib/security/recovery-grant";

const RECOVERY_COOKIE = "shyraq_recovery_grant";

export async function GET() {
  const cookieStore = await cookies();
  const grant = verifyRecoveryGrant(cookieStore.get(RECOVERY_COOKIE)?.value);

  if (!grant) {
    const result = NextResponse.json(
      { ok: false, error: "Қалпына келтіру сілтемесі жарамсыз немесе мерзімі өткен." },
      {
        status: 401,
        headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
      },
    );
    result.cookies.set(RECOVERY_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return result;
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
  );
}
