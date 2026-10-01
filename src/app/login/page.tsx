"use client";

import { FormEvent, useState } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError("Email немесе құпиясөз қате. Деректеріңізді қайта тексеріңіз.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className={montserrat.className + " min-h-screen overflow-hidden bg-[#fbfaf7] text-[#172235]"}>
      <div className="absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_16%_15%,rgba(255,255,255,.85),transparent_32%),linear-gradient(135deg,#fff0e8_0%,#ffd7ca_48%,#ffb18d_100%)]" />
      <div className="relative mx-auto min-h-screen max-w-7xl px-5 py-6 sm:px-7 lg:px-8">
        <div className="flex items-center justify-between">
          <Brand />
          <Link
            href="/register"
            className="rounded-full bg-white/85 px-4 py-2.5 text-xs font-extrabold shadow-[0_8px_26px_rgba(20,20,20,.07)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Тіркелу
          </Link>
        </div>

        <div className="grid min-h-[calc(100vh-104px)] items-center gap-10 py-10 lg:grid-cols-[1fr_520px] lg:gap-20">
          <section className="hidden max-w-xl lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#6f625a] backdrop-blur">
              <Sparkles size={13} className="text-[#ff6f2c]" />
              21 күндік оқу марафоны
            </div>
            <h1 className="mt-6 text-6xl font-extrabold leading-[.98] tracking-[-.06em]">
              Күнді жоспарла.
              <span className="block text-[#ff6f2c]">Өзіңді өзгерт.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-7 text-[#655c54]">
              Shyraq-та сабақ, тапсырма және прогресс бір жерде. Бүгін бастаған ісің ертеңгі нәтижеңе әсер етеді.
            </p>
            <div className="mt-7 space-y-3">
              {["Күнделікті тапсырмалар", "Оқу жоспары", "Прогресс пен рейтинг"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-[#4f4842]">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#172235] text-white">
                    <Check size={15} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="relative">
            <div className="absolute -inset-5 rounded-[38px] bg-[#ff6f2c]/10 blur-2xl" />
            <div className="relative rounded-[32px] border border-[#ebe4dc] bg-white/95 p-6 shadow-[0_28px_90px_rgba(39,25,17,.14)] backdrop-blur-xl sm:p-8">
              <div className="mb-7 lg:hidden">
                <Brand />
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">ЖЕКЕ ТІРКЕЛГІ</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-.045em]">Жеке тіркелгіңізге кіріңіз.</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-[#766e66]">
                  Жалғастыру үшін тіркелгі деректеріңізді енгізіңіз.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block">
                  <span className="text-xs font-extrabold text-[#3f3832]">Email</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#e7e0d8] bg-[#fcfbf9] px-4 py-3.5 text-sm font-medium outline-none transition-all duration-300 placeholder:text-[#b1a79f] focus:border-[#ff6f2c] focus:bg-white focus:ring-4 focus:ring-[#ff6f2c]/10"
                    placeholder="Email мекенжайын енгізіңіз"
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
                Аккаунтыңыз жоқ па?{" "}
                <Link href="/register" className="font-extrabold text-[#ff6f2c] hover:underline">
                  Тіркелу
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
