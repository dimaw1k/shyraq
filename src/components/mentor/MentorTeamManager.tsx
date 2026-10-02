"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  MessageCircle,
  RefreshCw,
  Search,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { TaskSubmissionReviewActions } from "@/components/staff/TaskSubmissionReviewActions";
import { Card, ProgressBar, StatusPill } from "@/components/ui/ShyraqUI";
import type { MentorMeetSpace, MentorReport, MentorStudent, MentorSubmission, MentorTask } from "@/lib/mentor/workspace";
import { MentorReportReviewActions } from "@/components/mentor/MentorReportReviewActions";
import { MentorTaskRequestForm } from "@/components/mentor/MentorTaskRequestForm";

type View = "dashboard" | "students" | "tasks" | "reports" | "meet";

type Message = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "О";
}

function whatsappUrl(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
  const message = "Сәлем, " + name + "! Shyraq бойынша хабарласқым келді.";
  return "https://wa.me/" + normalized + "?text=" + encodeURIComponent(message);
}

function issueOf(student: MentorStudent) {
  if (student.overdueTaskCount > 0) return { title: "Дедлайннан кешігу", detail: student.overdueTaskCount + " тапсырма", tone: "red" as const };
  if (student.todayReportMissing) return { title: "Бүгін есеп жоқ", detail: "Daily report", tone: "orange" as const };
  if (student.attendanceAverage > 0 && student.attendanceAverage < 80) return { title: "Қатысуы төмен", detail: student.attendanceAverage + "%", tone: "orange" as const };
  if (student.pendingReviewCount > 0) return { title: "Тапсырмасы тексерілуде", detail: student.pendingReviewCount + " жұмыс", tone: "orange" as const };
  return null;
}

