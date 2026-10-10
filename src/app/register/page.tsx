"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, User, UserPlus } from "lucide-react";
import { formatKzPhone, isValidKzPhone } from "@/lib/phone";
import { getPasswordValidationError } from "@/lib/security/password";
import { useStudentLanguage } from "@/lib/student-language";
import { AuthLanguagePicker } from "@/components/auth/AuthLanguagePicker";

type FormState = {
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
};

type ErrorState = Partial<Record<keyof FormState, string>> & { form?: string };

const initialForm: FormState = {
  phone: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useStudentLanguage("kk");
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

    if (!isValidKzPhone(form.phone)) next.phone = t("invalidPhone");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = t("invalidEmail");
    if (form.firstName.trim().length < 2) next.firstName = t("invalidFirstName");
    if (form.lastName.trim().length < 2) next.lastName = t("invalidLastName");

    const passwordError = getPasswordValidationError(form.password, [
      form.firstName,
      form.lastName,
      form.email.split("@")[0] ?? "",
      form.phone.replace(/\D/g, ""),
    ]);
    if (passwordError) next.password = t("passwordMin");
    if (form.password !== form.confirmPassword) next.confirmPassword = t("passwordMismatch");

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
          password: form.password,
          website: "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const nextErrors: ErrorState = {};
        if (result.field && result.field !== "form") {
          nextErrors[result.field as keyof FormState] = result.error;
        } else {
          nextErrors.form = result.error ?? t("registerError");
        }
        setErrors(nextErrors);
        setLoading(false);
        return;
      }

      const email = form.email.trim().toLowerCase();
      router.push(`/login?registered=1&email=${encodeURIComponent(email)}`);
    } catch {
      setErrors({ form: t("registerConnectionError") });
      setLoading(false);
    }
  }

  const inputClass = (key: keyof FormState) =>
    "w-full rounded-[13px] border bg-[#FCFBF9] py-[11px] pl-10 pr-3.5 text-[13px] font-medium outline-none transition " +
    (errors[key]
      ? "border-red-300 bg-red-50/40"
      : "border-[#E7E0D8]") +
    " focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10";

  const errorText = (key: keyof FormState) =>
    errors[key] ? <p className="mt-1 pl-1 text-[10px] font-semibold leading-4 text-red-600">{errors[key]}</p> : null;

  return (
    <main className="min-h-[100dvh] bg-[#FAF9F7] px-4 py-8 text-[#172235]">
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <section className="w-full max-w-[467px] relative rounded-[26px] border border-[#E7E0D8] bg-white px-[18px] py-[21px] shadow-[0_20px_55px_rgba(23,34,53,.06)] sm:px-[25px] sm:py-[25px]">
          <div className="flex flex-col items-center text-center">
            <AuthLanguagePicker />
            <div className="grid h-[52px] w-[52px] place-items-center rounded-[16px] border border-[#E8E1D8] bg-[#FFF7F1] text-[#FF8000] shadow-[0_10px_24px_rgba(255,128,0,.10)]">
              <UserPlus size={21} strokeWidth={2.2} />
            </div>

            <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">{t("registerUpper")}</p>
            <h1 className="mt-1.5 text-[24px] font-extrabold leading-none tracking-[-.05em] sm:text-[26px]">
              {t("registrationHeading")}
            </h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-2.5">
            <input
              type="text"
              name="website"
              value=""
              onChange={() => undefined}
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              className="absolute left-[-9999px] top-auto h-0 w-0 opacity-0"
            />


            <label className="block">
              <span className="sr-only">{t("firstName")}</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]" size={16} />
                <input
                  required
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder={t("firstName")}
                  className={inputClass("firstName")}
                />
              </div>
              {errorText("firstName")}
            </label>

            <label className="block">
              <span className="sr-only">{t("lastName")}</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]" size={16} />
                <input
                  required
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder={t("lastName")}
                  className={inputClass("lastName")}
                />
              </div>
              {errorText("lastName")}
            </label>

            <label className="block">
              <span className="sr-only">{t("phone")}</span>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]" size={16} />
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
              </div>
              {errorText("phone")}
            </label>

            <label className="block">
              <span className="sr-only">{t("email")}</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]" size={16} />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                  className={inputClass("email")}
                />
              </div>
              {errorText("email")}
            </label>

                        <label className="block">
              <span className="sr-only">{t("password")}</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]" size={16} />
                <input
                  required
                  minLength={12}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder={t("password")}
                  className={inputClass("password") + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#93877D] transition hover:bg-[#FFF1E2] hover:text-[#172235]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errorText("password")}
            </label>

            <label className="block">
              <span className="sr-only">{t("repeatPassword")}</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A90]" size={16} />
                <input
                  required
                  minLength={8}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  placeholder={t("repeatPassword")}
                  className={inputClass("confirmPassword") + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#93877D] transition hover:bg-[#FFF1E2] hover:text-[#172235]"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errorText("confirmPassword")}
            </label>

            {errors.form ? (
              <div className="rounded-[11px] border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold leading-4 text-red-700">
                {errors.form}
              </div>
            ) : null}

            <button
              disabled={loading}
              type="submit"
              className="group mt-1 flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#FF8000] px-4 py-3 text-[13px] font-extrabold text-white shadow-[0_12px_26px_rgba(255,128,0,.20)] transition-all hover:-translate-y-0.5 hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("registering") : t("createAccount")}
              {!loading ? <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /> : null}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] font-medium text-[#837970]">
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-extrabold text-[#FF8000] hover:underline">
              {t("login")}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
