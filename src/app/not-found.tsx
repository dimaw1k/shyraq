"use client";

import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FAF9F7] text-[#172235] font-[Montserrat,ui-sans-serif,system-ui,sans-serif]">
      <div className="flex min-h-screen items-center justify-center px-5">
        <section className="w-full max-w-lg rounded-[28px] border border-[#E8E3DD] bg-white p-7 text-center shadow-[0_22px_65px_rgba(23,34,53,.06)] sm:p-9">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#FFF1E2] text-[#FF8000]">
            <SearchX size={24} />
          </div>
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">404</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Бет табылмады.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#766E66]">Бұл мекенжайда Shyraq беті жоқ.</p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-[13px] bg-[#FF8000] px-5 py-3 text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(255,128,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#E56F00]"
          >
            <ArrowLeft size={15} />
            Басты бетке
          </Link>
        </section>
      </div>
    </main>
  );
}
