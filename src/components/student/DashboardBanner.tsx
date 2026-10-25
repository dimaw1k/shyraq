"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useStudentLanguage } from "@/lib/student-language";
import { ChevronLeft, ChevronRight, ImagePlus } from "lucide-react";

export type DashboardBannerItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  href: string | null;
};

export function DashboardBanner({ banners }: { banners: DashboardBannerItem[] }) {
  const { t } = useStudentLanguage("kk");
  const trackRef = useRef<HTMLDivElement>(null);
  const imageBanners = banners.filter((banner) => Boolean(banner.imageUrl));

  const scroll = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction === "next" ? track.clientWidth * 0.92 : -track.clientWidth * 0.92,
      behavior: "smooth",
    });
  };

  if (!imageBanners.length) {
    return (
      <section className="shrq-dashboard-banner" aria-label={t("banners")}>
        <div className="grid min-h-[112px] w-full place-items-center rounded-[18px] border border-dashed border-[#E7E0D8] bg-gradient-to-r from-white via-[#FFFCF9] to-[#FFF1E2] px-4 py-5 text-center">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-white text-[#FF8000] shadow-sm">
              <ImagePlus size={18} />
            </span>
            <span className="text-left">
              <span className="block text-[12px] font-extrabold text-[#172235]">Ақпараттық баннер</span>
              <span className="mt-1 block text-[10px] font-medium leading-5 text-[#8B8179]">
                Жарияланған баннер болса, ол осы жерде көрсетіледі.
              </span>
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="shrq-dashboard-banner" aria-label={t("banners")}>
      <div ref={trackRef} className="shrq-dashboard-banner-track">
        {imageBanners.map((banner) => {
          const card = (
            <div className="shrq-dashboard-banner-card">
              <Image
                src={banner.imageUrl!}
                alt=""
                fill
                sizes="(max-width: 767px) 84vw, 50vw"
                priority
                className="shrq-dashboard-banner-image"
                draggable={false}
              />
            </div>
          );

          if (!banner.href) {
            return (
              <div key={banner.id} className="shrq-dashboard-banner-item">
                {card}
              </div>
            );
          }

          const external = banner.href.startsWith("http://") || banner.href.startsWith("https://");

          return external ? (
            <a
              key={banner.id}
              href={banner.href}
              target="_blank"
              rel="noreferrer"
              className="shrq-dashboard-banner-item"
              aria-label={t("openBanner")}
            >
              {card}
            </a>
          ) : (
            <Link
              key={banner.id}
              href={banner.href}
              className="shrq-dashboard-banner-item"
              aria-label={t("openBanner")}
            >
              {card}
            </Link>
          );
        })}
      </div>

      {imageBanners.length > 1 ? (
        <>
          <button
            type="button"
            aria-label={t("previousBanner")}
            onClick={() => scroll("prev")}
            className="shrq-dashboard-banner-arrow shrq-dashboard-banner-arrow--prev"
          >
            <ChevronLeft size={17} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label={t("nextBanner")}
            onClick={() => scroll("next")}
            className="shrq-dashboard-banner-arrow shrq-dashboard-banner-arrow--next"
          >
            <ChevronRight size={17} strokeWidth={2.2} />
          </button>
        </>
      ) : null}
    </section>
  );
}
