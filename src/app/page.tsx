"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Layers3,
  Play,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

const stats = [
  ["1", "платформа", "Сабақ, тапсырма және прогресс бір жерде"],
  ["3", "рөл", "Оқушы, ментор және админ"],
  ["24/7", "қолжетімді", "Оқу процесі өзіңе ыңғайлы уақытта"],
  ["85%", "оқу шегі", "Видеоның қажетті бөлігін көрсең, тест ашылады"],
];

const learningCards = [
  {
    icon: BookOpen,
    tag: "САБАҚ",
    title: "Сабақты көр — прогресті жоғалтпа",
    text: "Қай жерге дейін көргенің сақталады. Қайта кіргенде сол жерден жалғастырасың.",
    className: "from-[#fff0e3] to-[#ffd5bb]",
  },
  {
    icon: Target,
    tag: "ТАПСЫРМА",
    title: "Бүгін не істеу керек екенін біл",
    text: "Тапсырмалар мен deadline бір экранда тұрады. Ең маңызды жұмысты бірінші көресің.",
    className: "from-[#eeeaff] to-[#dce7ff]",
  },
  {
    icon: BarChart3,
    tag: "ПРОГРЕСС",
    title: "Нәтижеңді өз көзіңмен көр",
    text: "Ұпай, сабақтағы прогресс, есептер және қатысу көрсеткіші бір жерге жиналады.",
    className: "from-[#e3faf2] to-[#d7f1f4]",
  },
];

const roleCards = [
  {
    icon: Target,
    title: "Оқушы үшін",
    text: "Күннің жоспары, сабақтары, тапсырмалары және нәтижесі бір жерден көрінеді.",
    points: ["Бүгінгі міндет", "Сабақ прогресі", "Ұпай мен рейтинг"],
  },
  {
    icon: Users,
    title: "Ментор үшін",
    text: "Командадағы әр оқушының белсенділігін, тапсырмаларын және сабаққа қатысуын бақылауға болады.",
    points: ["Команда көрінісі", "Attendance", "Оқушы прогресі"],
  },
  {
    icon: Layers3,
    title: "Админ үшін",
    text: "Сабақ, тест, команда және ұпай жүйесін бір жерден басқаруға болады.",
    points: ["Контент", "Командалар", "Scoring"],
  },
];

