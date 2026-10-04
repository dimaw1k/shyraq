"use client";

import Image from "next/image";
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

  const scroll = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction === "next" ? track.clientWidth * 0.84 : -track.clientWidth * 0.84,
      behavior: "smooth",
    });
  };

  const imageBanners = banners.filter((banner) => Boolean(banner.imageUrl));

  if (!imageBanners.length) return null;

  return (
    <section className="relative w-full" aria-label="Shyraq баннерлері">
      <div
        ref={trackRef}
        className="flex w-full gap-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-1 pr-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {imageBanners.map((banner) => {
          const content = (
            <div className="relative aspect-[16/9] w-[82vw] max-w-[620px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-[#E8E1DA] bg-[#F4F1EC] shadow-[0_10px_28px_rgba(23,34,53,.04)] sm:w-[calc(50vw_-_28px)] lg:w-[calc(50%_-_8px)]">
              <Image
                src={banner.imageUrl!}
                alt=""
                fill
                sizes="(max-width: 640px) 82vw, (max-width: 1280px) 48vw, 46vw"
                className="object-cover"
                draggable={false}
                priority={imageBanners.indexOf(banner) < 2}
                unoptimized
              />
            </div>
          );

          if (!banner.href) return <div key={banner.id}>{content}</div>;

          const external =
            banner.href.startsWith("http://") || banner.href.startsWith("https://");

          return external ? (
            <a
              key={banner.id}
              href={banner.href}
              target="_blank"
              rel="noreferrer"
              className="block shrink-0"
              aria-label="Баннерді ашу"
            >
              {content}
            </a>
          ) : (
            <Link key={banner.id} href={banner.href} className="block shrink-0" aria-label="Баннерді ашу">
              {content}
            </Link>
          );
        })}
      </div>

      {imageBanners.length > 2 ? (
        <>
          <button
            type="button"
            aria-label="Алдыңғы баннерлер"
            onClick={() => scroll("prev")}
            className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/95 text-[#172235] shadow-[0_8px_22px_rgba(23,34,53,.12)] transition hover:scale-105 hover:text-[#FF8000]"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            aria-label="Келесі баннерлер"
            onClick={() => scroll("next")}
            className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/95 text-[#172235] shadow-[0_8px_22px_rgba(23,34,53,.12)] transition hover:scale-105 hover:text-[#FF8000]"
          >
            <ChevronRight size={17} />
          </button>
        </>
      ) : null}
    </section>
  );
}
