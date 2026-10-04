/* Shyraq landing production build marker */
import Link from "next/link";
import { HorizontalRail } from "@/components/ui/HorizontalRail";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { StickyNav } from "@/components/ui/StickyNav";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Target,
  Trophy,
} from "lucide-react";

const benefits = [
  {
    icon: Target,
    eyebrow: "01",
    title: "Таңды ерте бастап, күніңді өз қолыңа аласың",
    text: "Шырақтың режимі таңнан басталады: әдет, оқу, жоспар — бәрі бір жүйеде.",
    tone: "bg-[#fff2e8]",
  },
  {
    icon: BookOpen,
    eyebrow: "02",
    title: "Телефонға кеткен уақытты өзіңе қайтарасың",
    text: "Әлеуметтік желі, ойын және сериалдан уақытша алыстап, назарыңды маңызды іске бұрасың.",
    tone: "bg-[#eef0ff]",
  },
  {
    icon: BarChart3,
    eyebrow: "03",
    title: "Мақсат қою емес, оған жетуді үйренесің",
    text: "Тұрақтылық, жауапкершілік және өзіңді бақылау күнделікті әрекет арқылы қалыптасады.",
    tone: "bg-[#e9faf4]",
  },
  {
    icon: Trophy,
    eyebrow: "04",
    title: "Нәтижең көз алдыңда тұрады",
    text: "Ұпай, рейтинг, үзілмеген оқу күндері және апта қорытындысы қай жерде тұрғаныңды күн сайын көрсетеді.",
    tone: "bg-[#fff7dc]",
  },
];

const days = [
  ["01", "Бастау", "Мақсатыңды анықтап, күн тәртібіңді реттей бастайсың. Бірінші тапсырма — жай ғана бастау."],
  ["07", "Әдет", "Ұйқы, таңғы әдет, жоспар және оқу біртіндеп күнделікті өміріңнің қалыпты бөлігіне айналады."],
  ["14", "Қарқын", "Телефон мен басқа алаңдататын нәрселерді азайтып, уақытыңды маңызды тақырыптарға қайта бөлесің."],
  ["21", "Нәтиже", "21 күннің соңында ең маңыздысы — рейтинг емес. Өзіңе берген уәдеңді өзің орындай алатыныңды сезіну."],
];

const sampleQuotes = [
  "Күнделікті жоспар",
  "Сабақ пен тапсырма",
  "Ілгерілеу мен рейтинг",
];

