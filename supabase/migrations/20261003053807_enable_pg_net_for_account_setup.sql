-- The production project already has pg_net enabled for account setup.
-- Keep the migration reproducible for fresh databases as well.
create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;
