"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AtSign, Eye, EyeOff, LockKeyhole, LogIn } from "lucide-react";
import { formatKzPhone } from "@/lib/phone";
import { useStudentLanguage } from "@/lib/student-language";
import { AuthLanguagePicker } from "@/components/auth/AuthLanguagePicker";

function Brand() {
  return (
    <Link href="/" aria-label="Shyraq" className="inline-flex shrink-0 items-center">
      <svg
        width="116"
        height="34"
        viewBox="0 0 116 34"
        role="img"
        aria-label="SHYRAQ"
        className="block h-[28px] w-auto"
      >
        <text
          x="0"
          y="26"
          fill="#172235"
          fontSize="27"
          fontWeight="800"
          letterSpacing="-0.35"
          fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        >
          SHYR
        </text>
        <g transform="translate(-15 0)">
          <path
            d="M100 25.8c-3.8-4.8-6.8-8.2-6.8-12.9 0-4.2 3-7.5 6.8-7.5s6.8 3.3 6.8 7.5c0 4.7-3 8.1-6.8 12.9Z"
            fill="#FF8000"
          />
          <path
            d="M100 20.4c-1.7-2.3-2.9-4.3-2.9-6.5 0-1.7 1.2-3 2.9-3s2.9 1.3 2.9 3c0 2.2-1.2 4.2-2.9 6.5Z"
            fill="#FFF7F1"
          />
          <circle cx="100" cy="25.1" r="1.3" fill="#FF8000" />
        </g>
        <text
          x="93"
          y="25"
          fill="#172235"
          fontSize="27"
          fontWeight="800"
          letterSpacing="-1.15"
          fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        >
          Q
        </text>
      </svg>
    </Link>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useStudentLanguage("kk");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleIdentifierChange(value: string) {
    if (/^[+\d\s()\-]*$/.test(value) && /\d/.test(value)) {
      setIdentifier(formatKzPhone(value));
      return;
    }

    setIdentifier(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? t("loginError"));
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("loginConnectionError"));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#FAF9F7] px-4 py-8 text-[#172235]">
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <section className="w-full max-w-[430px] rounded-[26px] border border-[#E7E0D8] bg-white px-5 py-6 shadow-[0_20px_55px_rgba(23,34,53,.06)] sm:px-7 sm:py-7">
          <div className="flex flex-col items-center text-center">
            <AuthLanguagePicker />
            <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-[#E8E1D8] bg-[#FFF7F1] text-[#FF8000] shadow-[0_10px_24px_rgba(255,128,0,.10)]">
              <LogIn size={24} strokeWidth={2.2} />
            </div>

            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">{t("loginUpper")}</p>
            <h1 className="mt-2 text-[29px] font-extrabold leading-none tracking-[-.05em] sm:text-[32px]">
              {t("loginHeading")}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <label className="block">
              <span className="sr-only">{t("emailOrPhone")}</span>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]" size={18} />
                <input
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => handleIdentifierChange(event.target.value)}
                  className="w-full rounded-[15px] border border-[#E7E0D8] bg-[#FCFBF9] py-3.5 pl-11 pr-4 text-[14px] font-medium outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10"
                  placeholder={t("emailPlaceholder")}
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">{t("password")}</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]" size={18} />
                <input
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-[15px] border border-[#E7E0D8] bg-[#FCFBF9] py-3.5 pl-11 pr-12 text-[14px] font-medium outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10"
                  placeholder={t("password")}
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

            <div className="-mt-1 flex justify-end">
              <Link
                href="/reset-password"
                className="text-[11px] font-bold text-[#8A7D73] transition hover:text-[#FF8000] hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>

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
              {loading ? t("loggingIn") : t("login")}
              {!loading ? <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /> : null}
            </button>
          </form>

          <p className="mt-5 text-center text-[12px] font-medium text-[#837970]">
            {t("noAccount")}{" "}
            <Link href="/register" className="font-extrabold text-[#FF8000] hover:underline">
              {t("register")}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
