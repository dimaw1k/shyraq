"use client";

import { FormEvent, useState } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { formatKzPhone } from "@/lib/phone";

const montserrat = Montserrat({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

function Brand() {
  return (
    <Link href="/" aria-label="Shyraq" className="inline-flex items-center">
      <span className="text-[28px] font-extrabold tracking-[-0.075em] text-[#172235]">
        SHYR<span className="text-[#ff6f2c]">A</span>Q
      </span>
    </Link>
  );
}

export default function LoginPage() {
  const router = useRouter();
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
        setError(result.error ?? "Кіру кезінде қате болды.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Кіру кезінде байланыс қатесі болды. Қайта көріңіз.");
      setLoading(false);
    }
  }

  return (
    <main className={montserrat.className + " min-h-screen bg-[#FAF9F7] text-[#172235]"}>
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[520px]">
          <div className="mb-6 flex items-center justify-between">
            <Brand />
            <Link
              href="/register"
              className="rounded-full border border-[#E7E0D8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4A423B] shadow-[0_6px_18px_rgba(23,34,53,.04)] transition hover:-translate-y-0.5 hover:border-[#FFB067] hover:bg-[#FFF8F1]"
            >
              Тіркелу
            </Link>
          </div>

          <section className="rounded-[28px] border border-[#E7E0D8] bg-white p-6 shadow-[0_24px_70px_rgba(23,34,53,.08)] sm:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">КІРУ</p>
            <h1 className="mt-2 text-[30px] font-extrabold tracking-[-.045em] sm:text-[36px]">Аккаунтқа кіріңіз.</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-[#766E66]">
              Электрондық пошта немесе телефон арқылы кіріңіз.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block">
                <span className="text-xs font-extrabold text-[#3F3832]">Электрондық пошта немесе телефон</span>
                <input
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => handleIdentifierChange(event.target.value)}
                  className="mt-2 w-full rounded-[16px] border border-[#E7E0D8] bg-[#FCFBF9] px-4 py-3.5 text-sm font-medium outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10"
                  placeholder="you@example.com немесе +7 (700) 000 00 00"
                />
              </label>

              <label className="block">
                <span className="text-xs font-extrabold text-[#3F3832]">Құпиясөз</span>
                <div className="relative mt-2">
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-[16px] border border-[#E7E0D8] bg-[#FCFBF9] px-4 py-3.5 pr-12 text-sm font-medium outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10"
                    placeholder="Құпиясөзді енгізіңіз"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#887D73] transition hover:bg-[#FFF1E2] hover:text-[#172235]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {error ? (
                <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                disabled={loading}
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#FF8000] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(255,128,0,.20)] transition-all hover:-translate-y-0.5 hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Кіру..." : "Кіру"}
                {!loading ? <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /> : null}
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-medium text-[#837970]">
              Аккаунтыңыз жоқ па?{" "}
              <Link href="/register" className="font-extrabold text-[#FF8000] hover:underline">
                Тіркелу
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
