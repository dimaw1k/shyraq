"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Camera, Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import { setStudentLanguage, useStudentLanguage, type StudentLanguage } from "@/lib/student-language";
import { studentText } from "@/lib/student-translations";
import { formatKzPhone } from "@/lib/phone";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  education_type: string;
  status: string;
  role: string;
  avatar_url?: string | null;
  team_names?: string[];
  mentor_name?: string | null;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-[11px] border border-[#E8E1DA] bg-[#FFFCF9] px-3 py-2 text-[11px] font-semibold text-[#172235] outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10";

const educationOptions = ["SCHOOL", "COLLEGE", "UNIVERSITY", "OTHER"] as const;

function getRoleLabel(role: string, t: (key: string) => string) {
  if (role === "STUDENT") return t("studentRole");
  if (role === "MENTOR") return t("mentor");
  if (role === "CHIEF_MENTOR") return t("chiefMentor");
  if (role === "LEADER") return t("leader");
  return role;
}

function getStatusLabel(status: string, t: (key: string) => string) {
  const labels: Record<string, string> = {
    ACTIVE: t("statusActive"),
    INACTIVE: t("statusInactive"),
    WAITING_FOR_TEAM: t("statusWaiting"),
    REGISTERED: t("statusRegistered"),
    COMPLETED: t("statusCompleted"),
    SUBMITTED: t("statusSubmitted"),
    REVIEWED: t("statusReviewed"),
    REJECTED: t("statusRejected"),
    APPROVED: t("statusApproved"),
    NEW: t("statusNew"),
    IN_PROGRESS: t("statusInProgress"),
    RESOLVED: t("statusResolved"),
    FULL: t("statusFull"),
    ATTENDED: t("statusAttended"),
    ABSENT: t("statusAbsent"),
  };
  return labels[status] ?? status;
}

export function ProfileClient() {
  const router = useRouter();
  const { language, t } = useStudentLanguage("kk");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    educationType: "OTHER",
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/profile", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessageTone("error");
      setMessage(data.error ?? studentText(language, "profileLoadFailed"));
      return;
    }

    setProfile(data.profile);
    setForm((current) => ({
      ...current,
      fullName: data.profile.full_name ?? "",
      email: data.profile.email ?? "",
      phone: data.profile.phone ?? "",
      educationType: data.profile.education_type ?? "OTHER",
      currentPassword: "",
      newPassword: "",
    }));
  }, [language]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          educationType: form.educationType,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error ?? t("profileUpdateFailed"));

      setProfile(data.profile);
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      setMessageTone("ok");
      setMessage(t("profileUpdated"));
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error ?? t("photoUploadFailed"));

      setProfile((current) => current ? { ...current, avatar_url: data.avatarUrl } : current);
      setMessageTone("ok");
      setMessage(t("photoUpdated"));
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : t("photoUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function persistLanguage(nextLanguage: StudentLanguage) {
    try {
      await fetch("/api/student/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: nextLanguage }),
      });
    } catch {
      // The local language stays active even if persistence is temporarily unavailable.
    }
  }

  async function logoutAllDevices() {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (!error) router.replace("/login");
  }

  if (!profile) {
    return <div className="text-sm font-semibold text-[#8B8179]">{t("loadingProfile")}</div>;
  }

  const initials = profile.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("") || "S";

  const teamText = profile.team_names?.length ? profile.team_names.join(", ") : t("unassigned");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-[16px] border border-[#EEE7E0] bg-[#FFFCF9] p-3 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={t("profilePhoto")}
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-[22px] object-cover ring-3 ring-[#FFF1E2]"
            />
          ) : (
            <div className="grid h-[72px] w-[72px] place-items-center rounded-[22px] bg-[#172235] text-lg font-extrabold text-white ring-3 ring-[#FFF1E2]">
              {initials}
            </div>
          )}

          <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-3 border-white bg-[#FF8000] text-white shadow-lg">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF8000]">{t("personalProfile").toUpperCase()}</p>
          <h2 className="mt-0.5 text-[17px] font-extrabold tracking-[-.02em] text-[#172235]">{profile.full_name}</h2>
          <p className="mt-1 text-xs text-[#8B8179]">{getRoleLabel(profile.role, t)} · {getStatusLabel(profile.status, t)}</p>
          <div className="mt-2 grid gap-1 text-[9px] font-semibold text-[#8B8179] sm:grid-cols-2 sm:gap-x-5">
            <p>{t("teamLabel")}: {teamText}</p>
            {profile.mentor_name ? <p>{t("mentorLabel")}: {profile.mentor_name}</p> : null}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-2.5 sm:grid-cols-2">
        <label className="text-[10px] font-extrabold text-[#3F3832]">
          {t("fullName")}
          <input
            required
            value={form.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="text-[10px] font-extrabold text-[#3F3832]">
          {t("email")}
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            className={inputClass}
          />
          <span className="mt-1 block text-[8px] font-medium text-[#9A9189]">{t("emailUpdateHint")}</span>
        </label>

        <label className="text-[10px] font-extrabold text-[#3F3832]">
          {t("phone")}
          <input
            required
            value={formatKzPhone(form.phone)}
            onChange={(event) => setField("phone", formatKzPhone(event.target.value))}
            className={inputClass}
            inputMode="tel"
          />
        </label>

        <label className="text-[10px] font-extrabold text-[#3F3832]">
          {t("educationLevel")}
          <select
            value={form.educationType}
            onChange={(event) => setField("educationType", event.target.value)}
            className={inputClass}
          >
            {educationOptions.map((option) => (
              <option key={option} value={option}>
                {option === "SCHOOL"
                  ? t("school")
                  : option === "COLLEGE"
                    ? t("college")
                    : option === "UNIVERSITY"
                      ? t("university")
                      : t("other")}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2 rounded-[14px] border border-[#E8E1DA] bg-[#FAF7F3] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold text-[#172235]">{t("password")}</p>
              <p className="mt-0.5 text-[8px] font-medium text-[#8B8179]">{t("passwordChangeHint")}</p>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-[9px] font-extrabold text-[#5B534C]">
              {t("currentPassword")}
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={(event) => setField("currentPassword", event.target.value)}
                  className={inputClass + " pr-12"}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8179]" aria-label={t("showPassword")}>
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="text-[10px] font-extrabold text-[#5B534C]">
              {t("newPassword")}
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(event) => setField("newPassword", event.target.value)}
                  className={inputClass + " pr-12"}
                  minLength={8}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8179]" aria-label={t("passwordShowNew")}>
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </div>
        </div>

        {message ? (
          <div className={[
            "rounded-[11px] border px-3 py-2 text-[10px] font-semibold sm:col-span-2",
            messageTone === "ok"
              ? "border-[#D9EEDF] bg-[#F2FAF4] text-[#2E7E58]"
              : "border-[#F2D8D1] bg-[#FFF5F2] text-[#B54D2B]",
          ].join(" ")}>
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="justify-self-start rounded-[11px] bg-[#FF8000] px-4 py-2.5 text-[10px] font-extrabold text-white shadow-[0_8px_18px_rgba(255,128,0,.14)] transition hover:bg-[#E56F00] disabled:opacity-50 sm:col-span-2"
        >
          {loading ? t("saving") : t("saveChanges")}
        </button>

        <div className="sm:col-span-2 flex flex-col gap-2 rounded-[14px] border border-[#E8E1DA] bg-[#FAF7F3] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-extrabold text-[#172235]">{t("language")}</p>
          </div>

          <div className="inline-flex items-center rounded-full border border-[#E7E0D8] bg-white p-0.5 shadow-[0_2px_10px_rgba(23,34,53,.03)]">
            {([
              ["ru", "RU"],
              ["kk", "KZ"],
              ["en", "ENG"],
            ] as Array<[StudentLanguage, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={language === value}
                onClick={() => {
                  setStudentLanguage(value);
                  void persistLanguage(value);
                }}
                className={[
                  "min-w-[42px] rounded-full px-2.5 py-1.5 text-[9px] font-extrabold tracking-[.02em] transition",
                  language === value
                    ? "bg-[#FFF1E2] text-[#D56600] shadow-sm"
                    : "text-[#8B8179] hover:bg-[#FAF7F3] hover:text-[#172235]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logoutAllDevices()}
          className="justify-self-start rounded-[11px] border border-[#E7E0D8] bg-white px-3.5 py-2.5 text-[10px] font-extrabold text-[#B54D2B] transition hover:border-[#E8C2B6] hover:bg-[#FFF7F4] sm:col-span-2"
        >
          <LogOut size={15} />
          {t("allDevices")}
        </button>
      </form>
    </div>
  );
}
