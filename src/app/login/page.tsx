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
      <span className="text-[26px] font-extrabold tracking-[-0.075em] text-[#172235]">
        SHYR<span className="text-[#ff8000]">A</span>Q
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

    if (digits.startsWith("8")) {
      subscriber = digits.slice(1);
    } else if (digits.startsWith("7")) {
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
    <main className={montserrat.className + " min-h-screen overflow-hidden bg-[#fbfaf7] text-[#172235]"}>
      <div className="absolute inset-x-0 top-0 h-[430px] bg-[radial-gradient(circle_at_14%_12%,rgba(255,255,255,.88),transparent_30%),linear-gradient(135deg,#fff0e8_0%,#ffd7ca_48%,#ffb18d_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 sm:px-7 lg:px-8">
        <div className="flex items-center justify-between">
          <Brand />
          <Link
            href="/register"
            className="rounded-full bg-white/85 px-4 py-2.5 text-xs font-extrabold shadow-[0_8px_26px_rgba(20,20,20,.07)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Тіркелу
          </Link>
        </div>

        <div className="mx-auto flex w-full flex-1 items-center justify-center py-8"><div className="grid w-full max-w-4xl items-center gap-5 lg:grid-cols-[1.12fr_.78fr] lg:gap-6">
          <section className="order-1 relative lg:order-1">
            <div className="absolute -inset-4 rounded-[34px] bg-[#ff8000]/10 blur-2xl" />
            <div className="relative rounded-[30px] border border-[#ebe4dc] bg-white/95 p-5 shadow-[0_24px_70px_rgba(39,25,17,.10)] backdrop-blur-xl sm:p-6 lg:p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff8000]">ЖЕКЕ ТІРКЕЛГІ</p>
              <h1 className="mt-2 text-[28px] font-extrabold tracking-[-.045em] sm:text-3xl">Жеке тіркелгіңізге кіріңіз.</h1>
              <p className="mt-2 max-w-lg text-[13px] font-medium leading-5.5 text-[#766e66]">
                Email немесе телефон арқылы кіріңіз.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                <div className="flex justify-end -mb-1"><Link href="/reset-password" className="text-[11px] font-extrabold text-[#ff8000] hover:underline">Құпиясөзді ұмыттыңыз ба?</Link></div>
                <label className="block">
                  <span className="text-xs font-extrabold text-[#3f3832]">Email немесе телефон нөмірі</span>
                  <input
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => handleIdentifierChange(event.target.value)}
                    className="mt-1.5 w-full rounded-[15px] border border-[#e7e0d8] bg-[#fcfbf9] px-4 py-3 text-sm font-medium outline-none transition-all duration-300 placeholder:text-[#b1a79f] focus:border-[#ff8000] focus:bg-white focus:ring-4 focus:ring-[#ff8000]/10"
                    placeholder="Email немесе +7 (700) 000 00 00"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-extrabold text-[#3f3832]">Құпиясөз</span>
                  <div className="relative mt-2">
                    <input
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-[15px] border border-[#e7e0d8] bg-[#fcfbf9] px-4 py-3 pr-12 text-sm font-medium outline-none transition-all duration-300 placeholder:text-[#b1a79f] focus:border-[#ff8000] focus:bg-white focus:ring-4 focus:ring-[#ff8000]/10"
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
                  className="group flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#ff8000] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(255,128,0,.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(255,128,0,.22)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Кіру..." : "Кіру"}
                  {!loading ? <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" /> : null}
                </button>
              </form>

              <p className="mt-5 text-center text-xs font-medium text-[#837970]">
                Тіркелгіңіз жоқ па?{" "}
                <Link href="/register" className="font-extrabold text-[#ff8000] hover:underline">
                  Тіркелу
                </Link>
              </p>
            </div>
          </section>

          <section className="order-2 relative lg:order-2">
            <div className="rounded-[24px] bg-[#172235] p-5 text-white shadow-[0_22px_58px_rgba(23,34,53,.16)] sm:p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/65">
                <Sparkles size={12} className="text-[#ff9800]" />
                21 күндік оқу марафоны
              </div>

              <h2 className="mt-5 text-[34px] font-extrabold leading-[1.04] tracking-[-.05em] sm:text-[40px]">
                Күнде аздап.
                <span className="block text-[#ff8000]">21 күнде үлкен өзгеріс.</span>
              </h2>

              <p className="mt-3 text-[13px] font-medium leading-5 text-white/65">
                Сабақ, тапсырма және прогресс — бір жерде.
              </p>

              <div className="mt-5 space-y-2.5">
                {["Күнделікті тапсырмалар", "Оқу жоспары", "Прогресс пен рейтинг"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-xs font-semibold text-white/75">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] bg-[#ff8000] text-white">
                      <Check size={14} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[18px] border border-white/8 bg-white/[.04] p-3.5">
                <p className="text-[9px] font-extrabold uppercase tracking-[.17em] text-white/35">SHYRAQ</p>
                <p className="mt-1.5 text-[13px] font-semibold leading-5 text-white/80">
                  Күнделікті жұмысты жүйеге келтіріп, мақсатыңызға жақындай беріңіз.
                </p>
              </div>
            </div>
          </section>
        </div></div>
      </div>
    </main>
  );
}
