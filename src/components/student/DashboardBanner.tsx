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
    }, 7000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) {
    return (
      <div className="overflow-hidden rounded-[22px] border border-[#E8E1DA] bg-white">
        <div className="flex min-h-[150px] items-center px-5 py-5 sm:min-h-[170px] sm:px-7">
          <div className="max-w-2xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
              SHYRAQ MARATHON
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-[1.05] tracking-[-.045em] text-[#172235] sm:text-3xl">
              21 күн. 1 бағыт. Күн сайын бір қадам.
            </h2>
            <p className="mt-2 max-w-lg text-xs leading-5 text-[#8B8179]">
              Маңызды хабарламалар осы жерде көрсетіледі.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const current = banners[index];

  const content = (
    <div className="relative overflow-hidden rounded-[22px] border border-[#E8E1DA] bg-white">
      <div className="grid min-h-[150px] sm:min-h-[170px] lg:grid-cols-[1.05fr_1.45fr]">
        <div className="order-2 flex min-w-0 items-center px-5 py-5 sm:px-7 lg:order-1">
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000] sm:text-[10px]">
              МАҢЫЗДЫ ХАБАРЛАМА
            </p>
            <h2 className="mt-2 line-clamp-2 text-xl font-extrabold leading-[1.05] tracking-[-.04em] text-[#172235] sm:text-2xl">
              {current.title}
            </h2>
            {current.description ? (
              <p className="mt-2 line-clamp-2 max-w-xl text-[11px] font-medium leading-5 text-[#8B8179] sm:text-xs">
                {current.description}
              </p>
            ) : null}
            {current.href ? (
              <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#FF8000]">
                Толығырақ <ArrowRight size={13} />
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative order-1 min-h-[130px] bg-[#F4F1EC] lg:order-2 lg:min-h-0">
          {current.imageUrl ? (
            <Image
              src={current.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[#FFF1E2]" />
          )}
        </div>
      </div>

      {banners.length > 1 ? (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Алдыңғы баннер"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIndex((itemIndex) => (itemIndex - 1 + banners.length) % banners.length);
            }}
            className="grid h-7 w-7 place-items-center rounded-full border border-[#E8E1DA] bg-white text-[#5F5750] shadow-[0_3px_10px_rgba(23,34,53,.06)] transition hover:border-[#FFB067] hover:text-[#FF8000]"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="rounded-full border border-[#E8E1DA] bg-white px-2.5 py-1 text-[8px] font-extrabold text-[#7A7068]">
            {index + 1}/{banners.length}
          </span>
          <button
            type="button"
            aria-label="Келесі баннер"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIndex((itemIndex) => (itemIndex + 1) % banners.length);
            }}
            className="grid h-7 w-7 place-items-center rounded-full border border-[#E8E1DA] bg-white text-[#5F5750] shadow-[0_3px_10px_rgba(23,34,53,.06)] transition hover:border-[#FFB067] hover:text-[#FF8000]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );

  if (!current.href) return content;

  const external =
    current.href.startsWith("http://") || current.href.startsWith("https://");

  return external ? (
    <a href={current.href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <Link href={current.href}>{content}</Link>
  );
}
