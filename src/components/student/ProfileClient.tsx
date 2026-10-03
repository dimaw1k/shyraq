"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { uiLabel } from "@/lib/ui-labels";
import { Camera, Loader2 } from "lucide-react";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  education_type: string;
  status: string;
  role: string;
  avatar_url?: string | null;
  team_name?: string | null;
  mentor_name?: string | null;
};

const inputClass =
  "mt-2 w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-medium text-[#172235] outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10";

export function ProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", age: "", educationType: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const response = await fetch("/api/student/profile");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "Профиль жүктелмеді.");
      return;
    }

    setProfile(data.profile);
    setForm({
      fullName: data.profile.full_name ?? "",
      phone: data.profile.phone ?? "",
      age: String(data.profile.age ?? ""),
      educationType: data.profile.education_type ?? "OTHER",
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error ?? "Профиль жаңартылмады.");

      setProfile(data.profile);
      setMessage("Профиль жаңартылды.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате.");
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

      const response = await fetch("/api/student/avatar", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error ?? "Фото жүктелмеді.");

      setProfile((current) => current ? { ...current, avatar_url: data.avatarUrl } : current);
      setMessage("Профиль суреті жаңартылды.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Фото жүктелмеді.");
    } finally {
      setUploading(false);
    }
  }

  if (!profile) return <div className="text-sm font-semibold text-[#8B8179]">Профиль жүктелуде...</div>;

  const initials = profile.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("") || "S";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
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

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF8000]">ПРОФИЛЬ</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#172235]">{profile.full_name}</h2>
          <p className="mt-1 text-xs text-[#8B8179]">{profile.email} · {uiLabel(profile.status)}</p>
          <p className="mt-1 text-[10px] font-semibold text-[#8B8179]">
            Команда: {profile.team_name ?? "Күтілуде"} · Ментор: {profile.mentor_name ?? "Тағайындалмаған"}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-[11px] font-extrabold text-[#3F3832] sm:col-span-2">
          Аты-жөні
          <input required value={form.fullName} onChange={(event) => setForm((s) => ({ ...s, fullName: event.target.value }))} className={inputClass} />
        </label>

        <label className="text-[11px] font-extrabold text-[#3F3832]">
          Телефон
          <input required value={form.phone} onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))} className={inputClass} />
        </label>

        <label className="text-[11px] font-extrabold text-[#3F3832]">
          Жасы
          <input required min="10" max="100" type="number" value={form.age} onChange={(event) => setForm((s) => ({ ...s, age: event.target.value }))} className={inputClass} />
        </label>

        <label className="text-[11px] font-extrabold text-[#3F3832] sm:col-span-2">
          Білім алу деңгейі
          <select value={form.educationType} onChange={(event) => setForm((s) => ({ ...s, educationType: event.target.value }))} className={inputClass}>
            <option value="SCHOOL">Мектеп</option>
            <option value="COLLEGE">Колледж</option>
            <option value="UNIVERSITY">Университет</option>
            <option value="OTHER">Басқа</option>
          </select>
        </label>

        {message ? (
          <div className="rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 text-xs font-semibold text-[#5C5149] sm:col-span-2">
            {message}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="sm:col-span-2 rounded-[14px] bg-[#FF8000] px-4 py-3 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(255,128,0,.16)] transition hover:bg-[#E56F00] disabled:opacity-50"
        >
          {loading ? "Сақталуда..." : "Өзгерістерді сақтау"}
        </button>
      </form>
    </div>
  );
}
