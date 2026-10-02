import type { SupabaseClient } from "@supabase/supabase-js";

export type MentorStudent = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  score: number;
  reportCount: number;
  taskSubmittedCount: number;
  attendanceAverage: number;
  videoAverage: number;
  unlockedTests: number;
  overdueTaskCount: number;
  pendingReviewCount: number;
  todayReportMissing: boolean;
  lastActivityAt: string | null;
};

export type MentorTask = {
  id: string;
  title: string;
  deadline: string | null;
  points: number;
  active: boolean;
};

export type MentorSubmission = {
  id: string;
  task_id: string;
  student_id: string;
  status: string;
  text_answer: string | null;
  link_url: string | null;
  submitted_late: boolean;
  submitted_at: string | null;
  reviewed_at: string | null;
  task_title: string;
  task_points: number;
  student_name: string;
  file_count: number;
};

export type MentorMeetSpace = {
  id: string;
  meeting_url: string | null;
  display_name: string | null;
  active: boolean;
} | null;

export type MentorReport = {
  id: string;
  student_id: string;
  student_name: string;
  report_date: string;
  status: string;
  study_minutes: number;
  completed_task_count: number;
  reflection: string | null;
  difficulties: string | null;
  next_day_goal: string | null;
  answers: Record<string, unknown>;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
};

