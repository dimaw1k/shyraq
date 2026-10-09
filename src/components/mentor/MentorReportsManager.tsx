"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, Clock3, Download, FileText, MessageSquareText, Paperclip } from "lucide-react";
import { MentorReportReviewActions } from "@/components/mentor/MentorReportReviewActions";
import { StatusPill } from "@/components/ui/ShyraqUI";
import type { MentorReport } from "@/lib/mentor/workspace";

function answerLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function answerValue(value: unknown) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function MentorReportsManager({ reports }: { reports: MentorReport[] }) {
  const [openId, setOpenId] = useState<string | null>(reports[0]?.id ?? null);

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E8E1DA] bg-white shadow-[0_14px_40px_rgba(23,34,53,.045)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
            КҮНДЕЛІКТІ ЕСЕП
          </p>
          <h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Оқушы есептері</h2>
        </div>
        <span className="rounded-full bg-[#FFF1E2] px-3 py-1.5 text-[10px] font-extrabold text-[#B95D00]">
          {reports.filter((report) => report.status === "SUBMITTED").length} жаңа
        </span>
      </div>

      <div className="divide-y divide-[#EFE8E1]">
        {reports.map((report) => {
          const open = openId === report.id;

          return (
            <div key={report.id} className="bg-white">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : report.id)}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#FFFBF6] sm:px-6"
                aria-expanded={open}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#FFF1E2] text-[#FF8000]">
                  <FileText size={17} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-extrabold text-[#263247]">
                    {report.student_name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-[#9A9189]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} />
                      {report.report_date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {report.study_minutes} мин
                    </span>
                    <span>{report.completed_task_count} тапсырма</span>
                  </span>
                </span>

                <StatusPill tone={report.status === "REVIEWED" ? "green" : "orange"}>
                  {report.status}
                </StatusPill>

                <ChevronDown
                  size={17}
                  className={open ? "shrink-0 rotate-180 text-[#FF8000] transition-transform" : "shrink-0 text-[#A19890] transition-transform"}
                />
              </button>

              {open ? (
                <div className="border-t border-[#F0EBE6] bg-[#FFFCF9] px-5 py-5 sm:px-6">
                  <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
                    <div className="space-y-3">
                      <div className="rounded-[18px] border border-[#EAE3DC] bg-white p-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#A19890]">
                          ОҚУ ҚОРЫТЫНДЫСЫ
                        </p>
                        <p className="mt-2 text-[12px] font-semibold leading-6 text-[#3F3832]">
                          {report.reflection || "Оқушы қорытынды жазба енгізбеген."}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[18px] border border-[#EAE3DC] bg-white p-4">
                          <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#A19890]">
                            ҚИЫНДЫҚ
                          </p>
                          <p className="mt-2 text-[11px] font-semibold leading-5 text-[#5F5750]">
                            {report.difficulties || "Қиындық көрсетілмеген."}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-[#EAE3DC] bg-white p-4">
                          <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#A19890]">
                            КЕЛЕСІ КҮН МАҚСАТЫ
                          </p>
                          <p className="mt-2 text-[11px] font-semibold leading-5 text-[#5F5750]">
                            {report.next_day_goal || "Келесі күнге мақсат көрсетілмеген."}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[18px] border border-[#EAE3DC] bg-white p-4">
                        <div className="flex items-center gap-2">
                          <Paperclip size={15} className="text-[#FF8000]" />
                          <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#A19890]">
                            ЕСЕПКЕ ТІРКЕЛГЕН ФАЙЛДАР
                          </p>
                        </div>
                        {report.files?.length ? (
                          <div className="mt-3 space-y-2">
                            {report.files.map((file) => (
                              <a
                                key={file.id}
                                href={"/api/reports/files/download?fileId=" + encodeURIComponent(file.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-[14px] border border-[#F0EBE6] bg-[#FFFCF9] px-3.5 py-3 transition hover:border-[#FFDDBB] hover:bg-[#FFF9F3]"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block break-all text-[11px] font-bold text-[#403830]">{file.file_name}</span>
                                  <span className="mt-1 block text-[9px] font-semibold text-[#9A9189]">
                                    {file.slot.replace(/_/g, " ")} · {(file.size_bytes / (1024 * 1024)).toFixed(2)} МБ
                                  </span>
                                </span>
                                <Download size={14} className="shrink-0 text-[#C25100]" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-[11px] font-semibold text-[#9A9189]">Есепке файл тіркелмеген.</p>
                        )}
                      </div>

                      <div className="rounded-[18px] border border-[#EAE3DC] bg-white p-4">
                        <div className="flex items-center gap-2">
                          <MessageSquareText size={15} className="text-[#FF8000]" />
                          <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#A19890]">
                            ҚОСЫМША ЖАУАПТАР
                          </p>
                        </div>
                        <div className="mt-3 space-y-2">
                          {Object.entries(report.answers ?? {}).length ? (
                            Object.entries(report.answers ?? {}).map(([key, value]) => (
                              <div key={key} className="rounded-[14px] bg-[#FAF7F3] px-3.5 py-3">
                                <p className="text-[10px] font-extrabold text-[#6E655D]">{answerLabel(key)}</p>
                                <p className="mt-1 whitespace-pre-wrap text-[11px] font-semibold leading-5 text-[#403830]">
                                  {answerValue(value)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] font-semibold text-[#9A9189]">Қосымша жауап жоқ.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-[#EAE3DC] bg-white p-4 h-fit">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#A19890]">
                        ЕСЕПТІ БАҒАЛАУ
                      </p>
                      <p className="mt-2 text-[11px] font-semibold leading-5 text-[#6E655D]">
                        Есепті толық қарап шығып, комментарий қалдырыңыз немесе қайта орындауға жіберіңіз.
                      </p>
                      <div className="mt-4">
                        <MentorReportReviewActions
                          reportId={report.id}
                          status={report.status}
                          reviewComment={report.review_comment}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {!reports.length ? (
          <div className="px-6 py-12 text-center text-sm font-semibold text-[#9A9189]">
            Есеп жоқ.
          </div>
        ) : null}
      </div>
    </div>
  );
}
