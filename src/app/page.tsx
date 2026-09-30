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

const achievements = [
  ["01", "Бір орта", "Сабақ, тапсырма, есеп, рейтинг — бір жерде."],
  ["02", "Нақты прогресс", "Әр орындалған қадам жүйеде белгіленеді."],
  ["03", "Ментор бақылауы", "Команданың жағдайы бір экранда көрінеді."],
  ["04", "Жүйелі ритм", "Күн сайын не істеу керегі анық."],
  ["05", "Мотивация", "Ұпай, streak және рейтинг прогресті жандандырады."],
];

const journey = [
  {
    icon: BookOpen,
    title: "Оқу жоспары",
    label: "Бүгін",
    text: "Сабақтарыңды, тапсырмаларыңды және deadline-дарыңды бір жерден көр.",
    accent: "from-[#fff0e1] to-[#ffd9bc]",
  },
  {
    icon: BarChart3,
    title: "Өз прогресің",
    label: "92%",
    text: "Видео көруі, тапсырмалар, есептер және attendance бір графикке жиналады.",
    accent: "from-[#efe8ff] to-[#cfe0ff]",
  },
  {
    icon: Trophy,
    title: "Нәтижең",
    label: "#04",
    text: "Ұпайың мен рейтингіңді көр. Келесі деңгейге не жетпей тұрғанын біл.",
    accent: "from-[#e1fbf3] to-[#cff1f3]",
  },
];

const roles = [
  {
    title: "Оқушы",
    text: "Бүгін не істеу керек екенін бірден көріп, күн сайын нақты қадаммен алға жылжиды.",
    icon: Target,
  },
  {
    title: "Ментор",
    text: "Командадағы белсенділік, тапсырмалар және attendance арқылы кімге назар керек екенін байқайды.",
    icon: Users,
  },
  {
    title: "Админ",
    text: "Сабақтарды, тесттерді, командаларды және ұпай ережелерін бір басқару орталығынан жүргізеді.",
    icon: Layers3,
  },
];

