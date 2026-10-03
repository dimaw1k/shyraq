"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type DashboardBannerItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  href: string | null;
};

export function DashboardBanner({ banners }: { banners: DashboardBannerItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) {
    return (
      <div className="overflow-hidden rounded-[30px] border border-[#E8E1DA] bg-[#172235] p-6 text-white shadow-[0_18px_60px_rgba(23,34,53,.12)] sm:p-9">
        <div className="flex min-h-[210px] items-center">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF9A72]">SHYRAQ MARATHON</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-[1.03] tracking-[-.05em] sm:text-5xl">21 күн. 1 бағыт. Күн сайын бір қадам.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">Марафон көшбасшысы жариялаған хабарламалар мен маңызды ақпарат осы жерде шығады.</p>
          </div>
        </div>
      </div>
    );
  }

  const current = banners[index];
  const content = (
    <div className="relative min-h-[260px] overflow-hidden rounded-[30px] border border-white/10 bg-[#172235] shadow-[0_18px_60px_rgba(23,34,53,.16)]">
      {current.imageUrl ? (
        <Image
          src={current.imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 1200px"
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#172235]/95 via-[#172235]/70 to-[#172235]/10" />
      <div className="relative flex min-h-[260px] items-end p-6 sm:p-9">
        <div className="max-w-3xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF9A72]">МАҢЫЗДЫ ХАБАРЛАМА</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-[1.02] tracking-[-.05em] text-white sm:text-5xl">{current.title}</h2>
          {current.description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">{current.description}</p> : null}
          {current.href ? <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-extrabold text-white">Толығырақ <ArrowRight size={14} /></span> : null}
        </div>
      </div>

      {banners.length > 1 ? (
        <div className="absolute bottom-5 right-5 flex items-center gap-2">
          <button type="button" aria-label="Алдыңғы баннер" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setIndex((itemIndex) => (itemIndex - 1 + banners.length) % banners.length); }} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md"><ChevronLeft size={16} /></button>
          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[9px] font-extrabold text-white/80 backdrop-blur-md">{index + 1} / {banners.length}</span>
          <button type="button" aria-label="Келесі баннер" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setIndex((itemIndex) => (itemIndex + 1) % banners.length); }} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md"><ChevronRight size={16} /></button>
        </div>
      ) : null}
    </div>
  );

  if (!current.href) return content;
  const external = current.href.startsWith("http://") || current.href.startsWith("https://");
  return external ? <a href={current.href} target="_blank" rel="noreferrer">{content}</a> : <Link href={current.href}>{content}</Link>;
}
