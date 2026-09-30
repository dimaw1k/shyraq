import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  Play,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

const stats = [
  { value: "1", label: "платформа", note: "Оқу процесінің барлық негізгі бөлігі" },
  { value: "24/7", label: "қолжетімділік", note: "Телефоннан да, компьютерден де" },
  { value: "85%", label: "video gate", note: "Сабақ → прогресс → тест" },
  { value: "1 → 1", label: "бақылау", note: "Оқушы мен ментор байланысы" },
];

const features = [
  {
    icon: Target,
    title: "Күнделікті оқу жүйесі",
    description: "Тапсырма, deadline және күнделікті есепті бір жерде ұстап, оқу тәртібін тұрақты қалыптастырыңыз.",
  },
  {
    icon: BookOpen,
    title: "Сабақ + практика",
    description: "Видео сабақтарды көріп, прогресті сақтап, қажетті деңгейге жеткенде тестке өтіңіз.",
  },
  {
    icon: BarChart3,
    title: "Прогресс нақты көрінеді",
    description: "Ұпай, сабақ прогресі, есептер және attendance бір dashboard-та жиналады.",
  },
  {
    icon: Users,
    title: "Ментор бақылауы",
    description: "Ментор оқушыларын команда бойынша көріп, кімге көбірек назар керек екенін бірден байқайды.",
  },
  {
    icon: Trophy,
    title: "Рейтинг және мотивация",
    description: "Ұпай жүйесі мен рейтинг оқу нәтижесін күн сайын көрнекі етеді.",
  },
  {
    icon: CalendarCheck2,
    title: "Meet attendance",
    description: "Google Meet қатысуы автоматты жиналып, оқушының жалпы белсенділігіне қосылады.",
  },
];

const steps = [
  ["01", "Тіркеліңіз", "Профиль жасаңыз және өз командаңызға қосылыңыз."],
  ["02", "Оқыңыз", "Сабақ, тапсырма және күнделікті есептерді орындаңыз."],
  ["03", "Нәтижені көріңіз", "Прогресс, ұпай және рейтинг арқылы қай жерде тұрғаныңызды бақылаңыз."],
];

function DemoDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
      <div className="absolute -inset-8 rounded-[42px] bg-[#ff8000]/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] p-3 shadow-[0_35px_100px_rgba(0,0,0,0.35)] sm:p-4">
        <div className="rounded-[22px] border border-white/8 bg-[#181818] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ff9a3d]">SHYRAQ</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-white">Бүгінгі прогресс</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/60">
              Оқушы
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#ff8000] to-[#ff5b00] p-4 text-white sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-white/75">Жалпы ұпай</p>
                <p className="mt-1 text-4xl font-semibold tracking-[-0.04em]">45</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Flame size={19} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-white/80">
              <span>Апталық мақсат</span>
              <span>72%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[72%] rounded-full bg-white" />
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white/55">Видео прогресі</p>
                <span className="text-[10px] text-[#ff9a3d]">Ашық</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">91.7%</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-[#ff8000]" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white/55">Attendance</p>
                <span className="text-[10px] text-emerald-300">Жақсы</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">93%</p>
              <p className="mt-2 text-[11px] leading-5 text-white/40">2 сабақ · 1 апта</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Келесі тапсырма</p>
                <p className="mt-1 text-sm font-semibold text-white">Математика практикасы</p>
              </div>
              <span className="rounded-full bg-[#ff8000]/15 px-2.5 py-1 text-[10px] font-semibold text-[#ffb36e]">25 ұпай</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-white/35">
              <span className="inline-flex items-center gap-1"><Clock3 size={12} /> Deadline жақын</span>
              <span>04 күн</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 top-8 hidden rounded-2xl border border-white/10 bg-[#1a1a1a] px-3.5 py-3 shadow-2xl sm:block lg:-right-6">
        <p className="text-[10px] font-medium text-white/45">RANKING</p>
        <p className="mt-0.5 text-lg font-semibold text-white">#04</p>
      </div>

      <div className="absolute -bottom-4 left-4 hidden rounded-2xl border border-white/10 bg-white px-3.5 py-3 shadow-2xl sm:block lg:-left-5">
        <p className="text-[10px] font-medium text-gray-400">СТАТУС</p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Белсенді
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <section className="relative overflow-hidden bg-[#0b0b0b] text-white">
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-[#ff8000]/20 blur-[140px]" />
        <div className="absolute right-[-180px] top-[240px] h-[360px] w-[360px] rounded-full bg-[#ff5b00]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8 lg:pb-24">
          <nav className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff8000] text-sm font-bold text-white shadow-[0_10px_30px_rgba(255,128,0,0.3)]">S</span>
              <span className="text-[15px] font-semibold tracking-tight">Shyraq</span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login" className="rounded-xl px-3 py-2 text-xs font-semibold text-white/65 transition-colors hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm">
                Кіру
              </Link>
              <Link href="/register" className="rounded-xl bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-900 transition-all hover:-translate-y-0.5 hover:bg-white/95 sm:px-4 sm:text-sm">
                Бастау
              </Link>
            </div>
          </nav>

          <div className="grid gap-14 pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 lg:pt-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
                <Sparkles size={12} className="text-[#ff9a3d]" />
                Student Operating System
              </div>

              <h1 className="mt-5 max-w-xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[76px]">
                Оқуды
                <span className="block text-[#ff8000]">жүйеге айналдыр.</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                Shyraq — сабақ, тапсырма, күнделікті есеп, прогресс, ментор бақылауы және рейтингті бір жерге жинайтын оқу платформасы.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="group inline-flex items-center gap-2 rounded-2xl bg-[#ff8000] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(255,128,0,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#ff8c19]">
                  Тегін бастау
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="#features" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white/80 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/[0.08]">
                  Қалай жұмыс істейді
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/40">
                <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#ff9a3d]" /> Тапсырма + deadline</span>
                <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#ff9a3d]" /> Видео progress</span>
                <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#ff9a3d]" /> Meet attendance</span>
              </div>
            </div>

            <DemoDashboard />
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-gray-100 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.value + stat.label} className="bg-white px-5 py-7 sm:px-7 sm:py-8">
              <p className="text-2xl font-semibold tracking-[-0.04em] text-gray-900 sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold text-gray-900">{stat.label}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-gray-400">{stat.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ff8000]">Бәрі бір платформада</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-gray-900 sm:text-5xl">
              Дайындық емес.
              <span className="block">Күнделікті жүйе.</span>
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-500 sm:text-base">
              Shyraq оқу процесінің ұсақ бөліктерін бір-бірімен байланыстырып, күн сайын не істеу керегін айқын етеді.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="group rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_12px_40px_rgba(17,24,39,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(17,24,39,0.08)]">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff8000]/10 text-[#e86f00] transition-transform duration-300 group-hover:scale-105">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-base font-semibold tracking-tight text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ff8000]">Қалай жұмыс істейді</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-gray-900 sm:text-5xl">
                Бір қарапайым
                <span className="block">цикл.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
                Оқушы бір жүйеге кіреді, күнделікті әрекеттерін орындайды және келесі қадамын үнемі көріп отырады.
              </p>
              <Link href="/register" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                Дәл қазір бастау
                <ArrowRight size={16} className="text-[#ff8000] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid gap-3">
              {steps.map(([number, title, description], index) => (
                <div key={number} className="group flex gap-4 rounded-[22px] border border-gray-100 bg-[#fafafa] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_40px_rgba(17,24,39,0.06)] sm:p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ff8000] text-xs font-bold text-white">{number}</div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900">{title}</p>
                    <p className="mt-1.5 text-sm leading-6 text-gray-500">{description}</p>
                  </div>
                  <span className="ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-300 transition-colors group-hover:text-[#ff8000] sm:flex">
                    <ArrowRight size={15} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0b0b0b] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ff9a3d]">Shyraq inside</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Ментор үшін де,
                <span className="block text-[#ff8000]">оқушы үшін де түсінікті.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
                Бір экранда не аяқталды, не қалып қойды, кімнің attendance-ы төмен, кім алда келе жатыр — бәрін көруге болады.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ["Оқушы", "Сабақ, тапсырма, есеп, рейтинг"],
                  ["Ментор", "Команда, attendance, прогресс"],
                  ["Админ", "Контент, teams, scoring"],
                  ["Система", "Auth, storage, analytics"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/40">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <div className="rounded-[24px] bg-white p-5 text-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">WEEKLY FOCUS</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight">Осы апта</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff8000]/10 text-[#ff8000]">
                    <Trophy size={19} />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    ["Тапсырмалар", "8 / 10", "80%"],
                    ["Күндік есеп", "5 / 7", "71%"],
                    ["Сабақ прогресі", "92%", "92%"],
                  ].map(([label, value, width]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-600">{label}</span>
                        <span className="font-semibold text-gray-900">{value}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#ff8000]" style={{ width }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#fafafa] p-3">
                    <p className="text-[10px] text-gray-400">Ұпай</p>
                    <p className="mt-1 text-lg font-semibold">45</p>
                  </div>
                  <div className="rounded-xl bg-[#fafafa] p-3">
                    <p className="text-[10px] text-gray-400">Rank</p>
                    <p className="mt-1 text-lg font-semibold">#04</p>
                  </div>
                  <div className="rounded-xl bg-[#fafafa] p-3">
                    <p className="text-[10px] text-gray-400">Streak</p>
                    <p className="mt-1 text-lg font-semibold">7</p>
                  </div>
                </div>

                <Link href="/dashboard" className="mt-5 flex items-center justify-between rounded-2xl bg-gray-900 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-black">
                  Dashboard-ты көру
                  <ChevronRight size={15} />
                </Link>
              </div>

              <div className="absolute -bottom-3 -left-3 hidden rounded-2xl bg-[#ff8000] px-4 py-3 text-white shadow-2xl sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">STREAK</p>
                <p className="mt-0.5 text-lg font-semibold">7 күн</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#ff8000]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">READY TO START</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
                Оқуды
                <span className="block">бүгін баста.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                Бір аккаунт. Бір жүйе. Күн сайын анық келесі қадам.
              </p>
            </div>

            <Link href="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-gray-900 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-white/95">
              Тегін тіркелу
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#0b0b0b] text-white/45">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#ff8000] text-[10px] font-bold text-white">S</span>
            <span>Shyraq</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/login" className="hover:text-white">Кіру</Link>
            <Link href="/register" className="hover:text-white">Тіркелу</Link>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
