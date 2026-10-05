"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MailCheck,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useStudentLanguage } from "@/lib/student-language";
import { AuthLanguagePicker } from "@/components/auth/AuthLanguagePicker";

function getResetErrorMessage(
  code: string | null,
  t: (key: string) => string,
) {
  if (code === "invalid_or_expired") return t("invalidReset");
  return code ? t("resetUpdateFailed") : "";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useStudentLanguage("kk");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState<"checking" | "request" | "sent" | "update">("checking");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      const params = new URLSearchParams(window.location.search);
      const recoveryMode = params.get("mode") === "update";
      const recoveryError = getResetErrorMessage(params.get("error"), t);

      if (!recoveryMode) {
        if (!active) return;
        setMode("request");
        if (recoveryError) setError(recoveryError);
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data, error: userError } = await supabase.auth.getUser();

      if (!active) return;

      if (data.user && !userError) {
        setMode("update");
        return;
      }

      setMode("request");
      setError(t("invalidReset"));
    }

    void checkRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createBrowserSupabaseClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: window.location.origin + "/auth/recovery",
    });

    if (resetError) {
      setError(t("resetSendFailed"));
      setLoading(false);
      return;
    }

    setMode("sent");
    setLoading(false);
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("passwordMin"));
      return;
    }

    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setError("t("invalidReset")");
      setLoading(false);
      setMode("request");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(t("resetUpdateFailed"));
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reset=success");
  }

  const inputClass =
    "w-full rounded-[15px] border border-[#E7E0D8] bg-[#FCFBF9] py-3.5 pl-11 pr-4 text-[14px] font-medium outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10";

  if (mode === "checking") {
    return (
      <main className="min-h-[100dvh] bg-[#FAF9F7] px-4 py-8 text-[#172235]">
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
          <section className="w-full max-w-[430px] rounded-[26px] border border-[#E7E0D8] bg-white px-5 py-6 shadow-[0_20px_55px_rgba(23,34,53,.06)] sm:px-7 sm:py-7">
            <div className="flex flex-col items-center text-center">
            <AuthLanguagePicker />
              <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-[#E8E1D8] bg-[#FFF7F1] text-[#FF8000] shadow-[0_10px_24px_rgba(255,128,0,.10)]">
                <LockKeyhole size={24} strokeWidth={2.2} />
              </div>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">
                {t("resetPassword").toUpperCase()}
              </p>
              <h1 className="mt-2 text-[29px] font-extrabold leading-none tracking-[-.05em] sm:text-[32px]">
                {t("checking")}
              </h1>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (mode === "sent") {
    return (
      <main className="min-h-[100dvh] bg-[#FAF9F7] px-4 py-8 text-[#172235]">
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
          <section className="w-full max-w-[430px] rounded-[26px] border border-[#E7E0D8] bg-white px-5 py-6 shadow-[0_20px_55px_rgba(23,34,53,.06)] sm:px-7 sm:py-7">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-[#E8E1D8] bg-[#FFF7F1] text-[#FF8000] shadow-[0_10px_24px_rgba(255,128,0,.10)]">
                <MailCheck size={24} strokeWidth={2.2} />
              </div>

              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">
                {t("email").toUpperCase()}
              </p>
              <h1 className="mt-2 text-[29px] font-extrabold leading-none tracking-[-.05em] sm:text-[32px]">
                {t("checkEmail")}
              </h1>
              <p className="mt-3 max-w-[330px] text-[13px] font-medium leading-5 text-[#766E66]">
                {t("resetLinkSent")}
              </p>
            </div>

            <Link
              href="/login"
              className="mt-5 flex w-full items-center justify-center rounded-[15px] border border-[#E7E0D8] bg-[#FCFBF9] px-5 py-3.5 text-[14px] font-extrabold text-[#172235] transition hover:border-[#FF8000] hover:bg-white"
            >
              {t("backToLogin")}
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#FAF9F7] px-4 py-8 text-[#172235]">
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <section className="w-full max-w-[430px] rounded-[26px] border border-[#E7E0D8] bg-white px-5 py-6 shadow-[0_20px_55px_rgba(23,34,53,.06)] sm:px-7 sm:py-7">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-[#E8E1D8] bg-[#FFF7F1] text-[#FF8000] shadow-[0_10px_24px_rgba(255,128,0,.10)]">
              {mode === "request" ? (
                <LockKeyhole size={24} strokeWidth={2.2} />
              ) : (
                <Check size={24} strokeWidth={2.2} />
              )}
            </div>

            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">
              {mode === "request" ? t("resetPassword").toUpperCase() : t("newPassword").toUpperCase()}
            </p>
            <h1 className="mt-2 text-[29px] font-extrabold leading-none tracking-[-.05em] sm:text-[32px]">
              {mode === "request"
                ? t("forgotPassword")
                : t("setNewPassword")}
            </h1>
          </div>

          {mode === "request" ? (
            <form onSubmit={requestReset} className="mt-5 space-y-3.5">
              <label className="block">
                <span className="sr-only">{t("email")}</span>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]"
                    size={18}
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("email")}
                    className={inputClass}
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-[13px] border border-red-100 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-4 text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                disabled={loading}
                type="submit"
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#FF8000] px-5 py-3.5 text-[14px] font-extrabold text-white shadow-[0_12px_26px_rgba(255,128,0,.20)] transition-all hover:-translate-y-0.5 hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("sendingLink") : t("sendLink")}
                {!loading ? (
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                ) : null}
              </button>
            </form>
          ) : (
            <form onSubmit={updatePassword} className="mt-5 space-y-3.5">
              <label className="block">
                <span className="sr-only">{t("newPassword")}</span>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]"
                    size={18}
                  />
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("newPassword")}
                    className={inputClass + " pr-12"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#93877D] transition hover:bg-[#FFF1E2] hover:text-[#172235]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="sr-only">{t("repeatPassword")}</span>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]"
                    size={18}
                  />
                  <input
                    required
                    minLength={8}
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder={t("repeatPassword")}
                    className={inputClass + " pr-12"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((value) => !value)}
                    aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#93877D] transition hover:bg-[#FFF1E2] hover:text-[#172235]"
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {error ? (
                <div className="rounded-[13px] border border-red-100 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-4 text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                disabled={loading}
                type="submit"
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#FF8000] px-5 py-3.5 text-[14px] font-extrabold text-white shadow-[0_12px_26px_rgba(255,128,0,.20)] transition-all hover:-translate-y-0.5 hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "..." : t("updatePassword")}
                {!loading ? (
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                ) : null}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-[12px] font-medium text-[#837970]">
            <Link href="/login" className="font-extrabold text-[#FF8000] hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
