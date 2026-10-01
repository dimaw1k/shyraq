import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Layers3,
  MessageSquare,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import {
  AppShell,
  UserChip,
} from "@/components/app/AppNav";
import {
  Card,
  MetricCard,
  PageContainer,
  PrimaryLink,
  ProgressBar,
  SectionHeader,
  SecondaryLink,
  StatusPill,
} from "@/components/ui/ShyraqUI";

export type StaffPreviewRole = "MENTOR" | "CHIEF_MENTOR" | "LEADER";

const students = [
  { name: "Аян Серік", team: "Алатау", activity: 94, attendance: 96, task: "2 тексеру", tone: "green" as const },
  { name: "Мадина Әли", team: "Алатау", activity: 87, attendance: 91, task: "Есеп күтуде", tone: "orange" as const },
  { name: "Нұрислам Қанат", team: "Алатау", activity: 72, attendance: 78, task: "1 қайтарады", tone: "red" as const },
  { name: "Аружан Талғат", team: "Алатау", activity: 98, attendance: 100, task: "Дайын", tone: "green" as const },
];

const mentors = [
  { name: "Айдана С.", team: "Алатау", students: 64, activity: 94, workload: "Жоғары" },
  { name: "Дамир К.", team: "Самғау", students: 61, activity: 89, workload: "Қалыпты" },
  { name: "Аружан М.", team: "Тұлпар", students: 63, activity: 86, workload: "Қалыпты" },
  { name: "Нұрбек Е.", team: "Болашақ", students: 59, activity: 78, workload: "Назарда" },
];

const staffRows = [
  { name: "Әсел Т.", role: "Главный ментор", scope: "5 ментор • 5 команда", status: "Белсенді", tone: "green" as const },
  { name: "Айдана С.", role: "Ментор", scope: "Алатау • 64 оқушы", status: "Белсенді", tone: "green" as const },
  { name: "Дамир К.", role: "Ментор", scope: "Самғау • 61 оқушы", status: "Белсенді", tone: "green" as const },
  { name: "Нұрбек Е.", role: "Ментор", scope: "Болашақ • 59 оқушы", status: "Назарда", tone: "orange" as const },
];

function RolePreviewBadge({ role }: { role: StaffPreviewRole }) {
  const label = role === "LEADER" ? "ЛИДЕР" : role === "CHIEF_MENTOR" ? "ГЛАВНЫЙ МЕНТОР" : "МЕНТОР";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#E8E1DA] bg-white px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#766E66] shadow-[0_8px_24px_rgba(23,34,53,.04)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#FF6F2C]" />
      {label} • DESIGN
    </span>
  );
}

