"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Factor = {
  id: string;
  friendly_name?: string | null;
  status?: "verified" | "unverified";
  factor_type?: "totp" | "phone";
};

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default function MfaPage() {
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNext(searchParams.get("next")), [searchParams]);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [factor, setFactor] = useState<Factor | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"loading" | "enroll" | "verify">("loading");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;

      if (error) {
        setMessage("MFA күйін оқу мүмкін болмады. Қайта кіріп көріңіз.");
        setStep("verify");
        return;
      }

      const factors = data.totp ?? [];
      const existingFactor = factors.find(
        (item) => item.status === "verified" || item.status === "unverified",
      );

      if (existingFactor) {
        setFactor({
          id: existingFactor.id,
          friendly_name: existingFactor.friendly_name,
          status: existingFactor.status === "verified" ? "verified" : "unverified",
          factor_type: existingFactor.factor_type,
        });
        setStep("verify");
        return;
      }

      setStep("enroll");
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function enroll() {
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Shyraq Staff",
    });

    if (error || !data) {
      setMessage("Authenticator факторын қосу мүмкін болмады.");
      setBusy(false);
      return;
    }

    setFactor({
      id: data.id,
      friendly_name: data.friendly_name,
      status: "unverified",
      factor_type: "totp",
    });
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStep("verify");
    setBusy(false);
  }

  async function verify() {
    if (!factor) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setMessage("6 таңбалы код енгізіңіз.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor.id });

    if (challengeError || !challenge) {
      setMessage("MFA challenge жасау мүмкін болмады.");
      setBusy(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyError) {
      setMessage("MFA коды дұрыс емес немесе мерзімі өтіп кеткен.");
      setBusy(false);
      return;
    }

    window.location.href = next;
  }

  if (step === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FAFAFA] px-5">
        <p className="text-sm font-semibold text-[#6D655E]">Қауіпсіздік тексерілуде…</p>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#FAFAFA] px-5 py-10">
      <section className="w-full max-w-[520px] rounded-[24px] border border-[#E8E1DA] bg-white p-6 shadow-[0_24px_70px_rgba(23,34,53,.08)] sm:p-8">
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">
          SHYRAQ SECURITY
        </p>
        <h1 className="mt-2 text-2xl font-black text-[#172235]">
          Қызметкер аккаунтын қорғау
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#756C64]">
          Leader, Chief Mentor және Mentor аккаунттары үшін көп факторлы аутентификация міндетті.
        </p>

        {step === "enroll" ? (
          <div className="mt-7 space-y-4">
            <div className="rounded-[16px] bg-[#FFF8F2] p-4 text-sm leading-6 text-[#665A50]">
              Authenticator қолданбасын қосып, 6 таңбалы кодпен растаңыз.
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void enroll()}
              className="w-full rounded-[14px] bg-[#FF8000] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
            >
              {busy ? "Дайындалуда…" : "Authenticator қосу"}
            </button>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            {qrCode ? (
              <div className="rounded-[16px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 text-center">
                <p className="text-xs font-bold text-[#544B44]">QR кодты Authenticator қолданбасымен сканерлеңіз</p>
                <img src={qrCode} alt="Shyraq MFA QR code" className="mx-auto mt-4 h-52 w-52 rounded-xl bg-white p-2" />
                <p className="mt-3 break-all text-[11px] font-semibold text-[#756C64]">{secret}</p>
              </div>
            ) : null}

            <label className="block">
              <span className="text-[11px] font-extrabold text-[#4B433C]">6 таңбалы код</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="mt-2 w-full rounded-[14px] border border-[#E8E1DA] px-4 py-3 text-center text-xl font-extrabold tracking-[.35em] outline-none focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
              />
            </label>

            <button
              type="button"
              disabled={busy || code.length !== 6}
              onClick={() => void verify()}
              className="w-full rounded-[14px] bg-[#172235] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
            >
              {busy ? "Тексерілуде…" : "MFA растау"}
            </button>
          </div>
        )}

        {message ? (
          <p className="mt-4 rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-sm font-semibold text-[#765843]">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
