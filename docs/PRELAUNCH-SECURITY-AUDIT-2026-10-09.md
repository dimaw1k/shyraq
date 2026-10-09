# Shyraq pre-release security audit — 2026-10-09

## Scope

Focused source review of the current application code for authentication and staff authorization boundaries, input validation, video-gate enforcement, test submission integrity, uploaded-file access, storage constraints, configuration writes and CI signals. This is a targeted code audit, not a formal penetration test or proof that all vulnerabilities are absent.

## Changes proposed in this branch

- Validate Chief Mentor settings and score-rule updates, validate request bytes before JSON parsing, enforce value/type bounds and return database write errors instead of silently ignoring them.
- Add a shared rate limit for video progress updates; cap body size before parsing; reject malformed payloads and remove repeated per-request playback grace.
- Keep the current atomic test-editor database RPC and add strict request/field limits to its API, including file signature checks, MIME allow-list, a 3 MiB aggregate file bound and text/number bounds.
- Bound student test answer payloads to 64 KiB and free-text answers to 5,000 characters while preserving the atomic attempt-and-answers RPC.
- Validate stored attachment paths before generating temporary signed URLs.
- Add a migration constraining the test-question storage bucket size/MIME types.

## Deployment caution

This branch alone does not change production. Before merging, inspect the Supabase migration dry run against the actual database. Reconcile the migration history and live schema first; do not assume a migration is applied because equivalent SQL may have been run manually. The repository's vercel.json disables Git-based Vercel deployments, so a merge does not prove that the live frontend received the change.

## Validation and remaining work

- GitHub Actions should run the repository's existing typecheck, lint and production build on this pull request. Those checks do not replace runtime tests.
- Verify Supabase Auth leaked-password protection and production environment variables.
- Confirm RLS/policy behavior with real Supabase roles, including service-role-only RPC grants and Storage bucket policies.
- Exercise registration/login, student/mentor/leader/chief-mentor authorization, lesson/team gates, test retries/history, uploads/downloads, Google OAuth/Meet sync and cron authentication against staging.
- Run database migrations only after the migration dry run is clean, then check production health and application logs.
