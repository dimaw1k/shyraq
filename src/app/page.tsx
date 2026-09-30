import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

const features = [
  { icon: Target, title: "Күннің бағыты анық", text: "Тапсырма, deadline және күндік есеп — бәрі бір жерде. Келесі қадамды іздеп уақыт жоғалтпайсың." },
  { icon: BookOpen, title: "Сабақ көр. Тестті аш.", text: "Видеоның нақты прогресі сақталады. Қажетті деңгейге жеткенде тест өзінен-өзі ашылады." },
  { icon: BarChart3, title: "Өсуіңді көр", text: "Ұпайың, белсенділігің және сабақтағы прогресің бір экранда. Не алға жылжып жатыр — бірден көресің." },
  { icon: Users, title: "Ментор бәрін көреді", text: "Қай оқушы алда, қайсысы тоқтап қалды, кімге назар керек — команда бір экранда." },
  { icon: Trophy, title: "Нәтижеңді салыстыр", text: "Ұпай мен рейтинг прогресті көзге көрінетін етеді. Өзіңнің позицияңды күн сайын бақыла." },
  { icon: CalendarCheck2, title: "Қатысу да есепте", text: "Google Meet-тегі қатысуың автоматты түрде есепке алынып, жалпы белсенділікке қосылады." },
];