function WorkspaceHero({
  role,
  eyebrow,
  title,
  description,
}: {
  role: StaffPreviewRole;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="overflow-hidden border-[#DDD5CC] p-6 sm:p-8">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <RolePreviewBadge role={role} />
          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF6F2C]">{eyebrow}</p>
          <h1 className="mt-2 text-[30px] font-extrabold tracking-[-.055em] text-[#172235] sm:text-[38px]">{title}</h1>
          <p className="mt-3 max-w-2xl text-[12px] font-medium leading-6 text-[#7B726A]">{description}</p>
        </div>
        <div className="grid min-w-[220px] gap-2 sm:grid-cols-2 lg:w-[250px] lg:grid-cols-1">
          <div className="rounded-[18px] bg-[#172235] p-4 text-white">
            <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-white/40">Бүгін</p>
            <p className="mt-2 text-[22px] font-extrabold tracking-[-.04em]">01 қазан</p>
            <p className="mt-1 text-[10px] text-white/55">Алматы • марафонның 18-күні</p>
          </div>
          <Link href="#analytics" className="group rounded-[18px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 transition hover:-translate-y-0.5 hover:bg-white">
            <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#9A9189]">КӨРУ</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[12px] font-extrabold text-[#172235]">Толық аналитика</span>
              <ArrowRight size={15} className="text-[#FF6F2C] transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function MentorWorkspace() {
  return (
    <>
      <WorkspaceHero
        role="MENTOR"
        eyebrow="МЕНІҢ КОМАНДАМ • КҮНДЕЛІКТІ БАСҚАРУ"
        title="Командаңның ритмі бір экранда."
        description="Ментордың басты назары — өзіне бекітілген оқушылар, тапсырмаларды тексеру, күндік есептер, қатысу және Meet."
      />

      <section id="team" className="scroll-mt-8 space-y-4">
        <SectionHeader
          eyebrow="КОМАНДА"
          title="Бүгінгі командаң"
          description="Кім тұрақты, кімге назар керек — бірден көрінеді."
          action={<SecondaryLink href="#team">Толық тізім</SecondaryLink>}
        />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="ОҚУШЫ" value="64" hint="бекітілген" icon={<Users size={17} />} />
          <MetricCard label="БЕЛСЕНДІЛІК" value="91%" hint="соңғы 7 күн" icon={<Activity size={17} />} />
          <MetricCard label="ATTENDANCE" value="93%" hint="орташа" icon={<Video size={17} />} />
          <MetricCard label="КҮТІЛГЕН ЕСЕП" value="7" hint="бүгін тексеру" icon={<FileText size={17} />} />
        </section>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">TEAM PULSE</p>
              <h2 className="mt-1 text-[17px] font-extrabold text-[#172235]">Оқушылар жағдайы</h2>
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#9A9189]">64 оқушы</span>
          </div>
          <div className="divide-y divide-[#EFE8E1]">
            {students.map((student) => (
              <div key={student.name} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.3fr_.8fr_.7fr_auto] sm:items-center sm:px-6">
                <div>
                  <p className="text-[12px] font-extrabold text-[#283446]">{student.name}</p>
                  <p className="mt-1 text-[9px] font-medium text-[#9A9189]">{student.team} • бүгінгі ритм</p>
                </div>
                <ProgressBar value={student.activity} label="Белсенділік" />
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.11em] text-[#A19890]">Meet</p>
                  <p className="mt-1 text-[11px] font-extrabold text-[#172235]">{student.attendance}%</p>
                </div>
                <StatusPill tone={student.tone}>{student.task}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="tasks" className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">REVIEW QUEUE</p>
              <h2 className="mt-1 text-[17px] font-extrabold text-[#172235]">Тапсырмаларды тексеру</h2>
            </div>
            <span className="rounded-full bg-[#FFF0E8] px-2.5 py-1 text-[9px] font-extrabold text-[#D65E25]">7 күтілуде</span>
          </div>
          <div className="divide-y divide-[#EFE8E1]">
            {[
              ["Мадина Әли", "Күндік есеп • 30.09", "Қарау керек", "orange"],
              ["Аян Серік", "Математика • Тапсырма 12", "Дайын", "green"],
              ["Нұрислам Қанат", "Физика • Қайта тапсыру", "Мәселе", "red"],
            ].map(([name, meta, status, tone]) => (
              <div key={name} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#F6F2ED] text-[#6E665E]"><ClipboardCheck size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold text-[#2E394A]">{name}</p>
                  <p className="mt-1 truncate text-[9px] font-medium text-[#9A9189]">{meta}</p>
                </div>
                <StatusPill tone={tone as "orange" | "green" | "red"}>{status}</StatusPill>
              </div>
            ))}
          </div>
        </Card>

        <div id="meet" className="space-y-5">
          <Card dark className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-white/45">MEET</p>
                <h2 className="mt-2 text-[18px] font-extrabold">Алатау • Бүгін 19:00</h2>
                <p className="mt-2 text-[10px] leading-5 text-white/55">64 оқушының қатысуын бақылау және кейінгі attendance есебі.</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-white/10"><Video size={17} /></span>
            </div>
            <div className="mt-5 flex gap-2">
              <PrimaryLink href="#meet" className="!bg-white !text-[#172235] !shadow-none">Meet-ке кіру</PrimaryLink>
              <SecondaryLink href="#meet" className="!border-white/10 !bg-white/10 !text-white">Қатысуды көру</SecondaryLink>
            </div>
          </Card>

          <div id="reports"><Card className="p-5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">REPORTS</p>
            <h2 className="mt-1.5 text-[17px] font-extrabold text-[#172235]">Күндік есептер</h2>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div><p className="text-[30px] font-extrabold tracking-[-.06em] text-[#172235]">57/64</p><p className="mt-1 text-[9px] text-[#9A9189]">бүгін жіберілді</p></div>
              <div className="w-28"><ProgressBar value={89} /></div>
            </div>
          </Card></div>
        </div>
      </section>
    </>
  );
}

function ChiefMentorWorkspace() {
  return (
    <>
      <WorkspaceHero
        role="CHIEF_MENTOR"
        eyebrow="МЕНТОРЛАРДЫ БАСҚАРУ • КҮНДЕЛІКТІ ОПЕРАЦИЯ"
        title="Менторлардың жұмысын бір деңгей жоғарыдан басқар."
        description="Главный ментордың негізгі кеңістігі — барлық менторлар, командалар, контент, есептер және оқушылардың жалпы ритмі."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="МЕНТОР" value="6" hint="белсенді" icon={<Users size={17} />} />
        <MetricCard label="КОМАНДА" value="6" hint="қазір жұмыс істеп тұр" icon={<Layers3 size={17} />} />
        <MetricCard label="БЕЛСЕНДІЛІК" value="88%" hint="оқушылар орташа" icon={<Activity size={17} />} />
        <MetricCard label="ЕСЕП" value="92%" hint="уақытында тапсырылды" icon={<FileText size={17} />} />
      </section>

      <section id="mentors" className="space-y-4">
        <SectionHeader eyebrow="МЕНТОРЛАР" title="Менторлар жағдайы" description="Кімге қолдау, кімде жүктеме көп — бір экранда." />
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.35fr_.9fr_.75fr_.9fr_100px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
            <span>Ментор</span><span>Команда</span><span>Оқушы</span><span>Белсенділік</span><span>Жүктеме</span>
          </div>
          <div className="divide-y divide-[#EFE8E1]">
            {mentors.map((mentor) => (
              <div key={mentor.name} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.35fr_.9fr_.75fr_.9fr_100px] sm:items-center sm:px-6">
                <div><p className="text-[12px] font-extrabold text-[#283446]">{mentor.name}</p><p className="mt-1 text-[9px] text-[#9A9189]">Жұмыс ритмі • бақылау</p></div>
                <span className="text-[10px] font-extrabold text-[#4B433C]">{mentor.team}</span>
                <span className="text-[10px] font-extrabold text-[#4B433C]">{mentor.students}</span>
                <ProgressBar value={mentor.activity} />
                <StatusPill tone={mentor.workload === "Назарда" ? "orange" : "green"}>{mentor.workload}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="teams" className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">КОМАНДАЛАР</p><h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Команда денсаулығы</h2></div>
            <Link href="#teams" className="text-[10px] font-extrabold text-[#FF6F2C]">Толық көру</Link>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ["Алатау", 94, "Тұрақты"],
              ["Самғау", 89, "Тұрақты"],
              ["Тұлпар", 86, "Тұрақты"],
              ["Болашақ", 78, "Назарда"],
            ].map(([name, score, state]) => (
              <div key={name}>
                <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[11px] font-extrabold text-[#334053]">{name}</span><span className="text-[10px] font-extrabold text-[#172235]">{score}%</span></div>
                <ProgressBar value={Number(score)} />
                <p className="mt-1.5 text-[9px] font-medium text-[#A19890]">{state} • оқушы ритмі</p>
              </div>
            ))}
          </div>
        </Card>

        <div id="lessons"><Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">КОНТЕНТ</p><h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Келесі жарияланым</h2></div>
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><BookOpen size={16} /></span>
          </div>
          <div className="mt-5 rounded-[18px] border border-[#EFE8E1] bg-[#FFFCF9] p-4">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#A19890]">САБАҚ 19</p>
            <h3 className="mt-1.5 text-[15px] font-extrabold text-[#172235]">Функция және график</h3>
            <p className="mt-1.5 text-[10px] leading-5 text-[#8B8179]">Kinescope • 27 мин • тест тіркелген</p>
            <div className="mt-4 flex gap-2">
              <PrimaryLink href="#lessons"><Plus size={14} />Жаңа сабақ</PrimaryLink>
              <SecondaryLink href="#tasks">Тапсырмалар</SecondaryLink>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-[16px] bg-[#F6F2ED] p-3"><p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">ЖАРИЯЛАНДЫ</p><p className="mt-1.5 text-[18px] font-extrabold text-[#172235]">18</p></div>
            <div className="rounded-[16px] bg-[#F6F2ED] p-3"><p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">КҮТІЛУДЕ</p><p className="mt-1.5 text-[18px] font-extrabold text-[#172235]">3</p></div>
          </div>
        </Card></div>
      </section>

      <section id="reports" className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">ЕСЕПТЕР</p>
          <h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Менторлардың есеп беруі</h2>
          <div className="mt-5 space-y-3">
            {[
              ["Айдана С.", "64/64 есеп", "green"],
              ["Дамир К.", "60/61 есеп", "green"],
              ["Аружан М.", "57/63 есеп", "orange"],
            ].map(([name, value, tone]) => (
              <div key={name} className="flex items-center gap-3 rounded-[15px] bg-[#FFFCF9] p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">{name.split(" ").map((x)=>x[0]).join("")}</span>
                <div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold text-[#354153]">{name}</p><p className="mt-1 text-[9px] font-medium text-[#9A9189]">{value}</p></div>
                <StatusPill tone={tone as "green" | "orange"}>{tone === "green" ? "Жақсы" : "Назарда"}</StatusPill>
              </div>
            ))}
          </div>
        </Card>

        <div id="analytics"><Card dark className="p-5 sm:p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/40">АНАЛИТИКА</p>
          <h2 className="mt-1.5 text-[19px] font-extrabold">Оқушы нәтижесі өсіп келеді.</h2>
          <p className="mt-2 max-w-lg text-[10px] leading-5 text-white/55">Бұл экранда кейін нақты team-level және mentor-level деректер байланысады. Қазір макетте олардың иерархиясы көрсетілген.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[17px] bg-white/8 p-3"><p className="text-[9px] uppercase tracking-[.12em] text-white/40">ACTIVITY</p><p className="mt-1.5 text-[22px] font-extrabold">88%</p></div>
            <div className="rounded-[17px] bg-white/8 p-3"><p className="text-[9px] uppercase tracking-[.12em] text-white/40">ATTENDANCE</p><p className="mt-1.5 text-[22px] font-extrabold">91%</p></div>
            <div className="rounded-[17px] bg-white/8 p-3"><p className="text-[9px] uppercase tracking-[.12em] text-white/40">REPORTS</p><p className="mt-1.5 text-[22px] font-extrabold">92%</p></div>
          </div>
        </Card></div>
      </section>

      <section id="tasks" className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">ЖЕДЕЛ ӘРЕКЕТ</p>
          <h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Контентті толықтыру</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            <PrimaryLink href="#lessons"><Plus size={14} />Сабақ қосу</PrimaryLink>
            <SecondaryLink href="#tasks"><Plus size={14} />Тапсырма қосу</SecondaryLink>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">БАҚЫЛАУ</p>
          <h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Назардағы ментор</h2>
          <p className="mt-2 text-[11px] font-medium leading-5 text-[#7E756D]">Нұрбек Е. • 59 оқушы • белсенділік 78%. Главный ментор осы жерде action жібере алады.</p>
          <SecondaryLink href="#mentors" className="mt-4">Менторды ашу <ArrowRight size={14} /></SecondaryLink>
        </Card>
      </section>
    </>
  );
}

function LeaderWorkspace() {
  return (
    <>
      <WorkspaceHero
        role="LEADER"
        eyebrow="МАРАФОННЫҢ ЖОҒАРҒЫ БАСҚАРУ ДЕҢГЕЙІ"
        title="Марафонның бүкіл ритмін бір орталықтан көр."
        description="Лидердің кеңістігі — ең жоғары қызметкерлік кабинет. Мұнда главный ментор, менторлар, командалар, оқушылар, контент және жалпы нәтиже бөлек бөлімдерге бөлінеді."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="ГЛАВНЫЙ МЕНТОР" value="1" hint="операциялық жетекші" icon={<ShieldCheck size={17} />} />
        <MetricCard label="МЕНТОР" value="6" hint="барлығы" icon={<Users size={17} />} />
        <MetricCard label="ОҚУШЫ" value="312" hint="марафонда" icon={<Users size={17} />} />
        <MetricCard label="ЖАЛПЫ БЕЛСЕНДІЛІК" value="84%" hint="соңғы 7 күн" icon={<BarChart3 size={17} />} />
      </section>

      <section id="staff" className="space-y-4">
        <SectionHeader eyebrow="ҚЫЗМЕТКЕРЛЕР" title="Штабтың қазіргі жағдайы" description="Лидер бірінші кезекте қызметкерлер мен олардың нәтижесін көреді." />
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.25fr_1.1fr_1.2fr_100px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
            <span>Қызметкер</span><span>Рөл</span><span>Жұмыс көлемі</span><span>Статус</span>
          </div>
          <div className="divide-y divide-[#EFE8E1]">
            {staffRows.map((row) => (
              <div key={row.name} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.25fr_1.1fr_1.2fr_100px] sm:items-center sm:px-6">
                <div><p className="text-[12px] font-extrabold text-[#283446]">{row.name}</p><p className="mt-1 text-[9px] text-[#9A9189]">{row.scope}</p></div>
                <span className="text-[10px] font-extrabold text-[#4B433C]">{row.role}</span>
                <ProgressBar value={row.role === "Главный ментор" ? 97 : row.name === "Нұрбек Е." ? 74 : 89} />
                <StatusPill tone={row.tone}>{row.status}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="teams" className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">КОМАНДАЛАР</p><h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Жалпы нәтижелер</h2></div><Trophy size={17} className="text-[#FF6F2C]" /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Алатау", "64", "94%"],
              ["Самғау", "61", "89%"],
              ["Тұлпар", "63", "86%"],
              ["Болашақ", "59", "78%"],
            ].map(([name, studentsCount, activity]) => (
              <div key={name} className="rounded-[18px] border border-[#EFE8E1] bg-[#FFFCF9] p-4">
                <div className="flex items-center justify-between"><p className="text-[12px] font-extrabold text-[#334053]">{name}</p><span className="text-[10px] font-extrabold text-[#172235]">{studentsCount} оқушы</span></div>
                <div className="mt-4"><ProgressBar value={Number(activity)} label="Белсенділік" /></div>
              </div>
            ))}
          </div>
        </Card>

        <div id="students"><Card dark className="p-5 sm:p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/40">ОҚУШЫЛАР</p>
          <h2 className="mt-1.5 text-[22px] font-extrabold">312</h2>
          <p className="mt-2 text-[10px] leading-5 text-white/55">Жалпы база, белсенділік, attendance, есептер және рейтинг кейін осы бөлімдерден жеке ашылады.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-[17px] bg-white/8 p-3"><p className="text-[9px] text-white/40">ACTIVE</p><p className="mt-1.5 text-[18px] font-extrabold">286</p></div>
            <div className="rounded-[17px] bg-white/8 p-3"><p className="text-[9px] text-white/40">WAITING</p><p className="mt-1.5 text-[18px] font-extrabold">26</p></div>
          </div>
        </Card></div>
      </section>

      <section id="content" className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">КОНТЕНТ</p><h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Марафон контентінің күйі</h2></div><BookOpen size={17} className="text-[#FF6F2C]" /></div>
          <div className="mt-5 space-y-3">
            {[
              ["Сабақтар", "18 жарияланған", "Жаңа сабақ 01 қазан", "green"],
              ["Тапсырмалар", "43 белсенді", "7 мерзімі бүгін", "orange"],
              ["Тесттер", "18 дайын", "2 қайта қарауда", "orange"],
            ].map(([label, value, hint, tone]) => (
              <div key={label} className="flex items-center gap-3 rounded-[16px] bg-[#FFFCF9] p-3.5">
                <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><BookOpen size={15} /></span>
                <div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold text-[#354153]">{label}</p><p className="mt-1 text-[9px] text-[#9A9189]">{value} • {hint}</p></div>
                <StatusPill tone={tone as "green" | "orange"}>{tone === "green" ? "Дайын" : "Назарда"}</StatusPill>
              </div>
            ))}
          </div>
        </Card>

        <div id="analytics"><Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">АНАЛИТИКА</p><h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Марафонның жалпы ритмі</h2></div><BarChart3 size={17} className="text-[#FF6F2C]" /></div>
          <div className="mt-5 space-y-5">
            <div><div className="mb-2 flex justify-between text-[10px] font-extrabold text-[#7B726A]"><span>Оқушы белсенділігі</span><span>84%</span></div><ProgressBar value={84} /></div>
            <div><div className="mb-2 flex justify-between text-[10px] font-extrabold text-[#7B726A]"><span>Attendance</span><span>91%</span></div><ProgressBar value={91} /></div>
            <div><div className="mb-2 flex justify-between text-[10px] font-extrabold text-[#7B726A]"><span>Есептер</span><span>92%</span></div><ProgressBar value={92} /></div>
          </div>
        </Card></div>
      </section>

      <section id="audit" className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">ЖУРНАЛ</p><h2 className="mt-1 text-[17px] font-extrabold text-[#172235]">Соңғы маңызды әрекеттер</h2></div><MoreHorizontal size={17} className="text-[#9A9189]" /></div>
          <div className="divide-y divide-[#EFE8E1]">
            {[
              ["Главный ментор", "Сабақ 18 жарияланды", "10:12"],
              ["Айдана С.", "Командаға 2 оқушы қосты", "09:48"],
              ["Дамир К.", "7 тапсырманы тексерді", "09:31"],
            ].map(([actor, action, time]) => (
              <div key={actor + action} className="flex items-center gap-3 px-5 py-4 sm:px-6"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#172235] text-white"><MessageSquare size={14} /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold text-[#354153]">{actor}</p><p className="mt-1 truncate text-[9px] text-[#9A9189]">{action}</p></div><span className="text-[9px] font-semibold text-[#A19890]">{time}</span></div>
            ))}
          </div>
        </Card>

        <div id="settings"><Card className="p-5 sm:p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">ЖЕДЕЛ БАСҚАРУ</p>
          <h2 className="mt-1.5 text-[18px] font-extrabold text-[#172235]">Лидер әрекеттері</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <SecondaryLink href="#staff">Қызметкерлер</SecondaryLink>
            <SecondaryLink href="#teams">Командалар</SecondaryLink>
            <SecondaryLink href="#content">Контент</SecondaryLink>
            <SecondaryLink href="#analytics">Аналитика</SecondaryLink>
          </div>
        </Card></div>
      </section>
    </>
  );
}

export function StaffWorkspaceMock({ role }: { role: StaffPreviewRole }) {
  const meta = {
    MENTOR: { userName: "Айдана С.", title: "Ментор кабинеті", description: "Өз командаңның күнделікті жұмыс кеңістігі." },
    CHIEF_MENTOR: { userName: "Әсел Т.", title: "Главный ментор кабинеті", description: "Барлық менторлар мен командалардың операциялық кеңістігі." },
    LEADER: { userName: "Данияр М.", title: "Лидер кабинеті", description: "Марафонның ең жоғары қызметкерлік басқару кеңістігі." },
  }[role];

  return (
    <AppShell role={role} userName={meta.userName} title={meta.title} description={meta.description} right={<UserChip name={meta.userName} role={role} />}>
      <PageContainer>
        <div className="space-y-6">
          {role === "MENTOR" ? <MentorWorkspace /> : null}
          {role === "CHIEF_MENTOR" ? <ChiefMentorWorkspace /> : null}
          {role === "LEADER" ? <LeaderWorkspace /> : null}
        </div>
      </PageContainer>
    </AppShell>
  );
}
