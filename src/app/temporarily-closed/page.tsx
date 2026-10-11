import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TemporarilyClosedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF9F7] px-4 py-10">
      <section className="w-full max-w-lg rounded-[24px] border border-[#E8E1DA] bg-white p-8 text-center shadow-[0_12px_34px_rgba(23,34,53,.06)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-[16px] bg-[#FFF0E2] text-[#C25100]">
          <span className="text-xl font-extrabold">!</span>
        </div>
        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#C25100]">SHYRAQ · УАҚЫТША ЖАБЫҚ</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-.03em] text-[#172235]">Бөлім уақытша жабық</h1>
        <p className="mt-3 text-sm leading-6 text-[#6F665E]">
          Бұл бөлімде жаңарту жұмыстары жүріп жатыр. Жұмыс аяқталғанша бөлімге кіру уақытша шектелген.
        </p>
        <Link href="/profile" className="mt-6 inline-flex min-h-10 items-center justify-center rounded-[12px] bg-[#FF8000] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#E56F00]">
          Профильге қайту
        </Link>
      </section>
    </main>
  );
}