function dateLabel(value: string | null) {
  if (!value) return "Белсенділік жоқ";
  return new Date(value).toLocaleString("kk-KZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function MentorTeamManager({
  teamId,
  teamName,
  students,
  tasks,
  submissions,
  reports,
  averageAttendance,
  pendingReviewCount,
  meetSpace,
  googleConnected,
}: {
  teamId: string;
  teamName: string;
  students: MentorStudent[];
  tasks: MentorTask[];
  submissions: MentorSubmission[];
  reports: MentorReport[];
  averageAttendance: number;
  pendingReviewCount: number;
  meetSpace: MentorMeetSpace;
  googleConnected: boolean;
}) {
  const [view, setView] = useState<View>("dashboard");
  const [selectedStudent, setSelectedStudent] = useState<MentorStudent | null>(null);
  const [query, setQuery] = useState("");
  const [meetLoading, setMeetLoading] = useState(false);
  const [meetMessage, setMeetMessage] = useState("");

  const alerts = useMemo(() => {
    return students
      .map((student) => ({ student, issue: issueOf(student) }))
      .filter((item): item is { student: MentorStudent; issue: NonNullable<ReturnType<typeof issueOf>> } => Boolean(item.issue))
      .sort((a, b) => (a.issue.tone === "red" ? -1 : b.issue.tone === "red" ? 1 : 0))
      .slice(0, 3);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("kk-KZ");
    if (!value) return students;
    return students.filter((student) => [student.full_name, student.phone, student.email].join(" ").toLocaleLowerCase("kk-KZ").includes(value));
  }, [query, students]);

  async function syncMeet() {
    setMeetLoading(true);
    setMeetMessage("");
    try {
      const response = await fetch("/api/mentor/meet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Meet синхрондау сәтсіз аяқталды.");
      setMeetMessage("Жаңартылды: " + String(data.attendanceRows ?? 0) + " қатысу жазбасы.");
    } catch (error) {
      setMeetMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setMeetLoading(false);
    }
  }

  function openView(next: View) {
    setView(next);
    window.requestAnimationFrame(() => document.getElementById("mentor-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main id="mentor-workspace" className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="space-y-4">
        <section className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[9px] font-extrabold tracking-[.08em] text-[#B95D00]">МЕНТОР</span>
              <span className="text-[10px] font-semibold text-[#9A9189]">{teamName}</span>
            </div>
            <h2 className="mt-2 text-[23px] font-extrabold tracking-[-.045em] text-[var(--foreground)]">Бүгінгі жағдай</h2>
          </div>
          <button type="button" onClick={() => openView("students")} className="inline-flex min-h-9 items-center gap-1.5 rounded-[11px] border border-[var(--border)] bg-white px-3 py-2 text-[10px] font-extrabold text-[#3F3832]">
            Команда <ArrowRight size={13} />
          </button>
        </section>

        <section className="grid gap-2.5 sm:grid-cols-3">
          <Metric label="Оқушылар" value={String(students.length)} icon={<UsersRound size={15} />} />
          <Metric label="Тексеру" value={String(pendingReviewCount)} icon={<ClipboardCheck size={15} />} />
          <Metric label="Қатысу" value={averageAttendance ? averageAttendance + "%" : "—"} icon={<CheckCircle2 size={15} />} />
        </section>

        <section className="grid gap-3 lg:grid-cols-[1.16fr_.84fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#EEE8E1] px-4 py-3.5">
              <div>
                <p className="text-[13px] font-extrabold text-[var(--foreground)]">Назар аударатындар</p>
                <p className="mt-0.5 text-[9px] font-medium text-[#9A9189]">Қазір әрекет қажет</p>
              </div>
              <button type="button" onClick={() => openView("students")} className="text-[9px] font-extrabold text-[var(--accent)]">Толығырақ</button>
            </div>
            <div className="divide-y divide-[#F0EBE5]">
              {alerts.length ? alerts.map(({ student, issue }) => (
                <button key={student.id} type="button" onClick={() => setSelectedStudent(student)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-[#FFFBF6]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#172235] text-[10px] font-extrabold text-white">{initials(student.full_name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-extrabold text-[#243044]">{student.full_name}</span>
                    <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#8F857D]">{issue.title} · {issue.detail}</span>
                  </span>
                  <StatusPill tone={issue.tone}>{issue.tone === "red" ? "Шұғыл" : "Назар"}</StatusPill>
                  <ArrowRight size={13} className="shrink-0 text-[#B6ADA4]" />
                </button>
              )) : <div className="px-4 py-7 text-center text-[10px] font-extrabold text-[#3F3832]">Қазір мәселе жоқ</div>}
            </div>
          </Card>

          <div id="meet">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-extrabold text-[var(--foreground)]">Кездесу</p>
                  <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">{meetSpace?.display_name ?? "Google Meet"}</p>
                </div>
                <StatusPill tone={meetSpace?.active ? "green" : "red"}>{meetSpace?.active ? "Қосылған" : "Қосылмаған"}</StatusPill>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {meetSpace?.meeting_url ? <a href={meetSpace.meeting_url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-[11px] bg-[var(--accent)] px-3.5 py-2 text-[10px] font-extrabold text-white"><Video size={13} /> Кіру</a> : null}
                {googleConnected ? (
                  <button type="button" onClick={() => void syncMeet()} disabled={meetLoading} className="inline-flex min-h-9 items-center gap-1.5 rounded-[11px] border border-[var(--border)] bg-white px-3.5 py-2 text-[10px] font-extrabold text-[#3F3832] disabled:opacity-50">
                    <RefreshCw size={13} className={meetLoading ? "animate-spin" : ""} /> {meetLoading ? "Жаңартылуда..." : "Жаңарту"}
                  </button>
                ) : (
                  <a href="/api/integrations/google/start" className="inline-flex min-h-9 items-center gap-1.5 rounded-[11px] bg-[#172235] px-3.5 py-2 text-[10px] font-extrabold text-white">Google қосу <ExternalLink size={12} /></a>
                )}
              </div>
              {meetMessage ? <p className="mt-3 text-[9px] font-semibold text-[#6F665E]">{meetMessage}</p> : null}
            </Card>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_.72fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#EEE8E1] px-4 py-3.5">
              <div>
                <p className="text-[13px] font-extrabold text-[var(--foreground)]">Тапсырмалар</p>
                <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">Тексеру және жаңа сұраныс</p>
              </div>
              <div className="flex items-center gap-2">
                <MentorTaskRequestForm />
                <button type="button" onClick={() => openView("tasks")} className="text-[9px] font-extrabold text-[var(--accent)]">Толығырақ</button></div>
            </div>
            <div className="divide-y divide-[#F0EBE5]">
              {submissions.filter((submission) => submission.status === "SUBMITTED").slice(0, 3).map((submission) => (
                <div key={submission.id} className="grid gap-3 px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <button type="button" onClick={() => setSelectedStudent(students.find((student) => student.id === submission.student_id) ?? null)} className="min-w-0 text-left">
                    <p className="truncate text-[10px] font-extrabold text-[#243044]">{submission.student_name}</p>
                    <p className="mt-0.5 truncate text-[9px] font-semibold text-[#8F857D]">{submission.task_title} · +{submission.task_points}</p>
                  </button>
                  <TaskSubmissionReviewActions submissionId={submission.id} status={submission.status} points={submission.task_points} />
                </div>
              ))}
              {!submissions.some((submission) => submission.status === "SUBMITTED") ? <div className="px-4 py-7 text-center text-[10px] font-extrabold text-[#3F3832]">Тексеру жоқ</div> : null}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-extrabold text-[var(--foreground)]">Есептер</p>
                <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">Бүгінгі күй</p>
              </div>
              <FileText size={15} className="text-[var(--accent)]" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniStat label="Жаңа" value={String(reports.filter((report) => report.status === "SUBMITTED").length)} />
              <MiniStat label="Есеп жоқ" value={String(students.filter((student) => student.todayReportMissing).length)} />
            </div>
            <button type="button" onClick={() => openView("reports")} className="mt-3 inline-flex w-full items-center justify-between rounded-[11px] bg-[#FFFBF6] px-3 py-2.5 text-[9px] font-extrabold text-[#7B7168]">Толығырақ <ArrowRight size={12} /></button>
          </Card>
        </section>

        {view !== "dashboard" ? (
          <WorkspacePanel view={view} students={filteredStudents} allStudents={students} tasks={tasks} submissions={submissions} query={query} onQuery={setQuery} onStudent={setSelectedStudent} onClose={() => setView("dashboard")} />
        ) : null}
      </div>

      {selectedStudent ? <StudentDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} /> : null}
    </main>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <Card className="p-3.5"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span><div><p className="text-[9px] font-extrabold uppercase tracking-[.09em] text-[#9A9189]">{label}</p><p className="mt-0.5 text-[19px] font-extrabold tracking-[-.04em] text-[var(--foreground)]">{value}</p></div></div></Card>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[12px] bg-[#FAF7F3] px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">{label}</p><p className="mt-1 text-[14px] font-extrabold text-[#243044]">{value}</p></div>;
}

function WorkspacePanel({
  view,
  students,
  allStudents,
  tasks,
  submissions,
  query,
  onQuery,
  onStudent,
  onClose,
}: {
  view: Exclude<View, "dashboard">;
  students: MentorStudent[];
  allStudents: MentorStudent[];
  tasks: MentorTask[];
  submissions: MentorSubmission[];
  query: string;
  onQuery: (value: string) => void;
  onStudent: (student: MentorStudent) => void;
  onClose: () => void;
}) {
  const titles = { students: "Команда", tasks: "Тапсырмаларды тексеру", reports: "Есептер", meet: "Кездесу" };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#EEE8E1] px-4 py-3.5">
        <div><p className="text-[13px] font-extrabold text-[var(--foreground)]">{titles[view]}</p><p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">{allStudents.length} оқушы</p></div>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-[10px] border border-[var(--border)] bg-white"><X size={14} /></button>
      </div>

      {view === "students" ? (
        <div id="students" className="p-4">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A79F]" />
            <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Оқушыны іздеу" className="h-9 w-full rounded-[11px] border border-[var(--border)] bg-white pl-9 pr-3 text-[10px] font-semibold outline-none focus:border-[var(--accent)]" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => {
              const issue = issueOf(student);
              return <button key={student.id} type="button" onClick={() => onStudent(student)} className="rounded-[14px] border border-[#EEE8E1] bg-white p-3.5 text-left transition hover:shadow-[0_8px_20px_rgba(23,34,53,.05)]">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#172235] text-[9px] font-extrabold text-white">{initials(student.full_name)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-extrabold text-[#263247]">{student.full_name}</span><span className="mt-0.5 block text-[8px] font-semibold text-[#9A9189]">{student.score} ұпай</span></span>
                  {issue ? <StatusPill tone={issue.tone}>{issue.title}</StatusPill> : null}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5"><MiniStat label="Қатысу" value={student.attendanceStatus} /><MiniStat label="Есеп" value={String(student.reportCount)} /><MiniStat label="Тапсырма" value={String(student.taskSubmittedCount)} /></div>
              </button>;
            })}
          </div>
          {!students.length ? <p className="py-8 text-center text-[10px] font-semibold text-[#9A9189]">Оқушы табылмады</p> : null}
        </div>
      ) : null}

      {view === "tasks" ? <div id="tasks" className="divide-y divide-[#F0EBE5]">
        {submissions.map((submission) => <div key={submission.id} className="grid gap-3 px-4 py-3.5 lg:grid-cols-[1fr_auto] lg:items-center">
          <button type="button" onClick={() => { const student = allStudents.find((item) => item.id === submission.student_id); if (student) onStudent(student); }} className="text-left"><p className="text-[10px] font-extrabold text-[#263247]">{submission.student_name}</p><p className="mt-0.5 text-[9px] font-semibold text-[#8F857D]">{submission.task_title} · +{submission.task_points}</p>{submission.submitted_late ? <p className="mt-1 text-[8px] font-extrabold text-[#BF514A]">Кеш тапсырылды</p> : null}</button>
          <TaskSubmissionReviewActions submissionId={submission.id} status={submission.status} points={submission.task_points} />
        </div>)}
        {!submissions.length ? <p className="px-4 py-8 text-center text-[10px] font-semibold text-[#9A9189]">Тапсырма жоқ</p> : null}
        {tasks.length ? <div className="border-t border-[#F0EBE5] px-4 py-3"><p className="text-[9px] font-extrabold text-[#6F665E]">Белсенді тапсырмалар</p><div className="mt-2 flex flex-wrap gap-2">{tasks.slice(0, 6).map((task) => <span key={task.id} className="rounded-full bg-[#FAF7F3] px-2.5 py-1.5 text-[8px] font-semibold text-[#7B7168]">{task.title}{task.deadline ? " · " + new Date(task.deadline).toLocaleDateString("kk-KZ") : ""}</span>)}</div></div> : null}
      </div> : null}

      {view === "reports" ? <div id="reports" className="divide-y divide-[#F0EBE5]">
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4"><MiniStat label="Барлығы" value={String(allStudents.length)} /><MiniStat label="Жаңа" value={String(reports.filter((report) => report.status === "SUBMITTED").length)} /><MiniStat label="Тексерілді" value={String(reports.filter((report) => report.status === "REVIEWED").length)} /><MiniStat label="Есеп жоқ" value={String(allStudents.filter((student) => student.todayReportMissing).length)} /></div>
        <div className="divide-y divide-[#F0EBE5]">
          {reports.slice(0, 20).map((report) => (
            <div key={report.id} className="grid gap-3 px-4 py-3.5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-[#263247]">{report.student_name}</p>
                <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">{new Date(report.report_date).toLocaleDateString("kk-KZ")} · {report.study_minutes} мин · {report.completed_task_count} тапсырма</p>
                {report.reflection || report.difficulties || report.next_day_goal ? (
                  <div className="mt-2 grid gap-1 text-[8px] leading-4 text-[#6F665E]">
                    {report.reflection ? <p><span className="font-extrabold">Қорытынды:</span> {report.reflection}</p> : null}
                    {report.difficulties ? <p><span className="font-extrabold">Қиындық:</span> {report.difficulties}</p> : null}
                    {report.next_day_goal ? <p><span className="font-extrabold">Келесі:</span> {report.next_day_goal}</p> : null}
                  </div>
                ) : null}
                {report.review_comment ? <p className="mt-2 text-[8px] font-semibold text-[#8F857D]">Комментарий: {report.review_comment}</p> : null}
              </div>
              <MentorReportReviewActions reportId={report.id} status={report.status} reviewComment={report.review_comment} />
            </div>
          ))}
          {!reports.length ? <p className="px-4 py-8 text-center text-[10px] font-semibold text-[#9A9189]">Есеп жоқ</p> : null}
        </div>
      </div> : null}

      {view === "meet" ? <div id="meet-panel" className="p-4 text-[10px] font-semibold text-[#6F665E]">Meet қатысуы автоматты түрде attendance тарихына түседі. Негізгі басқару жоғарыдағы Кездесу блогында.</div> : null}
    </Card>
  );
}

function StudentDrawer({ student, onClose }: { student: MentorStudent; onClose: () => void }) {
  const [chatOpen, setChatOpen] = useState(false);
  const wa = whatsappUrl(student.phone, student.full_name);

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Панельді жабу" onClick={onClose} className="absolute inset-0 bg-[#172235]/20 backdrop-blur-[2px]" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[430px] overflow-y-auto border-l border-[#E8E1DA] bg-[#FAF9F7] p-4 shadow-[-18px_0_50px_rgba(23,34,53,.12)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#172235] text-[10px] font-extrabold text-white">{initials(student.full_name)}</span>
            <div className="min-w-0"><p className="truncate text-[13px] font-extrabold text-[#243044]">{student.full_name}</p><p className="mt-0.5 truncate text-[9px] font-semibold text-[#9A9189]">{student.email}</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-[10px] border border-[var(--border)] bg-white"><X size={14} /></button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label="Ұпай" value={String(student.score)} /><MiniStat label="Қатысу" value={student.attendanceStatus} /><MiniStat label="Есеп" value={String(student.reportCount)} /></div>

        <div className="mt-4 rounded-[14px] border border-[#EEE8E1] bg-white p-3.5">
          <div className="flex items-center justify-between gap-3"><span className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">Белсенділік</span><span className="text-[9px] font-semibold text-[#71685F]">{dateLabel(student.lastActivityAt)}</span></div>
          <div className="mt-3 space-y-2"><ProgressBar value={student.videoAverage} label="Видео" /><ProgressBar value={student.attendanceAverage} label="Қатысу" /></div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setChatOpen((value) => !value)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[11px] bg-[#172235] px-3 py-2 text-[10px] font-extrabold text-white"><MessageCircle size={13} /> Чат</button>
          {wa ? <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[11px] bg-[var(--accent)] px-3 py-2 text-[10px] font-extrabold text-white">WhatsApp <ExternalLink size={12} /></a> : null}
        </div>

        {chatOpen ? <ChatPanel studentId={student.id} /> : null}
      </aside>
    </div>
  );
}

function ChatPanel({ studentId }: { studentId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mentor/chat?studentId=" + encodeURIComponent(studentId), { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Чатты жүктеу сәтсіз аяқталды.");
      setMessages(data.messages ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [studentId]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/mentor/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, body: text }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Хабарлама жіберу сәтсіз аяқталды.");
      setMessages((current) => [...current, data.message]);
      setBody("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Қате");
    } finally {
      setSending(false);
    }
  }

  return <div className="mt-3 rounded-[14px] border border-[#EEE8E1] bg-white p-3">
    <div className="flex items-center justify-between"><p className="text-[10px] font-extrabold text-[#263247]">Чат</p><button type="button" onClick={() => void load()} className="text-[9px] font-extrabold text-[var(--accent)]">Жаңарту</button></div>
    <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-[11px] bg-[#FAF7F3] p-2">
      {loading ? <p className="p-2 text-[9px] text-[#9A9189]">Жүктелуде...</p> : null}
      {!loading && !messages.length ? <p className="p-2 text-[9px] text-[#9A9189]">Хабарлама жоқ</p> : null}
      {messages.map((item) => <div key={item.id} className="rounded-[10px] bg-white px-2.5 py-2"><p className="text-[9px] leading-4 text-[#4B433C]">{item.body}</p><p className="mt-1 text-[7px] font-semibold text-[#A19890]">{dateLabel(item.created_at)}</p></div>)}
    </div>
    <div className="mt-2 flex gap-2"><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} placeholder="Хабарлама..." className="min-w-0 flex-1 resize-none rounded-[10px] border border-[var(--border)] px-2.5 py-2 text-[9px] font-semibold outline-none focus:border-[var(--accent)]" /><button type="button" onClick={() => void send()} disabled={sending || !body.trim()} className="self-end rounded-[10px] bg-[var(--accent)] px-3 py-2 text-[9px] font-extrabold text-white disabled:opacity-50">{sending ? "..." : "Жіберу"}</button></div>
    {error ? <p className="mt-2 text-[8px] font-semibold text-[#B54D2B]">{error}</p> : null}
  </div>;
}
