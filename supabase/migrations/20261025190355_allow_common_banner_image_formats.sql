-- Keep the banner upload bucket aligned with the image formats accepted by the
-- banner manager API. Preserve any existing allowed MIME types and make this
-- migration safe to re-run.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY(
  SELECT DISTINCT mime_type
  FROM unnest(
    COALESCE(allowed_mime_types, ARRAY[]::text[]) ||
    ARRAY['image/gif', 'image/avif', 'image/bmp']::text[]
  ) AS mime_type
  ORDER BY mime_type
)
WHERE id = 'banners';
