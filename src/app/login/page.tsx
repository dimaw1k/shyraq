"use client";

import { FormEvent, useState } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from "lucide-react";
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
    <main className={montserrat.className + " min-h-screen overflow-hidden bg-[#fbfaf7] text-[#172235]"}>
      <div className="absolute inset-x-0 top-0 h-[430px] bg-[radial-gradient(circle_at_14%_12%,rgba(255,255,255,.88),transparent_30%),linear-gradient(135deg,#fff0e8_0%,#ffd7ca_48%,#ffb18d_100%)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-7 lg:px-8">
        <div className="flex items-center justify-between">
          <Brand />
          <Link
            href="/register"
            className="rounded-full bg-white/85 px-4 py-2.5 text-xs font-extrabold shadow-[0_8px_26px_rgba(20,20,20,.07)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Тіркелу
          </Link>
        </div>

        <div className="mx-auto mt-7 grid max-w-6xl items-center gap-8 lg:grid-cols-[1.28fr_.72fr] lg:gap-10">
          <section className="order-1 relative lg:order-1">
            <div className="absolute -inset-5 rounded-[38px] bg-[#ff6f2c]/10 blur-2xl" />
            <div className="relative rounded-[36px] border border-[#ebe4dc] bg-white/95 p-5 shadow-[0_30px_100px_rgba(39,25,17,.12)] backdrop-blur-xl sm:p-7 lg:p-8">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">ЖЕКЕ ТІРКЕЛГІ</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">Жеке тіркелгіңізге кіріңіз.</h1>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#766e66]">
                Электрондық пошта немесе телефон нөмірі арқылы тіркелгіңізге кіріңіз.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block">
                  <span className="text-xs font-extrabold text-[#3f3832]">Электрондық пошта немесе телефон нөмірі</span>
                  <input
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => handleIdentifierChange(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#e7e0d8] bg-[#fcfbf9] px-4 py-3.5 text-sm font-medium outline-none transition-all duration-300 placeholder:text-[#b1a79f] focus:border-[#ff6f2c] focus:bg-white focus:ring-4 focus:ring-[#ff6f2c]/10"
                    placeholder="Электрондық пошта немесе +7 (700) 000 00 00"
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
                      className="w-full rounded-2xl border border-[#e7e0d8] bg-[#fcfbf9] px-4 py-3.5 pr-12 text-sm font-medium outline-none transition-all duration-300 placeholder:text-[#b1a79f] focus:border-[#ff6f2c] focus:bg-white focus:ring-4 focus:ring-[#ff6f2c]/10"
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
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6f2c] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(255,111,44,.20)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(255,111,44,.26)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Кіру..." : "Кіру"}
                  {!loading ? <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" /> : null}
                </button>
              </form>

              <p className="mt-6 text-center text-xs font-medium text-[#837970]">
                Тіркелгіңіз жоқ па?{" "}
                <Link href="/register" className="font-extrabold text-[#ff6f2c] hover:underline">
                  Тіркелу
                </Link>
              </p>
            </div>
          </section>

          <section className="order-2 relative lg:order-2">
            <div className="rounded-[28px] bg-[#172235] p-6 text-white shadow-[0_28px_80px_rgba(23,34,53,.18)] sm:p-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/65">
                <Sparkles size={12} className="text-[#ff8a52]" />
                21 күндік оқу марафоны
              </div>

              <h2 className="mt-6 text-4xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-5xl">
                Күнде аздап.
                <span className="block text-[#ff6f2c]">21 күнде үлкен өзгеріс.</span>
              </h2>

              <p className="mt-4 text-sm font-medium leading-6 text-white/65">
                Shyraq — оқуды кейінге қалдырмай, күн сайын жоспармен жүруге көмектесетін марафон. Сабақ, тапсырма және прогресс — бір жерде.
              </p>

              <div className="mt-7 space-y-3">
                {["Күнделікті тапсырмалар", "Оқу жоспары", "Прогресс пен рейтинг"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-xs font-semibold text-white/75">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ff6f2c] text-white">
                      <Check size={15} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[22px] border border-white/8 bg-white/[.04] p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[.17em] text-white/35">SHYRAQ</p>
                <p className="mt-2 text-sm font-semibold text-white/80">
                  Күнделікті жұмысты жүйеге келтіріп, мақсатыңызға жақындай беріңіз.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
