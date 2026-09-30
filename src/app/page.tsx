import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Users } from "lucide-react";

const features=[
  ["01","Күнделікті тәртіп","Tasks, reports және progress бір жұмыс кеңістігінде."],
  ["02","Видео + тест","Kinescope прогресі 85% gate арқылы тестті ашады."],
  ["03","Meet attendance","Google Meet команда қатысуын есепке алады."],
  ["04","Рейтинг","Ұпайлар мен команда нәтижелері ашық түрде жиналады."],
];

export default function HomePage(){
  return <main className="min-h-screen bg-white">
    <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
      <nav className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#C25100] text-sm font-bold text-white">S</span><span className="text-sm font-semibold tracking-tight text-gray-900">Shyraq</span></Link>
        <div className="flex items-center gap-2"><Link href="/login" className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 transition-all duration-300 ease-in-out hover:bg-[#FAFAFA] hover:text-gray-900">Кіру</Link><Link href="/register" className="rounded-lg bg-[#C25100] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90">Тіркелу</Link></div>
      </nav>

      <div className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C25100]">STUDENT MARATHON PLATFORM</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-gray-900 sm:text-6xl">Тәртіпті жүйеге айналдырыңыз.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">Shyraq — студент, ментор және админ үшін тапсырма, есеп, сабақ, Meet attendance, ұпай және рейтингті бір жерге жинайтын марафон платформасы.</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-xl bg-[#C25100] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90">Бастау<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5"/></Link>
            <Link href="/login" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-soft">Аккаунтқа кіру</Link>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C25100]/10 text-[#C25100]"><CheckCircle2 size={18}/></span><div><p className="text-sm font-semibold text-gray-900">Бір жұмыс кеңістігі</p><p className="mt-0.5 text-xs text-gray-500">Тапсырма → есеп → сабақ → нәтиже.</p></div></div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C25100]/10 text-[#C25100]"><BookOpen size={18}/></span><div><p className="text-sm font-semibold text-gray-900">Оқу прогресі</p><p className="mt-0.5 text-xs text-gray-500">Видео coverage және тесттер.</p></div></div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C25100]/10 text-[#C25100]"><Users size={18}/></span><div><p className="text-sm font-semibold text-gray-900">Командалық бақылау</p><p className="mt-0.5 text-xs text-gray-500">Mentor мен admin үшін operational metrics.</p></div></div>
          </div>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        {features.map(([number,title,description])=><div key={number} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft transition-all duration-300 ease-in-out hover:-translate-y-0.5 sm:p-5">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C25100]">{number}</p>
          <h2 className="mt-2 text-sm font-semibold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>)}
      </section>
    </section>
  </main>;
}