const mentors = [
  ["А", "Айдана", "Математика", "98%", "A"],
  ["Н", "Нұрсұлтан", "Информатика", "94%", "N"],
  ["М", "Мөлдір", "Ағылшын", "96%", "M"],
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff7a00] text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(255,122,0,.18)]">S</span>
      <span className={`text-[15px] font-extrabold tracking-[-.02em] ${dark ? "text-white" : "text-[#121a26]"}`}>Shyraq</span>
    </Link>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[950px]">
      <div className="absolute -inset-10 rounded-[50px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,122,0,.34),rgba(255,122,0,0)_62%)] blur-2xl" />
      <div className="relative rounded-[34px] border-[10px] border-[#15233a] bg-[#e9e6de] p-2 shadow-[0_45px_110px_rgba(11,22,38,.24)] sm:border-[12px] sm:p-3">
        <div className="rounded-[22px] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0e2] text-[#ff7a00]"><Sparkles size={17} /></div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9f988f]">SHYRAQ / DASHBOARD</p>
                <p className="mt-0.5 text-sm font-extrabold text-[#162032]">Бүгінгі оқу</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#e9e5df] px-3 py-1.5 text-[10px] font-semibold text-[#827b73] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Белсенді
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-[22px] bg-gradient-to-br from-[#ff8b16] via-[#ff7a00] to-[#ee6200] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-white/72">Апталық нәтиже</p>
                  <p className="mt-1 text-4xl font-extrabold tracking-[-.05em]">45 <span className="text-lg font-semibold text-white/55">ұпай</span></p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Flame size={18} /></div>
              </div>
              <div className="mt-5 flex items-center justify-between text-[10px] font-semibold text-white/80">
                <span>Оқу мақсаты</span><span>72%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[72%] rounded-full bg-white" /></div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-white/75">
                <Check size={12} /> Бүгін 3 негізгі қадам орындалды
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[22px] border border-[#ece7df] bg-[#faf8f4] p-4">
                <div className="flex items-center justify-between text-[10px] text-[#9c948b]">
                  <span>Видео прогресі</span><span className="font-bold text-[#ff7a00]">АШЫҚ</span>
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#162032]">91.7%</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9e5df]"><div className="h-full w-[92%] rounded-full bg-[#ff7a00]" /></div>
              </div>
              <div className="rounded-[22px] border border-[#ece7df] bg-[#faf8f4] p-4">
                <div className="flex items-center justify-between text-[10px] text-[#9c948b]">
                  <span>Рейтинг</span><span className="font-bold text-[#162032]">ТОП 5</span>
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#162032]">#04</p>
                <p className="mt-2 text-[10px] text-[#9b938a]">Команда бойынша</p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {[
              ["Бүгінгі тапсырма", "Математика практикасы", "25 ұпай"],
              ["Күндік есеп", "Бүгінгі оқу қорытындысы", "1 минут"],
              ["Meet", "Кешкі сабақ", "18:00"],
            ].map(([k, v, meta]) => (
              <div key={k} className="rounded-[20px] border border-[#ebe6df] bg-white p-4">
                <p className="text-[10px] text-[#a19a91]">{k}</p>
                <p className="mt-1.5 text-sm font-bold text-[#182236]">{v}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-[#999087]">
                  <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {meta}</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-4 hidden rounded-2xl bg-white px-4 py-3 shadow-[0_20px_45px_rgba(20,20,20,.14)] sm:block">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#aaa29a]">STREAK</p>
        <p className="mt-1 text-sm font-extrabold text-[#162032]">7 күн қатарынан</p>
      </div>
    </div>
  );
}

function MiniLessonCard({ title, color, index }: { title: string; color: string; index: string }) {
  return (
    <div className={`group rounded-[26px] bg-gradient-to-br ${color} p-4 shadow-[0_16px_40px_rgba(20,20,20,.07)] transition-transform duration-300 hover:-translate-y-1`}>
      <div className="rounded-[20px] bg-white/92 p-4 backdrop-blur">
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[.16em] text-[#a09a92]">
          <span>LESSON {index}</span><span className="text-[#ff7a00]">NEW</span>
        </div>
        <div className="mt-4 rounded-2xl bg-[#162032] p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/55">Видео сабақ</p>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[9px]">12:45</span>
          </div>
          <div className="mt-5 grid h-20 place-items-center rounded-xl bg-gradient-to-br from-[#253c60] to-[#15233a]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#162032] shadow-xl"><Play size={15} fill="currentColor" /></span>
          </div>
          <p className="mt-3 text-sm font-bold">{title}</p>
          <div className="mt-3 flex items-center justify-between text-[9px] text-white/45">
            <span>Прогресс</span><span>78%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[78%] rounded-full bg-[#ff7a00]" /></div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#162032]">
      <ScrollProgress />

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_50%_28%,rgba(255,156,100,.22),transparent_52%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-5 sm:px-6 sm:pb-14 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <Logo />
            <div className="hidden items-center rounded-full border border-[#e8e4dc] bg-[#152032] p-1 shadow-sm sm:flex">
              {["Басты бет", "Сабақтар", "Мүмкіндіктер", "Рейтинг", "Ментор"].map((item, index) => (
                <a key={item} href={index === 0 ? "#" : "#features"} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${index === 0 ? "bg-white text-[#162032] shadow-sm" : "text-white/70 hover:text-white"}`}>{item}</a>
              ))}
            </div>
            <Link href="/register" className="rounded-full bg-[#ff6f2c] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(255,111,44,.22)] transition hover:-translate-y-0.5">Қазір бастау <Sparkles size={13} className="ml-1 inline" /></Link>
          </nav>

          <div className="mt-7 rounded-[34px] bg-gradient-to-br from-[#ffe8dc] via-[#ffd9cf] to-[#fff1e7] px-5 pb-10 pt-12 sm:px-10 sm:pt-14 lg:px-16 lg:pt-16">
            <Reveal className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#6f625a] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff6f2c]" />
                Оқу процесің. Бір кеңістікте.
              </div>
              <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[.98] tracking-[-.06em] text-[#152032] sm:text-6xl lg:text-[78px]">
                Оқуыңды <span className="relative inline-block whitespace-nowrap">жеңілдетіп<span className="absolute -inset-x-2 bottom-0 -z-0 h-[72%] rounded-md bg-white/85" /></span>,
                <span className="block">нәтижеңді <span className="text-[#ff6f2c]">өсір.</span></span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#766b64] sm:text-base">
                Shyraq сабақтарды, тапсырмаларды, күндік есептерді, прогресті және командаңды бір қарапайым жүйеге біріктіреді.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="rounded-full bg-[#ff6f2c] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(255,111,44,.22)] transition hover:-translate-y-0.5">Тегін бастау <ArrowRight size={16} className="ml-1 inline" /></Link>
                <Link href="#features" className="rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-[#162032] shadow-sm transition hover:-translate-y-0.5">Мүмкіндіктерді көру</Link>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-[#887a72]">
                {["Тапсырма", "Видео progress", "Meet attendance", "Рейтинг"].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check size={12} className="text-[#ff6f2c]" />{item}</span>)}
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {["Д","А","Н","М"].map((letter) => <span key={letter} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#152032] text-[10px] font-bold text-white">{letter}</span>)}
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#3b332e]">Оқушыға — анық бағыт.</p>
                  <p className="text-[10px] text-[#857970]">Менторға — толық көрініс.</p>
                </div>
              </div>
            </Reveal>

            <Reveal className="relative mx-auto mt-10 max-w-5xl" delay={180}>
              <DashboardMockup />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">Shyraq-та не өзгереді?</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] text-[#152032] sm:text-5xl">Оқу процесі шашырамайды.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#7b756e] sm:text-base">Барлық маңызды әрекет бір жүйеге түскенде, қай жерде тұрғаныңды түсіну әлдеқайда оңай.</p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map(([n, title, text], index) => (
              <Reveal key={n} delay={index * 70}>
                <div className={`rounded-[22px] border border-[#ece7df] bg-[#faf9f6] p-5 shadow-[0_10px_30px_rgba(20,20,20,.035)] ${index === 0 ? "lg:col-span-2" : ""}`}>
                  <p className="text-[9px] font-extrabold tracking-[.18em] text-[#ff6f2c]">{n}</p>
                  <p className="mt-2 text-base font-extrabold text-[#182236]">{title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-[#817970]">{text}</p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ece6de]"><div className="h-full rounded-full bg-gradient-to-r from-[#ff6f2c] to-[#ffad70]" style={{ width: index === 0 ? "92%" : index === 1 ? "84%" : index === 2 ? "76%" : index === 3 ? "67%" : "88%" }} /></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#fbfaf7]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">Оқу жолы</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] text-[#152032] sm:text-5xl">Күрделі нәрсені жеңілдет.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#7b756e]">Үш қарапайым қадам. Біртұтас оқу ритмі.</p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {journey.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 100}>
                  <MiniLessonCard title={item.title} color={item.accent} index={"0" + (index + 1)} />
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#101b2c] text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <Reveal>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff9b3b]">Оқу процесі</p>
                <h2 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-.05em] sm:text-5xl">
                  Жай оқу емес.
                  <span className="block text-[#ff7a00]">Жүйелі дайындық.</span>
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-white/55 sm:text-base">Сен оқумен айналысасың. Ал Shyraq прогресті жинайды: не көрдің, не орындадың, қанша қатыстын және келесі қадамың қандай.</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Тапсырма", "Deadline мен статус"],
                    ["Сабақ", "Видео + тест"],
                    ["Meet", "Attendance"],
                    ["Рейтинг", "Ұпай + streak"],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                      <p className="text-xs font-bold text-white">{title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/40">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative mx-auto w-full max-w-[480px]">
                <div className="absolute -inset-7 rounded-full bg-[#ff7a00]/15 blur-3xl" />
                <div className="relative rounded-[34px] border border-white/10 bg-[#1a273a] p-4 shadow-[0_30px_80px_rgba(0,0,0,.25)]">
                  <div className="rounded-[25px] bg-[#f8f6f1] p-5 text-[#152032]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#9e978e]">DAILY FOCUS</p>
                        <p className="mt-1 text-lg font-extrabold">Бүгін</p>
                      </div>
                      <span className="rounded-full bg-[#fff0e2] px-3 py-1.5 text-[10px] font-extrabold text-[#ff6f2c]">72%</span>
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        ["Математика практикасы", "Дайын"],
                        ["Видео: Фокус және тәртіп", "92%"],
                        ["Күндік есеп", "Ашық"],
                      ].map(([title, state], i) => (
                        <div key={title} className="rounded-2xl border border-[#ece7df] bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] text-[#9c948b]">0{i + 1}</p>
                              <p className="mt-1 text-sm font-bold">{title}</p>
                            </div>
                            <span className="rounded-full bg-[#f6f2eb] px-2.5 py-1 text-[9px] font-bold text-[#6f675f]">{state}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-2xl bg-[#152032] p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/50">Апта мақсаты</span>
                        <span className="text-xs font-bold">72%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#ff7a00]" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">Кім үшін?</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] text-[#152032] sm:text-5xl">Бір платформа. Үш рөл.</h2>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {roles.map((role, index) => {
              const Icon = role.icon;
              return (
                <Reveal key={role.title} delay={index * 90}>
                  <article className="group rounded-[26px] border border-[#ece7df] bg-white p-6 shadow-[0_10px_35px_rgba(20,20,20,.045)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(20,20,20,.08)]">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e2] text-[#ff6f2c]"><Icon size={20} /></div>
                    <h3 className="mt-5 text-lg font-extrabold">{role.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#777067]">{role.text}</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#152032]">Толығырақ <ArrowRight size={14} className="text-[#ff6f2c]" /></div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ee]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">Команда</p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] text-[#152032] sm:text-5xl">Менторды таңда. Ырғақты ұстап тұр.</h2>
              </div>
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#152032]">Командаға қосылу <ArrowRight size={16} className="text-[#ff6f2c]" /></Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {mentors.map(([initial, name, subject, score], index) => (
              <Reveal key={name} delay={index * 90}>
                <article className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(20,20,20,.06)]">
                  <div className={`relative h-56 ${index === 0 ? "bg-gradient-to-br from-[#ffd6bd] via-[#ffe9df] to-[#d6eaff]" : index === 1 ? "bg-gradient-to-br from-[#d6dcff] via-[#efe8ff] to-[#ffd7b8]" : "bg-gradient-to-br from-[#d9fff1] via-[#dce9ff] to-[#ffe0ee]"}`}>
                    <div className="absolute bottom-4 left-4 grid h-20 w-20 place-items-center rounded-[24px] border-4 border-white bg-[#152032] text-2xl font-extrabold text-white shadow-xl">{initial}</div>
                    <div className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1.5 text-[9px] font-extrabold text-[#152032] backdrop-blur">{score} нәтиже</div>
                  </div>
                  <div className="p-5">
                    <p className="text-lg font-extrabold">{name}</p>
                    <p className="mt-1 text-xs text-[#8a8279]">{subject} · Ментор</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-[#6e665e]"><Users size={14} /> Командамен жұмыс</span>
                      <span className="font-extrabold text-[#ff6f2c]">Белсенді</span>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#162032] text-white">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff9b3b]">Ойын емес — мотивация</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Прогресті ойнақы ет.</h2>
              <p className="mt-4 text-sm leading-6 text-white/55">Streak, ұпай, рейтинг және кішкентай жеңістер — күнделікті оқу ритмін ұстап тұру үшін.</p>
            </div>
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-4xl" delay={120}>
            <div className="rounded-[34px] border border-white/10 bg-white/[.04] p-4 shadow-[0_30px_80px_rgba(0,0,0,.25)]">
              <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                <div className="rounded-[26px] bg-gradient-to-br from-[#ff7a00] to-[#ff9657] p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/70">CURRENT STREAK</p>
                      <p className="mt-1 text-6xl font-extrabold tracking-[-.06em]">7</p>
                      <p className="mt-1 text-sm text-white/72">күн қатарынан</p>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><Flame size={22} /></div>
                  </div>
                  <div className="mt-10 flex items-center justify-between text-[10px] font-bold">
                    <span>Апта мақсаты</span><span>5 / 7</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[71%] rounded-full bg-white" /></div>
                </div>
                <div className="rounded-[26px] bg-white p-6 text-[#152032]">
                  <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#aaa198]">RANKING</p>
                  <div className="mt-4 space-y-3">
                    {[["#01", "Айдана", "82"], ["#02", "Нұрсұлтан", "77"], ["#03", "Мөлдір", "69"], ["#04", "Динислам", "45"]].map(([rank, name, points]) => (
                      <div key={rank} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${rank === "#04" ? "bg-[#fff0e2]" : "bg-[#f7f5f0]"}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-extrabold text-[#9f978e]">{rank}</span>
                          <span className="text-sm font-bold">{name}</span>
                        </div>
                        <span className="text-xs font-extrabold text-[#ff6f2c]">{points} ұпай</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-[30px] bg-gradient-to-br from-[#ffe1cf] via-[#fff0e6] to-[#efe7ff] p-6 sm:p-8 lg:p-10">
              <div className="grid gap-10 lg:grid-cols-[1fr_.95fr] lg:items-center">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff6f2c]">Келесі қадам</p>
                  <h2 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-.05em] text-[#152032] sm:text-5xl">Бастауың қиын емес. <span className="text-[#ff6f2c]">Жүйелі болу маңызды.</span></h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-[#736a62]">Бір аккаунтпен тіркел. Командаңа қосыл. Бүгінгі алғашқы қадамыңды орында.</p>
                  <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff6f2c] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(255,111,44,.22)] transition hover:-translate-y-0.5">Тегін бастау <ArrowRight size={16} /></Link>
                </div>
                <div className="relative">
                  <div className="mx-auto max-w-[440px] rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_25px_70px_rgba(40,30,20,.1)]">
                    <div className="rounded-[22px] bg-[#152032] p-5 text-white">
                      <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-white/40">TODAY</p>
                      <p className="mt-1 text-2xl font-extrabold">Алғашқы қадам</p>
                      <div className="mt-5 space-y-2.5">
                        {["Профильді аяқтау", "Бір тапсырманы орындау", "Сабақтың 20%-ын көру"].map((item, i) => (
                          <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[.06] px-3 py-3">
                            <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#ff7a00] text-[9px] font-extrabold">{String(i + 1).padStart(2, "0")}</span>
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
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <Logo dark />
              <p className="mt-4 max-w-xs text-xs leading-6 text-white/40">Оқу процесін бір жүйеге жинайтын заманауи платформа.</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/35">Платформа</p>
              <div className="mt-4 space-y-2.5 text-xs"><a href="#features" className="block hover:text-white">Мүмкіндіктер</a><a href="#features" className="block hover:text-white">Оқу жолы</a><Link href="/rankings" className="block hover:text-white">Рейтинг</Link></div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/35">Аккаунт</p>
              <div className="mt-4 space-y-2.5 text-xs"><Link href="/login" className="block hover:text-white">Кіру</Link><Link href="/register" className="block hover:text-white">Тіркелу</Link><Link href="/settings" className="block hover:text-white">Баптаулар</Link></div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/35">Shyraq</p>
              <div className="mt-4 space-y-2.5 text-xs"><span className="block">Студенттер үшін</span><span className="block">Менторлар үшін</span><span className="block">Команда үшін</span></div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/8 pt-5 text-[10px] text-white/30">© 2026 Shyraq. Барлық құқықтар қорғалған.</div>
        </div>
      </footer>
    </main>
  );
}