export async function getMentorWorkspaceData(
  supabase: SupabaseClient,
  mentorId: string,
) {
  const { data: team } = await supabase
    .from("teams")
    .select("id,name,capacity,status")
    .eq("mentor_id", mentorId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!team) return null;

  const [{ data: members }, { data: tasks }, { data: meetSpace }, { data: googleConnection }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select("student_id,assigned_at,profiles(id,full_name,phone,email,status)")
        .eq("team_id", team.id)
        .eq("status", "ACTIVE"),
      supabase
        .from("tasks")
        .select("id,title,deadline,points,active")
        .eq("team_id", team.id)
        .eq("active", true)
        .order("deadline", { ascending: true, nullsFirst: false }),
      supabase
        .from("meet_spaces")
        .select("id,meeting_url,display_name,active")
        .eq("team_id", team.id)
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("google_connections")
        .select("google_email")
        .eq("user_id", mentorId)
        .maybeSingle(),
    ]);

  const students = (members ?? [])
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return profile
        ? {
            id: profile.id,
            full_name: profile.full_name,
            phone: profile.phone,
            email: profile.email,
            status: profile.status,
            assigned_at: row.assigned_at,
          }
        : null;
    })
    .filter(Boolean) as Array<{
    id: string;
    full_name: string;
    phone: string;
    email: string;
    status: string;
    assigned_at: string;
  }>;

  const studentIds = students.map((student) => student.id);
  const taskIds = (tasks ?? []).map((task) => task.id);

  const [
    { data: attendance },
    { data: reports },
    { data: submissions },
    { data: scoreEvents },
    { data: videoProgress },
  ] = await Promise.all([
    studentIds.length
      ? supabase
          .from("attendance_records")
          .select("student_id,attendance_percent,started_at,ended_at")
          .in("student_id", studentIds)
          .eq("team_id", team.id)
      : Promise.resolve({ data: [] as Array<Record<string, never>> }),
    studentIds.length
      ? supabase
          .from("daily_reports")
          .select("id,student_id,report_date,status,study_minutes,completed_task_count,reflection,difficulties,next_day_goal,answers,submitted_at,reviewed_at,review_comment")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<Record<string, never>> }),
    studentIds.length && taskIds.length
      ? supabase
          .from("task_submissions")
          .select("id,task_id,student_id,status,text_answer,link_url,submitted_late,submitted_at,reviewed_at")
          .in("student_id", studentIds)
          .in("task_id", taskIds)
          .neq("status", "DRAFT")
          .order("submitted_at", { ascending: false, nullsFirst: false })
          .limit(150)
      : Promise.resolve({ data: [] as Array<Record<string, never>> }),
    studentIds.length
      ? supabase
          .from("score_events")
          .select("student_id,points")
          .in("student_id", studentIds)
          .eq("team_id", team.id)
      : Promise.resolve({ data: [] as Array<Record<string, never>> }),
    studentIds.length
      ? supabase
          .from("video_progress")
          .select("student_id,watched_percent,test_unlocked")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<Record<string, never>> }),
  ]);

  const scoreMap = new Map<string, number>();
  const attendanceMap = new Map<string, number[]>();
  const reportCountMap = new Map<string, number>();
  const taskCountMap = new Map<string, number>();
  const lastActivityMap = new Map<string, number>();
  const videoMap = new Map<string, { total: number; count: number; unlocked: number }>();

  for (const row of scoreEvents ?? []) {
    scoreMap.set(row.student_id, (scoreMap.get(row.student_id) ?? 0) + Number(row.points ?? 0));
  }

  for (const row of attendance ?? []) {
    const values = attendanceMap.get(row.student_id) ?? [];
    values.push(Number(row.attendance_percent ?? 0));
    attendanceMap.set(row.student_id, values);
    const stamp = row.ended_at ?? row.started_at;
    if (stamp) {
      lastActivityMap.set(
        row.student_id,
        Math.max(lastActivityMap.get(row.student_id) ?? 0, Date.parse(stamp)),
      );
    }
  }

  for (const row of reports ?? []) {
    if (row.status === "SUBMITTED" || row.status === "REVIEWED") {
      reportCountMap.set(row.student_id, (reportCountMap.get(row.student_id) ?? 0) + 1);
    }
    if (row.submitted_at) {
      lastActivityMap.set(
        row.student_id,
        Math.max(lastActivityMap.get(row.student_id) ?? 0, Date.parse(row.submitted_at)),
      );
    }
  }

  for (const row of submissions ?? []) {
    if (row.status === "SUBMITTED" || row.status === "REVIEWED") {
      taskCountMap.set(row.student_id, (taskCountMap.get(row.student_id) ?? 0) + 1);
    }
    if (row.submitted_at) {
      lastActivityMap.set(
        row.student_id,
        Math.max(lastActivityMap.get(row.student_id) ?? 0, Date.parse(row.submitted_at)),
      );
    }
  }

  for (const row of videoProgress ?? []) {
    const current = videoMap.get(row.student_id) ?? { total: 0, count: 0, unlocked: 0 };
    current.total += Number(row.watched_percent ?? 0);
    current.count += 1;
    if (row.test_unlocked) current.unlocked += 1;
    videoMap.set(row.student_id, current);
  }

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const submittedSet = new Set(
    (submissions ?? [])
      .filter((submission) => submission.status === "SUBMITTED" || submission.status === "REVIEWED")
      .map((submission) => submission.student_id + ":" + submission.task_id),
  );
  const todayReports = new Set(
    (reports ?? [])
      .filter((report) => (report.status === "SUBMITTED" || report.status === "REVIEWED") && report.report_date === today)
      .map((report) => report.student_id),
  );

  const hydratedStudents: MentorStudent[] = students.map((student) => {
    const values = attendanceMap.get(student.id) ?? [];
    const video = videoMap.get(student.id);
    const overdueTaskCount = (tasks ?? []).filter((task) => {
      if (!task.deadline || Date.parse(task.deadline) >= now) return false;
      return !submittedSet.has(student.id + ":" + task.id);
    }).length;
    const pendingReviewCount = (submissions ?? []).filter(
      (submission) => submission.student_id === student.id && submission.status === "SUBMITTED",
    ).length;

    return {
      id: student.id,
      full_name: student.full_name,
      phone: student.phone,
      email: student.email,
      status: student.status,
      score: scoreMap.get(student.id) ?? 0,
      reportCount: reportCountMap.get(student.id) ?? 0,
      taskSubmittedCount: taskCountMap.get(student.id) ?? 0,
      attendanceAverage: values.length
        ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
        : 0,
      videoAverage: video?.count ? Number((video.total / video.count).toFixed(1)) : 0,
      unlockedTests: video?.unlocked ?? 0,
      overdueTaskCount,
      pendingReviewCount,
      todayReportMissing: !todayReports.has(student.id),
      lastActivityAt: lastActivityMap.get(student.id)
        ? new Date(lastActivityMap.get(student.id)).toISOString()
        : null,
    };
  });

  const reportStudentMap = new Map(students.map((student) => [student.id, student.full_name]));
  const mentorReports: MentorReport[] = (reports ?? [])
    .filter((report) => report.status !== "DRAFT")
    .sort((a, b) => String(b.report_date).localeCompare(String(a.report_date)))
    .slice(0, 100)
    .map((report) => ({
      id: report.id,
      student_id: report.student_id,
      student_name: reportStudentMap.get(report.student_id) ?? "Оқушы",
      report_date: report.report_date,
      status: report.status,
      study_minutes: Number(report.study_minutes ?? 0),
      completed_task_count: Number(report.completed_task_count ?? 0),
      reflection: report.reflection ?? null,
      difficulties: report.difficulties ?? null,
      next_day_goal: report.next_day_goal ?? null,
      answers: (report.answers ?? {}) as Record<string, unknown>,
      submitted_at: report.submitted_at ?? null,
      reviewed_at: report.reviewed_at ?? null,
      review_comment: report.review_comment ?? null,
    }));

  const taskRows: MentorTask[] = (tasks ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    deadline: task.deadline,
    points: Number(task.points ?? 0),
    active: Boolean(task.active),
  }));

  const taskMap = new Map(taskRows.map((task) => [task.id, task]));
  const nameMap = new Map(students.map((student) => [student.id, student.full_name]));

  const mentorSubmissions: MentorSubmission[] = (submissions ?? []).map((submission) => ({
    id: submission.id,
    task_id: submission.task_id,
    student_id: submission.student_id,
    status: submission.status,
    text_answer: submission.text_answer,
    link_url: submission.link_url,
    submitted_late: Boolean(submission.submitted_late),
    submitted_at: submission.submitted_at,
    reviewed_at: submission.reviewed_at,
    task_title: taskMap.get(submission.task_id)?.title ?? "Тапсырма",
    task_points: Number(taskMap.get(submission.task_id)?.points ?? 0),
    student_name: nameMap.get(submission.student_id) ?? "Оқушы",
    file_count: 0,
  }));

  const averageAttendance = attendance?.length
    ? Number(
        (
          attendance.reduce((sum, row) => sum + Number(row.attendance_percent ?? 0), 0) /
          attendance.length
        ).toFixed(1),
      )
    : 0;

  return {
    team,
    students: hydratedStudents,
    tasks: taskRows,
    submissions: mentorSubmissions,
    reports: mentorReports,
    averageAttendance,
    pendingReviewCount: mentorSubmissions.filter((submission) => submission.status === "SUBMITTED").length,
    meetSpace: meetSpace
      ? {
          id: meetSpace.id,
          meeting_url: meetSpace.meeting_url,
          display_name: meetSpace.display_name,
          active: Boolean(meetSpace.active),
        }
      : null,
    googleConnected: Boolean(googleConnection?.google_email),
  };
}
