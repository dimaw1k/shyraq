"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useStudentLanguage } from "@/lib/student-language";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  if (!imageBanners.length) return null;

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
