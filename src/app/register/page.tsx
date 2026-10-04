"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { formatKzPhone, isValidKzPhone } from "@/lib/phone";

type FormState = {
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  age: string;
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
  password: "",
  confirmPassword: "",
};

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
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Электрондық пошта мекенжайын дұрыс енгізіңіз.";
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

      const email = form.email.trim().toLowerCase();
      router.push(`/login?registered=1&email=${encodeURIComponent(email)}`);
    } catch {
      setErrors({ form: "Тіркелу кезінде байланыс қатесі болды. Қайта көріңіз." });
      setLoading(false);
    }
  }

  const inputClass = (key: keyof FormState) =>
    "mt-2 w-full rounded-2xl border " +
    (errors[key] ? "border-red-300 bg-red-50/40" : "border-[#e7e0d8] bg-[#fcfbf9]") +
    " px-4 py-3.5 text-sm font-medium outline-none transition-all duration-300 focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10";

  const errorText = (key: keyof FormState) =>
    errors[key] ? <p className="mt-1.5 text-[11px] font-semibold leading-4 text-red-600">{errors[key]}</p> : null;

  return (
    <main className="min-h-[100dvh] bg-[#FAF9F7] text-[#172235]">
      <div className="flex min-h-[100dvh] items-center justify-center px-3.5 py-5 sm:px-6">
        <div className="w-full max-w-[760px]">
          <div className="mb-6 flex items-center justify-between">
            <Brand />
            <Link
              href="/login"
              className="rounded-full border border-[#E7E0D8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4A423B] shadow-[0_6px_18px_rgba(23,34,53,.04)] transition hover:-translate-y-0.5 hover:border-[#FFB067] hover:bg-[#FFF8F1]"
            >
              Кіру
            </Link>
          </div>

          <section className="rounded-[24px] border border-[#E7E0D8] bg-white p-5 shadow-[0_24px_70px_rgba(23,34,53,.08)] sm:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">ТІРКЕЛУ</p>
            <h1 className="mt-2 text-[28px] font-extrabold tracking-[-.045em] sm:text-[36px]">Аккаунт ашыңыз.</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-[#766E66]">
              Деректеріңізді енгізіп, Shyraq платформасына қосылыңыз.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-extrabold text-[#3F3832]">
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

              <label className="block text-xs font-extrabold text-[#3F3832]">
                Электрондық пошта
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

              <label className="block text-xs font-extrabold text-[#3F3832]">
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

              <label className="block text-xs font-extrabold text-[#3F3832]">
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

              <label className="block text-xs font-extrabold text-[#3F3832]">
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

              <label className="block text-xs font-extrabold text-[#3F3832]">
                Құпиясөз
                <div className="relative mt-2">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#887D73] transition hover:bg-[#FFF1E2] hover:text-[#172235]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errorText("password")}
              </label>

              <label className="block text-xs font-extrabold text-[#3F3832]">
                Құпиясөзді қайталаңыз
                <div className="relative mt-2">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#887D73] transition hover:bg-[#FFF1E2] hover:text-[#172235]"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errorText("confirmPassword")}
              </label>

              {errors.form ? (
                <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 sm:col-span-2">
                  {errors.form}
                </div>
              ) : null}

              <button
                disabled={loading}
                type="submit"
                className="group mt-1 flex items-center justify-center gap-2 rounded-[16px] bg-[#FF8000] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(255,128,0,.20)] transition-all hover:-translate-y-0.5 hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              >
                {loading ? "Тіркелу..." : "Аккаунт ашу"}
                {!loading ? <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /> : null}
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-medium text-[#837970]">
              Аккаунтыңыз бар ма?{" "}
              <Link href="/login" className="font-extrabold text-[#FF8000] hover:underline">
                Кіру
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
