export type AttendanceSession = { start: Date | string; end: Date | string };

export function sessionSeconds(session: AttendanceSession): number {
  const start = new Date(session.start).getTime();
  const end = new Date(session.end).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? Math.floor((end - start) / 1000) : 0;
}

export function totalAttendanceSeconds(sessions: AttendanceSession[]): number {
  return sessions.reduce((sum, session) => sum + sessionSeconds(session), 0);
}

export function attendancePercent(attendedSeconds: number, meetingDurationSeconds: number): number {
  if (meetingDurationSeconds <= 0) return 0;
  return Math.min(100, Math.max(0, (attendedSeconds / meetingDurationSeconds) * 100));
}
