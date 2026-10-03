import Link from "next/link";
import { MARATHON_WEEKS } from "@/lib/marathon";

export function MarathonDayNavigator({
  basePath,
  selectedDay,
}: {
  basePath: string;
  selectedDay: number;
}) {
  const safeDay = Number.isInteger(selectedDay) && selectedDay >= 1 && selectedDay <= 21 ? selectedDay : 1;
  const activeWeek = MARATHON_WEEKS.find(
    (week) => safeDay >= week.startDay && safeDay <= week.endDay,
  ) ?? MARATHON_WEEKS[0];

  return (
    <div className="space-y-2.5 rounded-[22px] border border-[#E8E1DA] bg-white p-2.5 shadow-[0_10px_30px_rgba(23,34,53,.035)]">
      <div className="grid grid-cols-3 gap-1.5">
        {MARATHON_WEEKS.map((week) => {
          const active = week.week === activeWeek.week;
          return (
            <Link
              key={week.week}
              href={basePath + "?day=" + week.startDay}
              className={[
                "rounded-[14px] px-3 py-3 text-center transition",
                active
                  ? "border border-[#FFD6AE] bg-[#FFF1E2] text-[#B95D00]"
                  : "text-[#6F665E] hover:bg-[#FAF7F3]",
              ].join(" ")}
            >
              <span className="block text-[10px] font-extrabold uppercase tracking-[.12em]">
                {week.week}-апта
              </span>
              <span className="mt-1 block text-[10px] font-semibold">
                {week.startDay}–{week.endDay} күн
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {Array.from({ length: activeWeek.endDay - activeWeek.startDay + 1 }, (_, index) => {
          const day = activeWeek.startDay + index;
          const active = day === safeDay;
          return (
            <Link
              key={day}
              href={basePath + "?day=" + day}
              className={[
                "min-w-[62px] rounded-[12px] px-3 py-2.5 text-center transition",
                active
                  ? "bg-[#FF8000] text-white shadow-[0_8px_18px_rgba(255,128,0,.14)]"
                  : "border border-[#EEE7E1] bg-[#FFFCF9] text-[#6F665E] hover:border-[#FFD6AE] hover:text-[#B95D00]",
              ].join(" ")}
            >
              <span className="block text-[10px] font-extrabold">{day}-күн</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
