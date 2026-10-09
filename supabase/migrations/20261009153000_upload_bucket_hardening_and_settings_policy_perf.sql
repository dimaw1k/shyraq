-- Defense-in-depth upload limits for the public image buckets.
-- Match the 4 MiB maximum accepted by server upload handlers (Vercel function body limit).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    RAISE EXCEPTION 'Required Storage bucket "avatars" does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banners') THEN
    RAISE EXCEPTION 'Required Storage bucket "banners" does not exist';
  END IF;
END
$$;

UPDATE storage.buckets
SET
  file_size_limit = 4194304,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

UPDATE storage.buckets
SET
  file_size_limit = 4194304,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'banners';

-- Cache auth.uid() once per statement in these per-user policies rather than
-- re-evaluating it for every matching row.
DROP POLICY IF EXISTS "student_settings_select_own" ON public.student_settings;
CREATE POLICY "student_settings_select_own"
  ON public.student_settings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "student_settings_insert_own" ON public.student_settings;
CREATE POLICY "student_settings_insert_own"
  ON public.student_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "student_settings_update_own" ON public.student_settings;
CREATE POLICY "student_settings_update_own"
  ON public.student_settings FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
