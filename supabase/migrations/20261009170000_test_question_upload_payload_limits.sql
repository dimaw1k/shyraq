-- Keep question-file uploads within the Vercel multipart request envelope.
-- The API additionally enforces a 3 MiB total payload for newly uploaded files.
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
  ]
WHERE id = 'test-question-files';
