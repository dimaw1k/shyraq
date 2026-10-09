"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import { formatKzDateTime, parseKzDateTime, StaffDateTimeField, StaffModal } from "@/components/staff/StaffUI";

type Banner = {
  id: string;
  title: string;
  description: string | null;
  image_path: string;
  imageUrl: string;
  href: string | null;
  published: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
};

export function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [open, setOpen] = useState(false);
  const [banners, setBanners] = useState(initialBanners);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function reset() {
    setStartsAt("");
    setEndsAt("");
    setFile(null);
    setMessage("");
  }

  async function create() {
    if (!file) {
      setMessage("Суретті таңдаңыз.");
      return;
    }
    if (file.size <= 0 || file.size > 4 * 1024 * 1024) {
      setMessage("Banner 4 MB-тан аспауы керек.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("JPG, PNG немесе WebP ғана рұқсат.");
      return;
    }

    const startsAtIso = parseKzDateTime(startsAt);
    const endsAtIso = parseKzDateTime(endsAt);

    if (startsAtIso === undefined || endsAtIso === undefined) {
      setMessage("Күн мен уақытты 12.09.2026 15:00:00 форматында енгізіңіз.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name.replace(/\.[^/.]+$/, "") || "Баннер");
      form.append("startsAt", startsAtIso ?? "");
      form.append("endsAt", endsAtIso ?? "");
      form.append("published", "true");

      const response = await fetch("/api/leader/banners", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error ?? "Баннер қосылмады.");
        return;
      }

      setOpen(false);
      reset();
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function toggle(banner: Banner) {
    const response = await fetch("/api/leader/banners/" + banner.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !banner.published }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setBanners((current) =>
        current.map((item) => item.id === banner.id ? { ...item, ...data.banner } : item),
      );
    }
  }

  async function remove(id: string) {
    const response = await fetch("/api/leader/banners/" + id, { method: "DELETE" });
    if (response.ok) setBanners((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="rounded-[20px] border border-[#E8E1DA] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#FFF1E2] text-[#FF8000]">
            <ImagePlus size={16} />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#FF8000]">БАННЕР</p>
            <h2 className="mt-1 text-[16px] font-extrabold text-[#172235]">Экран баннерлері</h2>
          </div>
        </div>
        <PrimaryButton type="button" onClick={() => { setMessage(""); setOpen(true); }}>
          <Plus size={14} />
          Баннер қосу
        </PrimaryButton>
      </div>

      <div className="mt-4 grid gap-2">
        {banners.map((banner) => (
          <div key={banner.id} className="grid gap-3 rounded-[15px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 sm:grid-cols-[120px_1fr_auto_auto] sm:items-center">
            <Image src={banner.imageUrl} alt="" width={120} height={64} sizes="120px" className="h-16 w-full rounded-[10px] object-cover sm:w-[120px]" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-extrabold text-[#172235]">{banner.title}</p>
              <p className="mt-1 text-[9px] font-semibold text-[#8B8179]">
                {banner.starts_at ? formatKzDateTime(banner.starts_at) : "Уақыт белгіленбеген"}
                {banner.ends_at ? " — " + formatKzDateTime(banner.ends_at) : ""}
              </p>
            </div>
            <button type="button" onClick={() => void toggle(banner)} className="h-9 rounded-[10px] border border-[#E8E1DA] bg-white px-3 text-[9px] font-extrabold text-[#4B433C]">
              {banner.published ? "Жасыру" : "Жариялау"}
            </button>
            <button type="button" onClick={() => void remove(banner.id)} className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#E8D3CB] text-[#B54D2B]" aria-label="Баннерді өшіру">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {!banners.length ? <div className="rounded-[14px] border border-dashed border-[#DED6CE] px-5 py-7 text-center text-[10px] font-semibold text-[#9A9189]">Баннер жоқ.</div> : null}
      </div>

      <StaffModal open={open} onClose={() => { if (!loading) setOpen(false); }} title="Жаңа баннер" description="Суретті жүктеп, көрсету аралығын енгізіңіз.">
        <div className="grid gap-4">
          <label className="text-[10px] font-extrabold text-[#5B534C]">
            Сурет
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1.5 block w-full rounded-[14px] border border-dashed border-[#DCCFC5] bg-white px-3 py-3 text-[10px] font-semibold"
            />
            {file ? <span className="mt-1 block truncate text-[9px] text-[#8B8179]">{file.name}</span> : null}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-extrabold text-[#5B534C]">Көрсету басталуы</p>
              <div className="mt-1.5"><StaffDateTimeField value={startsAt} onChange={setStartsAt} label="Көрсету басталуы" /></div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#5B534C]">Көрсету аяқталуы</p>
              <div className="mt-1.5"><StaffDateTimeField value={endsAt} onChange={setEndsAt} label="Көрсету аяқталуы" /></div>
            </div>
          </div>

          {message ? <p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-bold text-[#B95D00]">{message}</p> : null}

          <div className="flex justify-end">
            <PrimaryButton type="button" onClick={() => void create()} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Баннерді сақтау
            </PrimaryButton>
          </div>
        </div>
      </StaffModal>
    </section>
  );
}