function SocialIcon({ type }: { type: "instagram" | "tiktok" | "telegram" }) {
  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="17.55" cy="6.55" r="1.15" fill="currentColor" />
      </svg>
    );
  }

  if (type === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path
          d="M14.1 4.1v9.1a4.5 4.5 0 1 1-3.3-4.35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.1 4.1c.7 1.75 2.08 2.82 4.05 3.15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M21.25 4.5 18.05 19c-.24 1.03-.84 1.28-1.7.8l-4.67-3.45-2.25 2.16c-.25.25-.46.46-.94.46l.34-4.75 8.65-7.82c.38-.34-.08-.53-.59-.19L6.2 12.92 1.62 11.47c-1-.32-1.02-1.01.21-1.49L19.74 3.1c.84-.3 1.58.19 1.51 1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  const textColor = dark ? "#FFFFFF" : "#172235";
  const innerColor = dark ? "#172235" : "#FFF7F1";

  return (
    <Link href="/" aria-label="Shyraq" className="inline-flex shrink-0 items-center">
      <svg
        width="116"
        height="34"
        viewBox="0 0 116 34"
        role="img"
        aria-label="SHYRAQ"
        className="block h-[30px] w-auto sm:h-[34px]"
      >
        <text
          x="0"
          y="26"
          fill={textColor}
          fontSize="27"
          fontWeight="800"
          letterSpacing="-0.35"
          fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        >
          SHYR
        </text>
        <g transform="translate(-15 0)">
          <path
            d="M100 25.8c-3.8-4.8-6.8-8.2-6.8-12.9 0-4.2 3-7.5 6.8-7.5s6.8 3.3 6.8 7.5c0 4.7-3 8.1-6.8 12.9Z"
            fill="#FF8000"
          />
          <path
            d="M100 20.4c-1.7-2.3-2.9-4.3-2.9-6.5 0-1.7 1.2-3 2.9-3s2.9 1.3 2.9 3c0 2.2-1.2 4.2-2.9 6.5Z"
            fill={innerColor}
          />
          <circle cx="100" cy="25.1" r="1.3" fill="#FF8000" />
        </g>
        <text
          x="93"
          y="25"
          fill={textColor}
          fontSize="27"
          fontWeight="800"
          letterSpacing="-1.15"
          fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        >
          Q
        </text>
      </svg>
    </Link>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[940px]">
      <div className="absolute -inset-10 rounded-[56px] bg-[radial-gradient(circle_at_50%_20%,rgba(255,128,0,.35),transparent_62%)] blur-2xl" />

      <div className="relative rounded-[34px] border-[10px] border-[#17253a] bg-[#e7e1d8] p-2 shadow-[0_45px_120px_rgba(48,23,12,.22)] sm:border-[12px] sm:p-3">
        <div className="rounded-[23px] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#a39a91]">SHYRAQ · ОҚУШЫ</p>
              <p className="mt-1 text-sm font-extrabold text-[#172235]">Бүгінгі оқу</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ece7df] px-3 py-1.5 text-[10px] font-bold text-[#7e756d]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Белсенді
            </span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-[22px] bg-gradient-to-br from-[#FF9200] via-[#FF8000] to-[#ed5d00] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-white/70">Аптадағы ұпай</p>
                  <p className="mt-1 text-4xl font-extrabold tracking-[-.05em]">45</p>
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
                Бүгінгі негізгі қадамдар орындалды
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[22px] border border-[#ece7df] bg-[#faf8f4] p-4">
                <div className="flex items-center justify-between text-[10px] text-[#9c948b]">
                  <span>Сабақтың ілгерілеуі</span>
                  <span className="font-bold text-[#FF8000]">Тест ашық</span>
                </div>
                <p className="mt-2 text-3xl font-extrabold text-[#172235]">91.7%</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9e5df]">
                  <div className="h-full w-[92%] rounded-full bg-[#FF8000]" />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#ece7df] bg-[#faf8f4] p-4">
                <div className="flex items-center justify-between text-[10px] text-[#9c948b]">
                  <span>Рейтинг</span>
                  <span className="font-bold text-[#172235]">Апта</span>
                </div>
                <p className="mt-2 text-3xl font-extrabold text-[#172235]">#04</p>
                <p className="mt-2 text-[10px] text-[#9b938a]">Команда ішіндегі орын</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 hidden rounded-2xl bg-white px-4 py-3 shadow-[0_18px_45px_rgba(20,20,20,.14)] sm:block">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#aaa29a]">ҮЗІЛМЕГЕН КҮНДЕР</p>
        <p className="mt-1 text-sm font-extrabold text-[#172235]">7 күн қатарынан</p>
      </div>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  eyebrow,
  title,
  text,
  tone,
}: {
  icon: typeof Target;
  eyebrow: string;
  title: string;
  text: string;
  tone: string;
}) {
  return (
    <div className={`shyraq-benefit-card group relative rounded-[24px] border border-[#ebe6df] ${tone} p-4 shadow-[0_12px_30px_rgba(20,20,20,.035)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(20,20,20,.07)] sm:p-6`}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef1f6] text-[#172235] transition-transform duration-300 group-hover:scale-105">
        <Icon size={20} />
      </div>

      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#FF8000]">
        КЕЗЕҢ {eyebrow}
      </p>
      <h3 className="mt-1 max-w-[20rem] text-[20px] font-extrabold leading-[1.08] tracking-[-.035em] text-[#172235]">
        {title}
      </h3>
      <p className="mt-5 max-w-[24rem] text-[14px] font-medium leading-[1.65] text-[#655c54] sm:text-[15px] sm:leading-7">
        {text}
      </p>

      <ArrowRight
        size={15}
        className="absolute right-5 top-6 text-[#a79e95] transition-all group-hover:translate-x-0.5 group-hover:text-[#FF8000]"
        aria-hidden="true"
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#172235]">
      <ScrollProgress />
      <StickyNav />

      {/* HERO */}
      <section id="top" className="relative isolate min-h-[calc(100svh-1px)] overflow-hidden bg-gradient-to-br from-[#fff0e8] via-[#ffd7ca] to-[#ff8c5f]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,.45),transparent_28%),radial-gradient(circle_at_85%_38%,rgba(255,255,255,.12),transparent_30%)]" />
        <div className="absolute -left-32 bottom-[-180px] h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-80px] top-[-120px] h-[420px] w-[420px] rounded-full bg-[#FF8000]/18 blur-3xl" />

        <div className="relative mx-auto flex min-h-[calc(100svh-1px)] max-w-7xl flex-col px-5 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-8">
          <div className="grid flex-1 items-center gap-10 pb-2 pt-10 lg:grid-cols-[.88fr_1.12fr] lg:pt-7">
            <Reveal className="relative z-10 max-w-2xl" delay={70}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#6f625a] shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF8000]" />
                21 күндік оқу марафоны
              </div>

              <h1 className="mt-5 max-w-2xl text-[48px] font-extrabold leading-[.96] tracking-[-.065em] text-[#172235] sm:text-6xl lg:text-[78px]">
                Күнде аздап.<span className="block">21 күнде <span className="text-[#FF8000]">нәтиже.</span></span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-[#675d56] sm:text-lg">
                Сабақ, тапсырма және прогресс — бір жерде.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-[#FF8000] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(131,48,12,.22)] transition hover:-translate-y-0.5"
                >
                  Марафонға қосылу
                  <ArrowRight size={16} className="ml-1 inline" />
                </Link>

                <Link
                  href="#marathon"
                  className="rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-[#172235] shadow-sm transition hover:-translate-y-0.5"
                >
                  Қалай өтетінін көру
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[#756b63]">
                {["Күнделікті тапсырмалар", "Сабақтар", "Ілгерілеу", "Рейтинг"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check size={12} className="text-[#FF8000]" />
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal className="relative z-10 lg:mt-3" delay={170}>
              <DashboardMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* BENEFIT BENTO */}
      <section id="features" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-[72px] lg:px-8">
          <Reveal>
            <div className="max-w-3xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">МАРАФОННЫҢ МӘНІ</p>
              <h2 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-[-.055em] text-[#172235] sm:text-5xl">
                Өзіңе берген уәдеңді орындауды үйрен.
                <span className="block text-[#FF8000]">21 күн — соның бастамасы.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#776f67] sm:text-base">
                Оқу, жоспар және күндік есеп — бір жүйеде.
              </p>
            </div>
          </Reveal>

          <HorizontalRail
            variant="benefit"
            className="mt-8 lg:mt-10"
            ariaLabel="Шырақ марафонының мүмкіндіктері"
          >
            {benefits.map((item, index) => (
              <Reveal key={item.title} delay={index * 90}>
                <BenefitCard {...item} />
              </Reveal>
            ))}
          </HorizontalRail>
        </div>
      </section>

      {/* 21 DAY JOURNEY */}
      <section id="marathon" className="bg-[#fbfaf7]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-[72px] lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">21 КҮНДЕ НЕ ӨЗГЕРЕДІ?</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.055em] text-[#172235] sm:text-5xl">
                Күн сайын бір қадам.
                <span className="block text-[#FF8000]">21 күнде тұрақты әдет.</span>
              </h2>
            </div>
          </Reveal>

          <div className="relative mt-8">
            <div className="absolute left-6 top-8 hidden h-[calc(100%-64px)] w-px bg-gradient-to-b from-[#FF8000] via-[#ffd1b8] to-transparent sm:block" />

            <HorizontalRail
              variant="journey"
              className="mt-0"
              ariaLabel="21 күндік марафон кезеңдері"
            >
              {days.map(([number, title, text], index) => (
                <Reveal key={number} delay={index * 100}>
                  <div className="shyraq-journey-card group relative grid gap-4 rounded-[24px] border border-[#ebe5dd] bg-white p-4 shadow-[0_12px_30px_rgba(20,20,20,.035)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(20,20,20,.08)] sm:grid-cols-[76px_180px_1fr] sm:items-center sm:p-6">
                    <div className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-[#eef1f6] text-xs font-extrabold text-[#172235] shadow-[0_10px_24px_rgba(20,20,20,.08)]">
                      {number}
                    </div>

                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#FF8000]">КЕЗЕҢ</p>
                      <p className="mt-1 text-lg font-extrabold text-[#172235]">{title}</p>
                    </div>

                    <p className="max-w-[24rem] text-[13px] font-medium leading-[1.6] text-[#5f574f] sm:text-[15px] sm:leading-7">{text}</p>

                    <span className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#faf7f2] text-[#a79e95] transition-all group-hover:bg-[#fff0e2] group-hover:text-[#FF8000]">
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Reveal>
              ))}
            </HorizontalRail>
          </div>
        </div>
      </section>

      {/* PRODUCT / DAILY ROUTINE */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-[72px] lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <Reveal>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">ШЫРАҚТЫҢ КҮН ТӘРТІБІ</p>
                <h2 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-[-.055em] text-[#172235] sm:text-5xl">
                  Күн жоспары дайын.
                  <span className="block text-[#FF8000]">Саған орындау ғана қалады.</span>
                </h2>

                <HorizontalRail
                  variant="routine"
                  className="mt-5"
                  ariaLabel="Шырақтың күн тәртібі"
                >
                  {[
                    ["01", "Таңғы бастау", "05:00 — ояну, таңғы әдеттер және 05:30–06:30 алғашқы оқу."],
                    ["02", "Негізгі оқу", "06:30–08:00 — негізгі оқу мен жоспар; кешке 17:30–20:00 — екінші оқу уақыты."],
                    ["03", "Күнді қорытындылау", "20:00–21:00 — күнді қорытындылау, ашық чат және рейтинг. 22:00 — ұйқы."],
                  ].map(([number, title, text], index) => (
                    <Reveal key={number} delay={index * 80}>
                      <div className="shyraq-routine-card group flex items-center gap-4 rounded-[22px] border border-[#ece6de] bg-[#faf9f6] p-4 transition duration-300 hover:bg-white hover:shadow-[0_16px_40px_rgba(20,20,20,.06)]">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#172235] text-[10px] font-extrabold text-white">
                          {number}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[#172235]">{title}</p>
                          <p className="mt-1 text-[13px] font-medium leading-6 text-[#625a52]">{text}</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto shrink-0 text-[#b0a79f] transition-transform group-hover:translate-x-1 group-hover:text-[#FF8000]" />
                      </div>
                    </Reveal>
                  ))}
                </HorizontalRail>
              </div>
            </Reveal>

            <Reveal delay={130}>
              <div className="relative mx-auto w-full max-w-[560px]">
                <div className="absolute -inset-8 rounded-full bg-[#FF8000]/10 blur-3xl" />
                <div className="relative rounded-[34px] bg-[#172235] p-4 shadow-[0_30px_85px_rgba(11,22,38,.2)]">
                  <div className="rounded-[25px] bg-[#f8f6f1] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#9d958c]">БҮГІН</p>
                        <p className="mt-1 text-xl font-extrabold text-[#172235]">Оқу жоспары</p>
                      </div>
                      <span className="rounded-full bg-[#fff0e2] px-3 py-1.5 text-[10px] font-extrabold text-[#FF8000]">72%</span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {[
                        ["Математика практикасы", "Дайын", "25 ұпай"],
                        ["Видео: Фокус және тәртіп", "92%", "Сабақ"],
                        ["Күндік есеп", "Ашық", "1 минут"],
                      ].map(([title, state, meta], index) => (
                        <div key={title} className="rounded-2xl border border-[#eae5df] bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[9px] font-extrabold tracking-[.16em] text-[#aaa29a]">0{index + 1}</p>
                              <p className="mt-1 text-sm font-bold text-[#172235]">{title}</p>
                            </div>
                            <span className="rounded-full bg-[#f5f1eb] px-2.5 py-1 text-[9px] font-bold text-[#746c64]">{state}</span>
                          </div>
                          <p className="mt-3 text-[10px] text-[#a09991]">{meta}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#eef1f6] p-4 text-[#172235]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/50">Осы аптадағы прогресс</span>
                        <span className="font-extrabold">72%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[72%] rounded-full bg-[#FF8000]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / DEMO */}
      <section id="how-it-works" className="bg-[#fbfaf7]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-[72px] lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">SHYRAQ ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ?</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.055em] text-[#172235] sm:text-5xl">
                Бір жүйе. Күн сайынғы нақты қадам.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#7b756e]">
                Сабақ → тапсырма → прогресс.
              </p>
            </div>
          </Reveal>

          <HorizontalRail
            variant="proof"
            className="mt-8 lg:mt-10"
            ariaLabel="Shyraq қалай жұмыс істейді"
          >
            {sampleQuotes.map((quote, index) => (
              <Reveal key={quote} delay={index * 90}>
                <article className="shyraq-proof-card group relative rounded-[24px] border border-[#e9e4dc] bg-white p-5 shadow-[0_12px_30px_rgba(20,20,20,.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(20,20,20,.07)]">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFF1E2] text-[10px] font-extrabold text-[#FF8000]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <p className="mt-7 text-[20px] font-extrabold leading-[1.1] tracking-[-.035em] text-[#172235]">
                    {quote}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[#8B8179]">Shyraq ішінде</p>
                </article>
              </Reveal>
            ))}
          </HorizontalRail>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-[72px] lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[38px] bg-gradient-to-br from-[#ffe0cf] via-[#fff0e7] to-[#f0e9ff] p-6 sm:p-9 lg:p-12">
              <div className="absolute right-[-80px] top-[-120px] h-[300px] w-[300px] rounded-full bg-white/40 blur-3xl" />

              <div className="relative grid gap-10 lg:grid-cols-[1fr_.85fr] lg:items-center">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8000]">БІРІНШІ КҮНДЕН БАСТА</p>
                  <h2 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-.055em] text-[#172235] sm:text-5xl">
                    Оқуды ертеңге қалдырма.
                    <span className="text-[#FF8000]"> Бүгін баста.</span>
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-[#736a62]">
                    Тіркел. Марафонға қосыл. Бүгінгі алғашқы тапсырмаңды орындап көр.
                  </p>

                  <Link
                    href="/register"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF8000] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(255,128,0,.22)] transition hover:-translate-y-0.5"
                  >
                    Марафонға қосылу
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="mx-auto w-full max-w-[430px]">
                  <div className="rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_25px_70px_rgba(40,30,20,.1)] backdrop-blur">
                    <div className="rounded-[22px] bg-[#172235] p-5 text-white">
                      <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-white/40">БҮГІН</p>
                      <p className="mt-1 text-2xl font-extrabold">Бастауға 3 қадам</p>
                      <div className="mt-5 space-y-2.5">
                        {["Тіркеліп, профиліңді толтыр", "Бүгінгі алғашқы тапсырманы орында", "Бірінші сабақтың басталуын көр"].map((item, index) => (
                          <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[.06] px-3 py-3">
                            <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#FF8000] text-[9px] font-extrabold">
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
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#0b1423] text-white/55">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-9 lg:px-8">
          <div className="shyraq-footer-grid grid gap-5 md:grid-cols-[1.5fr_.8fr_.8fr] md:gap-10">
            <div>
              <div className="origin-left scale-[.88] sm:scale-[.92]">
                <Logo dark />
              </div>

              <p className="mt-2.5 max-w-md text-[11px] leading-5 text-white/40">
                Шырақ — жастарға тәртіп, жауапкершілік және пайдалы әдеттерді күнделікті өмірге енгізуге көмектесетін 21 күндік марафон.
              </p>

              <div className="mt-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-white/30">Бізбен бірге</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href="https://www.instagram.com/we.are.shyraq/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Shyraq Instagram"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF8000]/40 hover:bg-[#FF8000] hover:text-white hover:shadow-[0_8px_20px_rgba(255,128,0,.20)]"
                  >
                    <SocialIcon type="instagram" />
                  </a>

                  <a
                    href="https://www.tiktok.com/@we.are.shyraq"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Shyraq TikTok"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF8000]/40 hover:bg-[#FF8000] hover:text-white hover:shadow-[0_8px_20px_rgba(255,128,0,.20)]"
                  >
                    <SocialIcon type="tiktok" />
                  </a>

                  <a
                    href="https://t.me/we_are_shyraq"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Shyraq Telegram"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF8000]/40 hover:bg-[#FF8000] hover:text-white hover:shadow-[0_8px_20px_rgba(255,128,0,.20)]"
                  >
                    <SocialIcon type="telegram" />
                  </a>
                </div>
              </div>
            </div>

            <div className="md:pt-1">
              <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-white/30">Марафон</p>
              <div className="mt-2.5 space-y-1.5 text-[11px] text-white/55">
                <a href="#features" className="block transition-colors hover:text-white">Мүмкіндіктер</a>
                <a href="#marathon" className="block transition-colors hover:text-white">21 күн</a>
                <a href="#how-it-works" className="block transition-colors hover:text-white">Қалай жұмыс істейді</a>
              </div>
            </div>

            <div className="md:pt-1">
              <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-white/30">Аккаунт</p>
              <div className="mt-2.5 space-y-1.5 text-[11px] text-white/55">
                <Link href="/login" className="block transition-colors hover:text-white">Кіру</Link>
                <Link href="/register" className="block transition-colors hover:text-white">Тіркелу</Link>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-white/8 pt-4 text-[9px] text-white/25 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Shyraq. Барлық құқықтар қорғалған.</span>
            <span className="hidden sm:block">21 күн. Бір шешім. Бір қадамнан баста.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
