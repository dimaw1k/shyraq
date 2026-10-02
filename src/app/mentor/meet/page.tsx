import { CalendarDays, ExternalLink, Video } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { MentorMeetSync } from "@/components/mentor/MentorMeetSync";
import { getMentorPageData } from "@/lib/mentor/auth";

export default async function MentorMeetPage() {
  const { profile, workspace } = await getMentorPageData();

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title="Кездесу" description={workspace?.team.name}>
      <PageContainer>
        {!workspace ? <Card className="p-8 text-center"><EmptyState title="Команда бекітілмеген." /></Card> : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">БЕЙНЕ КЕЗДЕСУ</p>
                  <h2 className="mt-1 text-[20px] font-extrabold text-[#172235]">{workspace.meetSpace?.display_name ?? "Кездесу кеңістігі"}</h2>
                  <p className="mt-1 text-[10px] font-semibold text-[#9A9189]">Командаға арналған негізгі кездесу.</p>
                </div>
                <StatusPill tone={workspace.meetSpace?.active ? "green" : "red"}>{workspace.meetSpace?.active ? "Белсенді" : "Қосылмаған"}</StatusPill>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {workspace.meetSpace?.meeting_url ? (
                  <a href={workspace.meetSpace.meeting_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-[11px] bg-[#FF8000] px-4 py-2.5 text-[10px] font-extrabold text-white"><Video size={14} /> Кездесуге кіру</a>
                ) : null}
                <MentorMeetSync teamId={workspace.team.id} googleConnected={workspace.googleConnected} />
                {workspace.meetSpace?.meeting_url ? <a href={workspace.meetSpace.meeting_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-[11px] border border-[#E8E3DD] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#3F3832]"><ExternalLink size={13} /> Сілтемені ашу</a> : null}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E2] text-[#FF8000]"><CalendarDays size={16} /></span>
                <div>
                  <p className="text-[13px] font-extrabold text-[#172235]">Қатысу</p>
                  <p className="text-[9px] font-semibold text-[#9A9189]">Оқушы статустары</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {workspace.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between gap-3 rounded-[11px] border border-[#EFE8E1] bg-[#FFFCF9] px-3.5 py-3">
                    <div className="min-w-0"><p className="truncate text-[10px] font-extrabold text-[#263247]">{student.full_name}</p><p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">{student.attendanceAverage ? student.attendanceAverage + "%" : "Белгі жоқ"}</p></div>
                    <StatusPill tone={student.attendanceStatus === "Қатысты" ? "green" : student.attendanceStatus === "Қатыспады" ? "red" : "neutral"}>{student.attendanceStatus}</StatusPill>
                  </div>
                ))}
                {!workspace.students.length ? <p className="py-5 text-center text-[9px] text-[#9A9189]">Оқушы жоқ.</p> : null}
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
