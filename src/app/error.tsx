"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { RefreshCcw } from "lucide-react";

const montserrat = Montserrat({
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the production boundary quiet; diagnostics remain in Vercel.
  }, []);

  return (
    <main className={montserrat.className + " min-h-screen bg-[#FAF9F7] text-[#172235]"}>
      <div className="flex min-h-screen items-center justify-center px-5">
        <section className="w-full max-w-lg rounded-[28px] border border-[#E8E3DD] bg-white p-7 text-center shadow-[0_22px_65px_rgba(23,34,53,.06)] sm:p-9">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#FFF0EE] text-[#BF514A]">
            <RefreshCcw size={24} />
          </div>
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#BF514A]">ҚАТЕ</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Бетте қате шықты.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#766E66]">Қайта жүктеп көріңіз.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-[13px] bg-[#FF8000] px-5 py-3 text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(255,128,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#E56F00]"
            >
              <RefreshCcw size={15} />
              Қайта көру
            </button>
            <Link href="/" className="inline-flex items-center gap-2 rounded-[13px] border border-[#E8E3DD] bg-white px-5 py-3 text-xs font-extrabold text-[#3F3832] transition hover:-translate-y-0.5 hover:bg-[#FFFBF6]">
              Басты бет
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
