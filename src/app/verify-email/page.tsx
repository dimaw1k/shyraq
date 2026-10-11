"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useStudentLanguage } from "@/lib/student-language";
import { AuthLanguagePicker } from "@/components/auth/AuthLanguagePicker";

export default function VerifyEmailPage() {
  const { t } = useStudentLanguage("kk");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email")?.trim() ?? "");
  }, []);

  async function resendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError(t("invalidEmail"));
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error ?? t("verificationResendFailed"));
        return;
      }

      setMessage(t("verificationResent"));
    } catch {
      setError(t("verificationResendFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#FAF9F7] px-4 py-8 text-[#172235]">
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <section className="relative w-full max-w-[467px] rounded-[26px] border border-[#E7E0D8] bg-white px-[18px] py-[25px] shadow-[0_20px_55px_rgba(23,34,53,.06)] sm:px-[25px] sm:py-[30px]">
          <div className="flex flex-col items-center text-center">
            <AuthLanguagePicker />
            <div className="mt-2 grid h-14 w-14 place-items-center rounded-[18px] border border-[#E8E1D8] bg-[#FFF7F1] text-[#FF8000] shadow-[0_10px_24px_rgba(255,128,0,.10)]">
              <MailCheck size={25} strokeWidth={2.1} />
            </div>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">
              SHYRAQ
            </p>
            <h1 className="mt-2 text-[25px] font-extrabold leading-tight tracking-[-.04em] sm:text-[28px]">
              {t("verifyEmailHeading")}
            </h1>
            <p className="mt-3 max-w-[360px] text-[12px] font-medium leading-5 text-[#80766D]">
              {t("verifyEmailDescription")}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-[#51483F]">
                {t("email")}
              </span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setMessage("");
                }}
                placeholder="name@example.com"
                className="w-full rounded-[13px] border border-[#E7E0D8] bg-[#FCFBF9] px-3.5 py-3 text-[13px] font-medium outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10"
              />
            </label>

            <p className="text-[10px] font-medium leading-4 text-[#93877D]">
              {t("verifyEmailHint")}
            </p>

            {message ? (
              <div
                role="status"
                className="rounded-[13px] border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[11px] font-semibold leading-4 text-emerald-800"
              >
                {message}
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="rounded-[13px] border border-red-100 bg-red-50 px-3.5 py-3 text-[11px] font-semibold leading-4 text-red-700"
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={resendConfirmation}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#FF8000] px-5 py-3.5 text-[13px] font-extrabold text-white transition hover:bg-[#E87300] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("resendingVerification") : t("resendVerification")}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-[#8A7D73] transition hover:text-[#FF8000]"
            >
              <ArrowLeft size={14} />
              {t("backToLogin")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