const demoQuotes = [
  {
    text: "«Қай тапсырманы қашан орындау керегін іздеп отырмайсың. Бәрі бір жерде тұрғаны ыңғайлы.»",
    role: "Үлгі пікір · 11-сынып оқушысы",
  },
  {
    text: "«Ментор ретінде кім белсенді, кімнің тапсырмасы қалып қойғанын бір экраннан көру әлдеқайда түсінікті.»",
    role: "Үлгі пікір · ментор",
  },
  {
    text: "«Маған ең ұнағаны — күн сайын не істеу керегінің анық болуы. Жоспарды ойлап әуре болмайсың.»",
    role: "Үлгі пікір · студент",
  },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff6f2c] text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(255,111,44,.18)]">
        S
      </span>
      <span className={`text-[15px] font-extrabold tracking-[-.02em] ${dark ? "text-white" : "text-[#172235]"}`}>
        Shyraq
      </span>
    </Link>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[940px]">
      <div className="absolute -inset-10 rounded-[55px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,111,44,.32),transparent_60%)] blur-2xl" />
      <div className="relative rounded-[34px] border-[10px] border-[#15233a] bg-[#e8e3db] p-2 shadow-[0_45px_110px_rgba(11,22,38,.22)] sm:border-[12px] sm:p-3">
        <div className="rounded-[24px] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0e2] text-[#ff6f2c]">
                <Sparkles size={17} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9c948b]">SHYRAQ · ОҚУШЫ</p>
                <p className="mt-0.5 text-sm font-extrabold text-[#172235]">Бүгінгі оқу</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#e9e5df] px-3 py-1.5 text-[10px] font-semibold text-[#81786f] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Белсенді
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-[22px] bg-gradient-to-br from-[#ff8b16] via-[#ff6f2c] to-[#ec5c00] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-white/70">Аптадағы ұпай</p>
                  <p className="mt-1 text-4xl font-extrabold tracking-[-.05em]">
                    45 <span className="text-lg font-semibold text-white/55">ұпай</span>
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                  <Flame size={18} />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-[10px] font-semibold text-white/80">
                <span>Апталық мақсат</span>
                <span>72%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[72%] rounded-full bg-white" />
              </div>
              <div className="mt-4 inline-flex items-center gap-2 text-[10px] text-white/75">
                <Check size={12} />
                Бүгінгі 3 негізгі қадам дайын
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[22px] border border-[#ece7df] bg-[#faf8f4] p-4">
                <div className="flex items-center justify-between text-[10px] text-[#9c948b]">
                  <span>Сабақ прогресі</span>
                  <span className="font-bold text-[#ff6f2c]">Тест ашық</span>
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#172235]">91.7%</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9e5df]">
                  <div className="h-full w-[92%] rounded-full bg-[#ff6f2c]" />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#ece7df] bg-[#faf8f4] p-4">
                <div className="flex items-center justify-between text-[10px] text-[#9c948b]">
                  <span>Рейтинг</span>
                  <span className="font-bold text-[#172235]">Команда</span>
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#172235]">#04</p>
                <p className="mt-2 text-[10px] text-[#9b938a]">Апта бойынша</p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {[
              ["Бүгінгі тапсырма", "Математика практикасы", "25 ұпай"],
              ["Күндік есеп", "Бүгінгі оқу қорытындысы", "1 минут"],
              ["Кешкі сабақ", "Google Meet", "18:00"],
            ].map(([label, title, meta]) => (
              <div key={label} className="rounded-[20px] border border-[#ebe6df] bg-white p-4">
                <p className="text-[10px] text-[#a19a91]">{label}</p>
                <p className="mt-1.5 text-sm font-bold text-[#172235]">{title}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-[#999087]">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={11} />
                    {meta}
                  </span>
                  <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 hidden rounded-2xl bg-white px-4 py-3 shadow-[0_18px_45px_rgba(20,20,20,.14)] sm:block">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#aaa29a]">STREAK</p>
        <p className="mt-1 text-sm font-extrabold text-[#172235]">7 күн қатарынан</p>
      </div>
    </div>
  );
}

function LearningCard({
  icon: Icon,
  tag,
  title,
  text,
  className,
}: {
  icon: typeof BookOpen;
  tag: string;
  title: string;
  text: string;
  className: string;
}) {
  return (
    <div className={`group rounded-[28px] bg-gradient-to-br ${className} p-3 shadow-[0_18px_45px_rgba(20,20,20,.06)] transition-transform duration-300 hover:-translate-y-1`}>
      <div className="rounded-[23px] bg-white/90 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#172235] text-white">
            <Icon size={19} />
          </div>
          <span className="text-[9px] font-extrabold tracking-[.18em] text-[#a09a92]">{tag}</span>
        </div>
        <h3 className="mt-5 text-lg font-extrabold leading-tight text-[#172235]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#776f67]">{text}</p>
        <div className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[#172235]">
          Толығырақ
          <ArrowRight size={14} className="text-[#ff6f2c]" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#172235]">
      <ScrollProgress />

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-[580px] bg-[radial-gradient(circle_at_50%_28%,rgba(255,174,129,.24),transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <Logo />

            <div className="hidden items-center rounded-full border border-[#e8e4dc] bg-[#162235] p-1 shadow-sm sm:flex">
              {[
                ["Басты бет", "#"],
                ["Мүмкіндіктер", "#features"],
                ["Қалай жұмыс істейді", "#how"],
                ["Артықшылықтар", "#roles"],
              ].map(([label, href], index) => (
                <a
                  key={label}
                  href={href}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${index === 0 ? "bg-white text-[#172235] shadow-sm" : "text-white/70 hover:text-white"}`}
                >
                  {label}
                </a>
              ))}
            </div>

            <Link
              href="/register"
              className="rounded-full bg-[#ff6f2c] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(255,111,44,.22)] transition hover:-translate-y-0.5"
            >
              Тегін бастау
              <Sparkles size={13} className="ml-1 inline" />
            </Link>
          </nav>

          <div className="mt-7 rounded-[36px] bg-gradient-to-br from-[#ffe7d9] via-[#ffd7ca] to-[#fff0e7] px-5 pb-10 pt-12 sm:px-10 sm:pt-14 lg:px-16 lg:pt-16">
            <Reveal className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#6f625a] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff6f2c]" />
                Оқу процесін бір жерге жина
              </div>

              <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[.98] tracking-[-.06em] text-[#152032] sm:text-6xl lg:text-[78px]">
                Оқуыңды ретте.
                <span className="block">
                  Нәтижеңді <span className="text-[#ff6f2c]">өсір.</span>
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#756a63] sm:text-base">
                Сабақ, тапсырма, күндік есеп, прогресс және рейтинг — бәрі бір жерде. Бүгін не істеу керегін аш та, оқуды бастап кет.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-[#ff6f2c] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(255,111,44,.22)] transition hover:-translate-y-0.5"
                >
                  Тегін бастау
                  <ArrowRight size={16} className="ml-1 inline" />
                </Link>
                <Link
                  href="#features"
                  className="rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-[#172235] shadow-sm transition hover:-translate-y-0.5"
                >
                  Платформа қалай жұмыс істейді?
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-[#877970]">
                {["Сабақтар", "Тапсырмалар", "Күндік есеп", "Рейтинг"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check size={12} className="text-[#ff6f2c]" />
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal className="relative mx-auto mt-10 max-w-5xl" delay={180}>
              <DashboardMockup />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid gap-px overflow-hidden rounded-[28px] border border-[#ebe7e0] bg-[#ebe7e0] sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([value, title, text]) => (
                <div key={title} className="bg-white p-6 sm:p-7">
                  <p className="text-3xl font-extrabold tracking-[-.04em] text-[#172235]">{value}</p>
                  <p className="mt-1 text-xs font-extrabold text-[#ff6f2c]">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-[#81786f]">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="features" className="bg-[#fbfaf7]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">ОҚУ ЖҮЙЕСІ</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] text-[#152032] sm:text-5xl">
                Оқу барысы бір жерге жиналады.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#7b756e] sm:text-base">
                Әр бөлімнің өз міндеті бар: сабақты көресің, тапсырманы орындайсың, нәтижені бақылайсың.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {learningCards.map((item, index) => (
              <Reveal key={item.title} delay={index * 100}>
                <LearningCard {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ</p>
                <h2 className="mt-3 text-4xl font-extrabold leading-[1.03] tracking-[-.05em] text-[#152032] sm:text-5xl">
                  Бүгінгі тапсырмаңды көр.
                  <span className="block text-[#8e877f]">Орында. Келесі қадамға өт.</span>
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-[#726b64] sm:text-base">
                  Платформа саған артық ақпарат көрсетпейді. Кірген кезде ең маңызды нәрсе — бүгін не істеу керегі — бірінші орында тұрады.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    ["01", "Сабақты көр", "Видео прогресі автоматты түрде сақталады."],
                    ["02", "Тапсырманы орында", "Тапсырма мен deadline бір жерде тұрады."],
                    ["03", "Нәтижеңді тексер", "Ұпайың мен рейтингің арқылы прогресіңді көресің."],
                  ].map(([n, title, text], index) => (
                    <Reveal key={n} delay={index * 80}>
                      <div className="rounded-[22px] border border-[#ece7df] bg-[#faf9f6] p-4 transition hover:bg-white hover:shadow-[0_16px_40px_rgba(20,20,20,.06)] sm:p-5">
                        <div className="flex items-start gap-4">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#172235] text-[10px] font-extrabold text-white">{n}</span>
                          <div>
                            <p className="text-sm font-extrabold text-[#172235]">{title}</p>
                            <p className="mt-1 text-xs leading-5 text-[#81786f]">{text}</p>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative mx-auto w-full max-w-[520px]">
                <div className="absolute -inset-8 rounded-full bg-[#ff6f2c]/12 blur-3xl" />
                <div className="relative rounded-[34px] bg-[#152032] p-4 shadow-[0_30px_85px_rgba(11,22,38,.22)]">
                  <div className="rounded-[25px] bg-[#f8f6f1] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#9c948b]">БҮГІН</p>
                        <p className="mt-1 text-xl font-extrabold text-[#172235]">Оқу жоспары</p>
                      </div>
                      <span className="rounded-full bg-[#fff0e2] px-3 py-1.5 text-[10px] font-extrabold text-[#ff6f2c]">72%</span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {[
                        ["Математика практикасы", "Дайын"],
                        ["Видео: Фокус және тәртіп", "92%"],
                        ["Күндік есеп", "Ашық"],
                      ].map(([title, state], index) => (
                        <div key={title} className="rounded-2xl border border-[#eae5df] bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[9px] font-extrabold tracking-[.16em] text-[#aaa29a]">0{index + 1}</p>
                              <p className="mt-1 text-sm font-bold text-[#172235]">{title}</p>
                            </div>
                            <span className="rounded-full bg-[#f5f1eb] px-2.5 py-1 text-[9px] font-bold text-[#746c64]">{state}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#172235] p-4 text-white">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/50">Апта мақсаты</span>
                        <span className="font-extrabold">72%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[72%] rounded-full bg-[#ff6f2c]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="roles" className="bg-[#101b2c] text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff9b3b]">БІР ПЛАТФОРМА — ҮШ РӨЛ</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">
                Әр адам өзіне керек нәрсені көреді.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/50 sm:text-base">
                Оқушыға — оқу. Менторға — бақылау. Админге — басқару. Үшеуі бір жүйеде жұмыс істейді.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {roleCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 90}>
                  <article className="h-full rounded-[26px] border border-white/10 bg-white/[.045] p-6 transition hover:-translate-y-1 hover:bg-white/[.06]">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#172235]">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-5 text-lg font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{item.text}</p>
                    <div className="mt-5 space-y-2">
                      {item.points.map((point) => (
                        <div key={point} className="inline-flex w-full items-center gap-2 text-xs font-semibold text-white/75">
                          <Check size={13} className="text-[#ff9b3b]" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf7]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">НЕГЕ SHYRAQ?</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] text-[#172235] sm:text-5xl">
                Оқуды бастау оңай. Жалғастыру одан да оңай.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#7b756e]">
                Платформа оқу процесін ұсақ қадамдарға бөліп, әр күнді түсінікті етеді.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {demoQuotes.map((quote, index) => (
              <Reveal key={quote.role} delay={index * 90}>
                <article className="h-full rounded-[26px] border border-[#e9e4dc] bg-white p-6 shadow-[0_12px_35px_rgba(20,20,20,.04)]">
                  <div className="flex gap-1 text-[#ff6f2c]">
                    {"★★★★★".split("").map((star, starIndex) => (
                      <span key={starIndex} className="text-sm">{star}</span>
                    ))}
                  </div>
                  <p className="mt-5 text-sm font-semibold leading-7 text-[#394153]">{quote.text}</p>
                  <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a29a91]">{quote.role}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-[34px] bg-gradient-to-br from-[#ffe0cd] via-[#fff0e6] to-[#eee8ff] p-6 sm:p-8 lg:p-10">
              <div className="grid gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">БІРІНШІ ҚАДАМ — БҮГІН</p>
                  <h2 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-.05em] text-[#172235] sm:text-5xl">
                    Оқу жоспарың дайын.
                    <span className="text-[#ff6f2c]"> Енді бастау ғана қалды.</span>
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-[#736a62]">
                    Тіркел. Командаңа қосыл. Ал бүгінгі алғашқы тапсырмаңды орындап көр.
                  </p>
                  <Link
                    href="/register"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff6f2c] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(255,111,44,.22)] transition hover:-translate-y-0.5"
                  >
                    Тегін тіркелу
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="mx-auto w-full max-w-[430px] rounded-[28px] border border-white/70 bg-white/65 p-4 shadow-[0_25px_70px_rgba(40,30,20,.1)] backdrop-blur">
                  <div className="rounded-[22px] bg-[#172235] p-5 text-white">
                    <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-white/40">БҮГІН</p>
                    <p className="mt-1 text-2xl font-extrabold">Алғашқы үш қадам</p>
                    <div className="mt-5 space-y-2.5">
                      {["Профильді толтыру", "Бір тапсырманы орындау", "Сабақтың алғашқы бөлігін көру"].map((item, index) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[.06] px-3 py-3">
                          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#ff6f2c] text-[9px] font-extrabold">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs font-semibold text-white/75">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#0b1423] text-white/55">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <Logo dark />
              <p className="mt-4 max-w-xs text-xs leading-6 text-white/40">
                Оқу процесін бір жерге жинап, күнделікті қадамды анық көрсететін платформа.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/35">Платформа</p>
              <div className="mt-4 space-y-2.5 text-xs">
                <a href="#features" className="block hover:text-white">Мүмкіндіктер</a>
                <a href="#how" className="block hover:text-white">Қалай жұмыс істейді</a>
                <a href="#roles" className="block hover:text-white">Кім үшін?</a>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/35">Аккаунт</p>
              <div className="mt-4 space-y-2.5 text-xs">
                <Link href="/login" className="block hover:text-white">Кіру</Link>
                <Link href="/register" className="block hover:text-white">Тіркелу</Link>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/35">Shyraq</p>
              <div className="mt-4 space-y-2.5 text-xs">
                <span className="block">Оқушылар үшін</span>
                <span className="block">Менторлар үшін</span>
                <span className="block">Командалар үшін</span>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/8 pt-5 text-[10px] text-white/30">
            © 2026 Shyraq. Барлық құқықтар қорғалған.
          </div>
        </div>
      </footer>
    </main>
  );
}
