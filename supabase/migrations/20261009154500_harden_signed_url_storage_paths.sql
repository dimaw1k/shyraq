-- Prevent user-writable file metadata from being used to mint signed URLs
-- for a different student's Storage object. Signed-URL APIs also verify these
-- prefixes, so this database constraint is defense in depth.

DROP POLICY IF EXISTS submission_files_student_insert ON public.submission_files;
CREATE POLICY submission_files_student_insert
  ON public.submission_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.task_submissions AS s
      WHERE s.id = submission_files.submission_id
        AND s.student_id = (SELECT auth.uid())
        AND left(
          submission_files.storage_path,
          length(s.student_id::text || '/' || s.id::text || '/')
        ) = s.student_id::text || '/' || s.id::text || '/'
    )
  );

DROP POLICY IF EXISTS report_files_student_insert ON public.report_files;
CREATE POLICY report_files_student_insert
  ON public.report_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.daily_reports AS r
      WHERE r.id = report_files.report_id
        AND r.student_id = (SELECT auth.uid())
        AND left(
          report_files.storage_path,
          length(r.student_id::text || '/reports/' || r.id::text || '/' || report_files.slot::text || '/')
        ) = r.student_id::text || '/reports/' || r.id::text || '/' || report_files.slot::text || '/'
    )
  );
