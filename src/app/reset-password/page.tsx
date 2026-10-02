"use client";

import { FormEvent, useEffect, useState } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
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
        SHYR<span className="text-[#FF8000]">A</span>Q
      </span>
    </Link>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState<"request" | "update">("request");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();
    const code = searchParams.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (!active) return;
        if (exchangeError) {
          setError("Сілтеменің мерзімі өткен. Қайтадан сұрау жіберіңіз.");
          return;
        }
        setMode("update");
      });
      return () => {
        active = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setMode("update");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "PASSWORD_RECOVERY") setMode("update");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [searchParams]);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createBrowserSupabaseClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (resetError) {
      setError("Сілтемені жіберу мүмкін болмады. Email-ды тексеріңіз.");
    } else {
      setMessage("Қалпына келтіру сілтемесі жіберілді.");
    }
    setLoading(false);
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Құпиясөз кемінде 8 таңба болуы керек.");
      return;
    }

    if (password !== confirm) {
      setError("Құпиясөздер сәйкес емес.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Құпиясөзді жаңарту мүмкін болмады. Сілтемені қайта алыңыз.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setMessage("Құпиясөз жаңартылды. Енді кіруге болады.");
    setLoading(false);
    setTimeout(() => router.replace("/login"), 700);
  }

  const inputClass = "mt-2 w-full rounded-2xl border border-[#e7e0d8] bg-[#fcfbf9] px-4 py-3.5 text-sm font-medium outline-none transition-all duration-200 focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10";

  return (
    <main className={montserrat.className + " min-h-screen bg-[#FAF9F7] text-[#172235]"}>
      <div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,.9),transparent_30%),linear-gradient(135deg,#fff1e2_0%,#ffe0c4_52%,#ffbd84_100%)]" />
      <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-7 lg:px-8">
        <div className="flex items-center justify-between">
          <Brand />
          <Link href="/login" className="rounded-full bg-white/85 px-4 py-2.5 text-xs font-extrabold shadow-sm backdrop-blur hover:-translate-y-0.5 transition">Кіру</Link>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-[30px] border border-white/80 bg-white/95 p-6 shadow-[0_30px_90px_rgba(39,25,17,.10)] sm:p-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF1E2] text-[#FF8000]">
            {mode === "request" ? <LockKeyhole size={20} /> : <Check size={20} />}
          </div>

          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">
            {mode === "request" ? "ҚАЛПЫНА КЕЛТІРУ" : "ЖАҢА ҚҰПИЯСӨЗ"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
            {mode === "request" ? "Құпиясөзді қалпына келтіріңіз." : "Жаңа құпиясөз орнатыңыз."}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#766e66]">
            {mode === "request" ? "Email енгізіңіз. Сілтеме сол жерге жіберіледі." : "Жаңа құпиясөзді екі рет енгізіңіз."}
          </p>

          {mode === "request" ? (
            <form onSubmit={requestReset} className="mt-7 space-y-4">
              <label className="block text-xs font-extrabold text-[#3f3832]">
                Email
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
              </label>
              <button disabled={loading} type="submit" className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF8000] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(255,128,0,.20)] transition hover:-translate-y-0.5 hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Жіберілуде..." : "Сілтеме жіберу"}
                {!loading ? <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /> : null}
              </button>
            </form>
          ) : (
            <form onSubmit={updatePassword} className="mt-7 space-y-4">
              <label className="block text-xs font-extrabold text-[#3f3832]">
                Жаңа құпиясөз
                <div className="relative">
                  <input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Кемінде 8 таңба" className={inputClass + " pr-12"} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#887d73] hover:bg-[#f4eee8]" aria-label="Құпиясөзді көрсету">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <label className="block text-xs font-extrabold text-[#3f3832]">
                Құпиясөзді қайталау
                <div className="relative">
                  <input required minLength={8} type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Қайта енгізіңіз" className={inputClass + " pr-12"} />
                  <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#887d73] hover:bg-[#f4eee8]" aria-label="Қайталау құпиясөзін көрсету">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF8000] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(255,128,0,.20)] transition hover:-translate-y-0.5 hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Жаңартылуда..." : "Құпиясөзді жаңарту"}
                {!loading ? <ArrowRight size={16} /> : null}
              </button>
            </form>
          )}

          {error ? <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">{error}</div> : null}
          {message ? <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-700">{message}</div> : null}

          <p className="mt-6 text-center text-xs font-medium text-[#837970]">
            <Link href="/login" className="font-extrabold text-[#FF8000] hover:underline">Кіру бетіне оралу</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
