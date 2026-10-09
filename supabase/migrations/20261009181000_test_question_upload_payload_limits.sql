-- Keep test-question uploads inside the supported request-size envelope.
-- The API limits each upload and the aggregate newly uploaded bytes to 3 MiB.
UPDATE storage.buckets
SET
  file_size_limit = 4194304,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[],
  updated_at = now()
WHERE id = 'test-question-files';
