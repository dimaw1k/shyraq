"use client";

import { FormEvent, useState } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatKzPhone, isValidKzPhone } from "@/lib/phone";

const montserrat = Montserrat({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

type FormState = {
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  age: string;
  educationType: string;
  password: string;
  confirmPassword: string;
};

type ErrorState = Partial<Record<keyof FormState, string>> & { form?: string };

const initialForm: FormState = {
  phone: "",
  email: "",
  firstName: "",
  lastName: "",
  age: "",
  educationType: "UNIVERSITY",
  password: "",
  confirmPassword: "",
};

function Brand() {
  return (
    <Link href="/" aria-label="Shyraq" className="inline-flex items-center">
      <span className="text-[24px] font-extrabold tracking-[-0.075em] text-[#172235]">
        SHYR<span className="text-[var(--accent)]">A</span>Q
      </span>
    </Link>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<ErrorState>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  function validate(): ErrorState {
    const next: ErrorState = {};

    if (!isValidKzPhone(form.phone)) next.phone = "Телефон нөмірін толық енгізіңіз.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Email мекенжайын дұрыс енгізіңіз.";
    if (form.firstName.trim().length < 2) next.firstName = "Атыңызды дұрыс енгізіңіз.";
    if (form.lastName.trim().length < 2) next.lastName = "Тегіңізді дұрыс енгізіңіз.";

    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 10 || age > 100) next.age = "Жасыңызды дұрыс енгізіңіз.";
    if (form.password.length < 8) next.password = "Құпиясөз кемінде 8 таңба болуы керек.";
    if (form.password !== form.confirmPassword) next.confirmPassword = "Құпиясөздер сәйкес емес.";

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          age: form.age,
          educationType: form.educationType,
          password: form.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const nextErrors: ErrorState = {};
        if (result.field && result.field !== "form") {
          nextErrors[result.field as keyof FormState] = result.error;
        } else {
          nextErrors.form = result.error ?? "Тіркелу кезінде қате болды.";
        }
        setErrors(nextErrors);
        setLoading(false);
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (signInError) {
        setErrors({ form: "Тіркелгі жасалды. Кіру беті арқылы тіркелгіңізге кіріп көріңіз." });
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Тіркелу кезінде байланыс қатесі болды. Қайта көріңіз." });
      setLoading(false);
    }
  }

  const inputClass = (key: keyof FormState) =>
    "mt-1.5 min-h-11 w-full rounded-[15px] border " +
    (errors[key] ? "border-red-300 bg-red-50/40" : "border-[#e7e0d8] bg-[#fcfbf9]") +
    " px-4 py-3 text-sm font-medium outline-none transition-all duration-200 focus:border-[var(--accent)] focus:bg-white focus:ring-4 focus:ring-[rgba(255,128,0,.10)]";

  const errorText = (key: keyof FormState) =>
    errors[key] ? <p className="mt-1.5 text-[11px] font-semibold leading-4 text-red-600">{errors[key]}</p> : null;

  return (
    <main className={montserrat.className + " min-h-screen overflow-hidden bg-[#FAF9F7] text-[#172235]"}>
      <div className="absolute inset-x-0 top-0 h-[390px] bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,.9),transparent_32%),linear-gradient(135deg,#fff3eb_0%,#ffe0d0_48%,#ffc09d_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 sm:px-7 lg:px-8">
        <div className="flex items-center justify-between">
          <Brand />
          <Link
            href="/login"
            className="rounded-full border border-white/80 bg-white/85 px-4 py-2.5 text-xs font-extrabold shadow-[0_8px_26px_rgba(20,20,20,.07)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Кіру
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-7 sm:py-9">
          <div className="w-full max-w-[860px]">
            <div className="grid overflow-hidden rounded-[30px] border border-white/80 bg-white/90 p-3 shadow-[0_28px_90px_rgba(39,25,17,.10)] backdrop-blur-xl lg:grid-cols-[.88fr_1.12fr] lg:p-4">
              <section className="order-2 rounded-[24px] bg-[#172235] p-5 text-white sm:p-6 lg:order-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/65">
                  <Sparkles size={12} className="text-[#ff9800]" />
                  SHYRAQ
                </div>
                <h1 className="mt-5 text-[30px] font-extrabold leading-[1.03] tracking-[-.05em] sm:text-[36px]">
                  Күнде аздап.
                  <span className="block text-[var(--accent)]">21 күнде нәтиже.</span>
                </h1>
                <p className="mt-3 text-[12px] font-medium leading-5 text-white/62">
                  Сабақ, тапсырма және прогресс — бір жерде.
                </p>

                <div className="mt-5 space-y-2.5">
                  {["Күнделікті тапсырмалар", "Сабақтар және оқу жоспары", "Ұпай, серия және рейтинг"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-xs font-semibold text-white/75">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] bg-[var(--accent)] text-white">
                        <Check size={14} />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[18px] border border-white/8 bg-white/[.04] p-3.5">
                  <p className="text-[9px] font-extrabold uppercase tracking-[.17em] text-white/35">АККАУНТ</p>
                  <p className="mt-1.5 text-[12px] font-semibold leading-5 text-white/78">
                    Тіркелуді аяқтаған соң платформаға бірден өтесіз.
                  </p>
                </div>
              </section>

              <section className="order-1 p-2 sm:p-4 lg:order-2 lg:px-5 lg:py-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[var(--accent)]">ТІРКЕЛУ</p>
                <h2 className="mt-2 text-[29px] font-extrabold tracking-[-.045em] sm:text-[34px]">
                  Жеке тіркелгіңізді ашыңыз.
                </h2>
                <p className="mt-2 text-[12px] font-medium leading-5 text-[#766e66]">
                  Негізгі деректерді енгізіп, Shyraq-қа қосылыңыз.
                </p>

                <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <label className="block text-xs font-extrabold text-[#3f3832]">
                    Телефон
                    <input
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => updateField("phone", formatKzPhone(event.target.value))}
                      placeholder="+7 (700) 000 00 00"
                      maxLength={18}
                      className={inputClass("phone")}
                    />
                    {errorText("phone")}
                  </label>

                  <label className="block text-xs font-extrabold text-[#3f3832]">
                    Email
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="you@example.com"
                      className={inputClass("email")}
                    />
                    {errorText("email")}
                  </label>

                  <label className="block text-xs font-extrabold text-[#3f3832]">
                    Аты
                    <input
                      required
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(event) => updateField("firstName", event.target.value)}
                      placeholder="Атыңызды енгізіңіз"
                      className={inputClass("firstName")}
                    />
                    {errorText("firstName")}
                  </label>

                  <label className="block text-xs font-extrabold text-[#3f3832]">
                    Тегі
                    <input
                      required
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(event) => updateField("lastName", event.target.value)}
                      placeholder="Тегіңізді енгізіңіз"
                      className={inputClass("lastName")}
                    />
                    {errorText("lastName")}
                  </label>

                  <label className="block text-xs font-extrabold text-[#3f3832]">
                    Жасы
                    <input
                      required
                      min={10}
                      max={100}
                      type="number"
                      value={form.age}
                      onChange={(event) => updateField("age", event.target.value)}
                      placeholder="Жасыңыз"
                      className={inputClass("age")}
                    />
                    {errorText("age")}
                  </label>

                  <label className="block text-xs font-extrabold text-[#3f3832]">
                    Білім алу деңгейі
                    <select
                      value={form.educationType}
                      onChange={(event) => updateField("educationType", event.target.value)}
                      className={inputClass("educationType")}
                    >
                      <option value="SCHOOL">Мектеп</option>
                      <option value="COLLEGE">Колледж</option>
                      <option value="UNIVERSITY">Университет</option>
                      <option value="OTHER">Басқа</option>
                    </select>
                  </label>

                  <label className="block text-xs font-extrabold text-[#3f3832]">
                    Құпиясөз
                    <div className="relative mt-1.5">
                      <input
                        required
                        minLength={8}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        placeholder="Кемінде 8 таңба"
                        className={inputClass("password") + " pr-12"}
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
                    {errorText("password")}
                  </label>

                  <label className="block text-xs font-extrabold text-[#3f3832]">
                    Құпиясөзді қайталаңыз
                    <div className="relative mt-1.5">
                      <input
                        required
                        minLength={8}
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={(event) => updateField("confirmPassword", event.target.value)}
                        placeholder="Қайта енгізіңіз"
                        className={inputClass("confirmPassword") + " pr-12"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-label={showConfirmPassword ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#887d73] transition hover:bg-[#f4eee8] hover:text-[#172235]"
                      >
                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errorText("confirmPassword")}
                  </label>

                  {errors.form ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 sm:col-span-2">
                      {errors.form}
                    </div>
                  ) : null}

                  <button
                    disabled={loading}
                    type="submit"
                    className="group mt-1 flex min-h-11 items-center justify-center gap-2 rounded-[15px] bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(255,128,0,.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                  >
                    {loading ? "Тіркелу..." : "Аккаунт ашу"}
                    {!loading ? <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" /> : null}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs font-medium text-[#837970]">
                  Аккаунтыңыз бар ма?{" "}
                  <Link href="/login" className="font-extrabold text-[var(--accent)] hover:underline">
                    Кіру
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
