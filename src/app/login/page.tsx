"use client";

import { FormEvent, useState } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from "lucide-react";

const montserrat = Montserrat({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

function Brand() {
  return (
    <Link href="/" aria-label="Shyraq" className="inline-flex items-center">
      <span className="text-[24px] font-extrabold tracking-[-0.075em] text-[#172235]">
        SHYR<span className="text-[var(--accent)]">A</span>Q
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
    const trimmed = value.trim();

    if (!trimmed) {
      setIdentifier("");
      return;
    }

    if (!/^[+\d\s()\-]*$/.test(trimmed)) {
      setIdentifier(value);
      return;
    }

    const digits = trimmed.replace(/\D/g, "").slice(0, 11);

    if (!digits) {
      setIdentifier(trimmed);
      return;
    }

    let subscriber = digits;

    if (digits.startsWith("8") || digits.startsWith("7")) {
      subscriber = digits.slice(1);
    }

    subscriber = subscriber.slice(0, 10);

    if (!subscriber) {
      setIdentifier("+7 (");
      return;
    }

    const operator = subscriber.slice(0, 3);
    const part1 = subscriber.slice(3, 6);
    const part2 = subscriber.slice(6, 8);
    const part3 = subscriber.slice(8, 10);

    let formatted = `+7 (${operator}`;
    if (operator.length === 3) formatted += ")";
    if (part1) formatted += ` ${part1}`;
    if (part2) formatted += ` ${part2}`;
    if (part3) formatted += ` ${part3}`;

    setIdentifier(formatted);
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
      <div className="absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,.9),transparent_32%),linear-gradient(135deg,#fff3eb_0%,#ffe0d0_48%,#ffc09d_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 sm:px-7 lg:px-8">
        <div className="flex items-center justify-between">
          <Brand />
          <Link
            href="/register"
            className="rounded-full border border-white/80 bg-white/85 px-4 py-2.5 text-xs font-extrabold shadow-[0_8px_26px_rgba(20,20,20,.07)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Тіркелу
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="w-full max-w-[820px]">
            <div className="grid gap-4 overflow-hidden rounded-[30px] border border-white/80 bg-white/88 p-3 shadow-[0_28px_90px_rgba(39,25,17,.10)] backdrop-blur-xl lg:grid-cols-[.92fr_1.08fr] lg:p-4">
              <section className="order-2 rounded-[24px] bg-[#172235] p-5 text-white sm:p-6 lg:order-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/65">
                  <Sparkles size={12} className="text-[#ff9800]" />
                  SHYRAQ
                </div>

                <h2 className="mt-5 text-[30px] font-extrabold leading-[1.03] tracking-[-.05em] sm:text-[36px]">
                  Күнде аздап.
                  <span className="block text-[var(--accent)]">21 күнде нәтиже.</span>
                </h2>

                <p className="mt-3 text-[12px] font-medium leading-5 text-white/62">
                  Сабақ, тапсырма және прогресс — бір жерде.
                </p>

                <div className="mt-5 space-y-2.5">
                  {["Күнделікті тапсырмалар", "Оқу жоспары", "Прогресс пен рейтинг"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-xs font-semibold text-white/75">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] bg-[var(--accent)] text-white">
                        <Check size={14} />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section className="order-1 p-2 sm:p-4 lg:order-2 lg:px-4 lg:py-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[var(--accent)]">
                  ЖЕКЕ ТІРКЕЛГІ
                </p>
                <h1 className="mt-2 text-[29px] font-extrabold tracking-[-.045em] sm:text-[34px]">
                  Жеке тіркелгіңізге кіріңіз.
                </h1>
                <p className="mt-2 text-[12px] font-medium leading-5 text-[#766e66]">
                  Email немесе телефон арқылы кіріңіз.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                  <div className="flex justify-end -mb-1">
                    <Link
                      href="/reset-password"
                      className="text-[11px] font-extrabold text-[var(--accent)] hover:underline"
                    >
                      Құпиясөзді ұмыттыңыз ба?
                    </Link>
                  </div>

                  <label className="block">
                    <span className="text-xs font-extrabold text-[#3f3832]">Email немесе телефон нөмірі</span>
                    <input
                      required
                      autoComplete="username"
                      value={identifier}
                      onChange={(event) => handleIdentifierChange(event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-[15px] border border-[#e7e0d8] bg-[#fcfbf9] px-4 py-3 text-sm font-medium outline-none transition-all duration-200 placeholder:text-[#b1a79f] focus:border-[var(--accent)] focus:bg-white focus:ring-4 focus:ring-[rgba(255,128,0,.10)]"
                      placeholder="Email немесе +7 (700) 000 00 00"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-extrabold text-[#3f3832]">Құпиясөз</span>
                    <div className="relative mt-1.5">
                      <input
                        required
                        minLength={8}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="min-h-11 w-full rounded-[15px] border border-[#e7e0d8] bg-[#fcfbf9] px-4 py-3 pr-12 text-sm font-medium outline-none transition-all duration-200 placeholder:text-[#b1a79f] focus:border-[var(--accent)] focus:bg-white focus:ring-4 focus:ring-[rgba(255,128,0,.10)]"
                        placeholder="Құпиясөзді енгізіңіз"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#887d73] transition hover:bg-[#f4eee8] hover:text-[#172235]"
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>

                  {error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <button
                    disabled={loading}
                    type="submit"
                    className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-[15px] bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(255,128,0,.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Кіру..." : "Кіру"}
                    {!loading ? <ArrowRight size={16} /> : null}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs font-medium text-[#837970]">
                  Тіркелгіңіз жоқ па?{" "}
                  <Link href="/register" className="font-extrabold text-[var(--accent)] hover:underline">
                    Тіркелу
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
