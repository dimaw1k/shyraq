import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffTaskSubmissionRow = {
  id: string;
  task_id: string;
  student_id: string;
  status: string;
  text_answer: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  task_title: string;
  task_points: number;
  student_name: string;
  file_count: number;
};

export async function getStaffTaskSubmissions(
  supabase: SupabaseClient,
  limit = 150,
): Promise<StaffTaskSubmissionRow[]> {
  const { data: submissions, error } = await supabase
    .from("task_submissions")
    .select("id,task_id,student_id,status,text_answer,link_url,submitted_late,submitted_at,reviewed_at,reviewed_by")
    .neq("status", "DRAFT")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !submissions?.length) return [];

  const taskIds = [...new Set(submissions.map((submission) => submission.task_id))];
  const studentIds = [...new Set(submissions.map((submission) => submission.student_id))];
  const submissionIds = submissions.map((submission) => submission.id);

  const [{ data: tasks }, { data: students }, { data: files }] = await Promise.all([
    supabase.from("tasks").select("id,title,points").in("id", taskIds),
    supabase.from("profiles").select("id,full_name").in("id", studentIds),
    supabase.from("submission_files").select("submission_id").in("submission_id", submissionIds),
  ]);

  const taskMap = new Map((tasks ?? []).map((task) => [task.id, task]));
  const studentMap = new Map((students ?? []).map((student) => [student.id, student.full_name]));
  const fileCounts = new Map<string, number>();

  for (const file of files ?? []) {
    fileCounts.set(file.submission_id, (fileCounts.get(file.submission_id) ?? 0) + 1);
  }

  return submissions.map((submission) => ({
    id: submission.id,
    task_id: submission.task_id,
    student_id: submission.student_id,
    status: submission.status,
    text_answer: submission.text_answer,
    link_url: submission.link_url,
    submitted_late: Boolean(submission.submitted_late),
    submitted_at: submission.submitted_at,
    reviewed_at: submission.reviewed_at,
    reviewed_by: submission.reviewed_by,
    task_title: taskMap.get(submission.task_id)?.title ?? "Тапсырма",
    task_points: Number(taskMap.get(submission.task_id)?.points ?? 0),
    student_name: studentMap.get(submission.student_id) ?? "Оқушы",
    file_count: fileCounts.get(submission.id) ?? 0,
  }));
}