const steps = [
  { n: "01", title: "Тіркел", text: "Профильіңді жаса да, өз командаңмен бір кеңістікке кір." },
  { n: "02", title: "Орында", text: "Сабақты көр. Тапсырманы жап. Күндік есебіңді бір минутта жібер." },
  { n: "03", title: "Өс", text: "Әр орындалған қадам ұпайға айналсын. Прогрессіңді көріп, келесі деңгейге өт." },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff7a00] text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(255,122,0,.22)]">
        S
      </span>
      <span className={`text-[15px] font-extrabold tracking-[-0.02em] ${dark ? "text-white" : "text-[#141414]"}`}>Shyraq</span>
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="relative lg:mt-3">
      <div className="absolute -inset-10 rounded-[44px] bg-[#ff7a00]/10 blur-3xl" />
      <div className="relative rounded-[30px] border border-[#ffffff22] bg-[#131313] p-3 shadow-[0_35px_100px_rgba(20,20,20,.22)] sm:p-4">
        <div className="rounded-[24px] border border-white/10 bg-[#191919] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#ff9b3b]">SHYRAQ / STUDENT</p>
              <h3 className="mt-1 text-lg font-bold tracking-[-.03em] text-white">Бүгінгі прогресс</h3>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/60">
              <Sparkles size={17} />
            </div>
          </div>

          <div className="mt-5 rounded-[22px] bg-gradient-to-br from-[#ff7a00] to-[#f06400] p-5 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/70">Жалпы ұпай</p>
                <p className="mt-1 text-4xl font-extrabold tracking-[-.05em]">45</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Flame size={18} />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between text-[10px] font-semibold text-white/75">
              <span>Апталық фокус</span><span>72%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[72%] rounded-full bg-white" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/45">Видео прогресі</span>
                <span className="text-[9px] font-semibold text-[#ff9b3b]">АШЫҚ</span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white">91.7%</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-[#ff7a00]" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/45">Attendance</span>
                <span className="text-[9px] font-semibold text-emerald-300">ЖАҚСЫ</span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white">93%</p>
              <p className="mt-2 text-[10px] text-white/35">2 сабақ · осы апта</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] text-white/40">Келесі тапсырма</p>
                <p className="mt-1 text-sm font-semibold text-white">Математика практикасы</p>
              </div>
              <span className="rounded-full bg-[#ff7a00]/15 px-2.5 py-1 text-[10px] font-semibold text-[#ffaf6b]">25 ұпай</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-white/35">
              <span className="inline-flex items-center gap-1.5"><Clock3 size={11} /> Deadline</span>
              <span>04 күн қалды</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 left-3 hidden rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-[0_16px_50px_rgba(20,20,20,.14)] sm:block">
        <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-gray-400">STREAK</p>
        <p className="mt-1 text-sm font-bold text-[#141414]">7 күн қатарынан</p>
      </div>

      <div className="absolute -right-4 top-10 hidden rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3 shadow-2xl sm:block">
        <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/40">RANK</p>
        <p className="mt-1 text-lg font-bold text-white">#04</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f5f0] text-[#141414]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 shrq-grid opacity-40" />
        <div className="absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-[#ff7a00]/8 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-7 lg:px-8">
          <nav className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-1.5">
              <Link href="/login" className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#5f5b55] transition-colors hover:bg-white hover:text-[#141414]">
                Кіру
              </Link>
              <Link href="/register" className="rounded-xl bg-[#141414] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#242321]">
                Тіркелу
              </Link>
            </div>
          </nav>

          <div className="grid gap-12 pt-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:gap-12 lg:pt-14">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/7 bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-[#6c6862] shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a00]" />
                ОҚУҒА АРНАЛҒАН БІРТҰТАС ЖҮЙЕ
              </div>

              <h1 className="mt-6 max-w-2xl text-[48px] font-extrabold leading-[.98] tracking-[-.06em] sm:text-6xl lg:text-[78px]">
                Оқуды
                <span className="block text-[#ff7a00]">бақыла. Нәтижеңді өсір.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#68645e] sm:text-lg">
                Сабақ қайда, тапсырма қайда, прогресім қанша — енді іздемейсің. Shyraq оқу процесін бір жерге жинап, әр күніңе нақты келесі қадам береді.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="group inline-flex items-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,122,0,.22)] transition-all hover:-translate-y-0.5 hover:bg-[#ec6d00]">
                  Қазір бастау
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="#features" className="inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-white px-5 py-3.5 text-sm font-bold text-[#2c2a27] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  Не бар екенін көру
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[#858078]">
                {["Тапсырма + deadline", "Видео progress", "Meet attendance"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check size={13} className="text-[#ff7a00]" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["Д", "А", "Н", "М"].map((letter) => (
                    <span key={letter} className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f7f5f0] bg-[#141414] text-[10px] font-bold text-white">
                      {letter}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2e2b28]">Оқушыға — анық бағыт. Менторға — толық көрініс.</p>
                  <p className="mt-0.5 text-[10px] text-[#8a857d]">Бір команда. Бір қарқын. Бір нәтиже.</p>
                </div>
              </div>
            </div>

            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-black/6 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-black/6 sm:grid-cols-4 sm:divide-y-0">
          {[
            ["01", "Бәрі бір жерде", "Сабақтан нәтижеге дейін"],
            ["02", "Әр қадам көрінеді", "Прогресс жасырын қалмайды"],
            ["03", "Менторлық бақылау", "Команданың суреті бір экранда"],
            ["04", "Күн сайынғы ритм", "Келесі қадам әрқашан анық"],
          ].map(([n, title, text], index) => (
            <Reveal key={n} delay={index * 70}>
              <div className="px-5 py-7 sm:px-7 sm:py-8">
              <p className="text-[10px] font-extrabold tracking-[.18em] text-[#ff7a00]">{n}</p>
              <p className="mt-2 text-sm font-bold text-[#191817]">{title}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-[#8a857d]">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="features" className="bg-[#f7f5f0]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff7a00]">Мүмкіндіктер</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight tracking-[-.05em] sm:text-5xl">
              Көп мүмкіндік.
              <span className="block text-[#8d887f]">Бір ғана мақсат — алға жылжу.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#6d6962] sm:text-base">
              Сенің уақытың интерфейсті түсінуге емес, оқуға жұмсалсын. Сондықтан Shyraq әр функцияны бір логикаға біріктіреді: көр → орында → белгіле → өс.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={index * 80}>
                <article className="group rounded-[26px] border border-black/7 bg-white p-6 shadow-[0_12px_38px_rgba(20,20,20,.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(20,20,20,.08)]">
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0e2] text-[#e96f00] transition-transform duration-300 group-hover:scale-105">
                      <Icon size={19} />
                    </div>
                    <span className="text-[10px] font-bold text-[#b0aaa2]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-base font-bold tracking-[-.02em]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#737067]">{feature.text}</p>
                </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-6 sm:py-24 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff7a00]">Қалай жұмыс істейді</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight tracking-[-.05em] sm:text-5xl">
              Күн сайын
              <span className="block text-[#8d887f]">өзіңнің жақсырақ нұсқаңа.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#6f6a63] sm:text-base">
              Артық батырма, түсініксіз экран жоқ. Кіресің, бүгінгі міндетіңді көресің, орындайсың — жүйе қалған прогресті өзі жинайды.
            </p>
            <Link href="/register" className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#1a1917]">
              Платформаны көру
              <ArrowRight size={16} className="text-[#ff7a00] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <Reveal key={step.n} delay={index * 90}>
              <div className="group rounded-[24px] border border-black/7 bg-[#f7f5f0] p-5 transition-all duration-300 hover:bg-white hover:shadow-[0_18px_45px_rgba(20,20,20,.07)] sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#141414] text-[10px] font-extrabold text-white">
                    {step.n}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#747067]">{step.text}</p>
                  </div>
                  <ChevronRight size={17} className="ml-auto mt-1 shrink-0 text-[#b6b0a8] transition-transform group-hover:translate-x-1 group-hover:text-[#ff7a00]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <Reveal>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff9b3b]">Өнімнің ішінде</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-[-.05em] sm:text-5xl">
                Оқушыға — бағыт.
                <span className="block text-[#ff7a00]">Менторға — толық картина.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/48 sm:text-base">
                Бір жүйе екі рөлді байланыстырады: оқушы бүгін не істейтінін нақты біледі, ментор команданың шынайы прогресін бірден көреді.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ["Оқушы", "Сабақ · тапсырма · есеп · рейтинг"],
                  ["Ментор", "Команда · attendance · прогресс"],
                  ["Админ", "Контент · teams · scoring"],
                  ["Платформа", "Auth · storage · analytics"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/8 bg-white/[.035] p-4">
                    <p className="text-xs font-bold text-white">{title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/40">{text}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
            <div className="rounded-[30px] border border-white/10 bg-white/[.035] p-4 sm:p-5">
              <div className="rounded-[24px] bg-white p-5 text-[#141414] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#a19b92]">WEEKLY FOCUS</p>
                    <h3 className="mt-1 text-lg font-extrabold tracking-tight">Осы апта</h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0e2] text-[#ff7a00]">
                    <Trophy size={18} />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    ["Тапсырмалар", "8 / 10", "80%"],
                    ["Күндік есеп", "5 / 7", "71%"],
                    ["Сабақ прогресі", "92%", "92%"],
                  ].map(([label, value, width]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#67625a]">{label}</span>
                        <span className="font-extrabold">{value}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#efede8]">
                        <div className="h-full rounded-full bg-[#ff7a00]" style={{ width }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[
                    ["Ұпай", "45"],
                    ["Rank", "#04"],
                    ["Streak", "7"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-[#f7f5f0] p-3">
                      <p className="text-[9px] font-semibold text-[#a19b92]">{label}</p>
                      <p className="mt-1 text-lg font-extrabold">{value}</p>
                    </div>
                  ))}
                </div>

                <Link href="/dashboard" className="mt-5 flex items-center justify-between rounded-2xl bg-[#141414] px-4 py-3.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5">
                  Dashboard-ты көру
                  <ArrowRight size={15} className="text-[#ff7a00]" />
                </Link>
              </div>
            </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[#ff7a00]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Reveal className="w-full">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/65">READY WHEN YOU ARE</p>
              <h2 className="mt-3 text-4xl font-extrabold leading-none tracking-[-.06em] text-white sm:text-6xl">
                Бос күтпе.
                <span className="block text-white/70">Бүгін баста.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
                Бір аккаунт. Бір жүйе. Әр күнге нақты бағыт.
              </p>
            </div>
            <Link href="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-[#171513] shadow-[0_16px_40px_rgba(140,53,0,.2)] transition-all hover:-translate-y-0.5">
              Тіркелу
              <ArrowRight size={17} />
            </Link>
          </div>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#0d0d0d] text-white/45">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Logo dark />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px]">
            <Link href="#features" className="hover:text-white">Мүмкіндіктер</Link>
            <Link href="/login" className="hover:text-white">Кіру</Link>
            <Link href="/register" className="hover:text-white">Тіркелу</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
