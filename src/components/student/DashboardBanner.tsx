"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DashboardBannerItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  href: string | null;
};

export function DashboardBanner({ banners }: { banners: DashboardBannerItem[] }) {
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
    <section className="shrq-dashboard-banner" aria-label="Shyraq баннерлері">
      <div ref={trackRef} className="shrq-dashboard-banner-track">
        {imageBanners.map((banner) => {
          const card = (
            <div className="shrq-dashboard-banner-card">
              <img
                src={banner.imageUrl!}
                alt=""
                loading="eager"
                decoding="async"
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
              aria-label="Баннерді ашу"
            >
              {card}
            </a>
          ) : (
            <Link
              key={banner.id}
              href={banner.href}
              className="shrq-dashboard-banner-item"
              aria-label="Баннерді ашу"
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
            aria-label="Алдыңғы баннер"
            onClick={() => scroll("prev")}
            className="shrq-dashboard-banner-arrow shrq-dashboard-banner-arrow--prev"
          >
            <ChevronLeft size={17} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label="Келесі баннер"
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
