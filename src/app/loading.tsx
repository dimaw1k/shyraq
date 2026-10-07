"use client";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#FAF9F7] text-[#172235]">
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-sm rounded-[24px] border border-[#E8E3DD] bg-white p-6 shadow-[0_18px_55px_rgba(23,34,53,.06)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#FFF1E2] text-[#FF8000]">
              <span className="h-4 w-4 animate-pulse rounded-full bg-[#FF8000]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#ECE7E1]" />
              <div className="mt-2 h-2 w-40 animate-pulse rounded-full bg-[#F2EEE9]" />
            </div>
          </div>
          <div className="mt-6 h-2.5 w-full animate-pulse rounded-full bg-[#F0ECE7]" />
          <p className="mt-3 text-center text-[10px] font-semibold text-[#9A9189]">Жүктелуде</p>
        </div>
      </div>
    </main>
  );
}
