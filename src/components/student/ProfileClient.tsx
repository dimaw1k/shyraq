"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { useStudentLanguage } from "@/lib/student-language";
import { studentText } from "@/lib/student-translations";
import { formatKzPhone } from "@/lib/phone";

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
  "mt-2 w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-medium text-[#172235] outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-[18px] border border-[#EEE7E0] bg-[#FFFCF9] p-5 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={t("profilePhoto")}
              width={96}
              height={96}
              className="h-24 w-24 rounded-[28px] object-cover ring-4 ring-[#FFF1E2]"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-[28px] bg-[#172235] text-xl font-extrabold text-white ring-4 ring-[#FFF1E2]">
              {initials}
            </div>
          )}

          <label className="absolute -bottom-2 -right-2 grid h-10 w-10 cursor-pointer place-items-center rounded-full border-4 border-white bg-[#FF8000] text-white shadow-lg">
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
          <h2 className="mt-1 text-xl font-extrabold text-[#172235]">{profile.full_name}</h2>
          <p className="mt-1 text-xs text-[#8B8179]">{getRoleLabel(profile.role, t)} · {getStatusLabel(profile.status, t)}</p>
          <div className="mt-3 grid gap-1.5 text-[10px] font-semibold text-[#8B8179] sm:grid-cols-2 sm:gap-x-6">
            <p>{t("teamLabel")}: {teamText}</p>
            {profile.mentor_name ? <p>{t("mentorLabel")}: {profile.mentor_name}</p> : null}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-[11px] font-extrabold text-[#3F3832] sm:col-span-2">
          {t("fullName")}
          <input
            required
            value={form.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="text-[11px] font-extrabold text-[#3F3832] sm:col-span-2">
          {t("email")}
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            className={inputClass}
          />
          <span className="mt-1.5 block text-[10px] font-medium text-[#9A9189]">{t("emailUpdateHint")}</span>
        </label>

        <label className="text-[11px] font-extrabold text-[#3F3832]">
          {t("phone")}
          <input
            required
            value={formatKzPhone(form.phone)}
            onChange={(event) => setField("phone", formatKzPhone(event.target.value))}
            className={inputClass}
            inputMode="tel"
          />
        </label>

        <label className="text-[11px] font-extrabold text-[#3F3832] sm:col-span-2">
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

        <div className="sm:col-span-2 rounded-[16px] border border-[#E8E1DA] bg-[#FAF7F3] p-4">
          <p className="text-[11px] font-extrabold text-[#172235]">{t("password")}</p>
          <p className="mt-1 text-[10px] font-medium text-[#8B8179]">{t("passwordChangeHint")}</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#5B534C]">
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
            "rounded-[14px] border px-4 py-3 text-xs font-semibold sm:col-span-2",
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
          className="sm:col-span-2 rounded-[14px] bg-[#FF8000] px-4 py-3 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(255,128,0,.16)] transition hover:bg-[#E56F00] disabled:opacity-50"
        >
          {loading ? t("saving") : t("saveChanges")}
        </button>
      </form>
    </div>
  );
}
