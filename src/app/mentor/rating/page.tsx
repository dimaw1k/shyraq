import { Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { getMentorPageData } from "@/lib/mentor/auth";

export default async function MentorRatingPage() {
  const { profile, workspace } = await getMentorPageData();

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title="Рейтинг" description={workspace?.team.name}>
      <PageContainer>
        {!workspace ? <Card className="p-8 text-center"><EmptyState title="Команда бекітілмеген." /></Card> : (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">РЕЙТИНГ</p>
                <h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Командадағы нәтиже</h2>
              </div>
              <Trophy size={17} className="text-[#FF8000]" />
            </div>
            <div className="divide-y divide-[#EFE8E1]">
              {[...workspace.students].sort((a, b) => b.score - a.score).map((student, index) => (
                <div key={student.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-extrabold text-[#263247]">{student.full_name}</p>
                    <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">Тапсырма {student.taskSubmittedCount}</p>
                  </div>
                  <StatusPill tone={index === 0 ? "orange" : "neutral"}>{student.score} ұпай</StatusPill>
                </div>
              ))}
              {!workspace.students.length ? <div className="p-8"><EmptyState title="Рейтинг үшін оқушы жоқ." /></div> : null}
            </div>
          </Card>
        )}
      </PageContainer>
    </AppShell>
  );
}
