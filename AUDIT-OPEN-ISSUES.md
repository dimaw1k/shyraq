# Shyraq pre-launch security audit — 2026-10-10

## Status

**Status: conditional go, not a claim of zero vulnerabilities.** Source review and the connected Supabase checks found and fixed several important issues, and the code-quality pipeline passed on the corresponding pull-request commits. A current production smoke test with real student/staff sessions and Google OAuth is still required before handing the platform to a client.

Audit scope: GitHub source and migration history, staff/student API authorization patterns, Supabase RLS/function grants/storage configuration, key data-integrity invariants, GitHub Actions CI, npm audit findings and Vercel deployment configuration. This was not a third-party penetration test and did not include a full set of authenticated end-to-end browser tests.

## Fixes merged to main

- PR #80 — shared rate limits on high-impact student/support/file and Meet mutations.
- PR #81 — make Supabase migration-ledger repair conditional; preserve dry-run before deployment.
- PR #82 — ignore all local `.env*` files except `.env.example`.
- PR #84 — add bounded pruning for expired rate-limit buckets.
- PR #85 — require active status for mentor pages.
- PR #87 — support multiple MORNING/EVENING/EXTRA Meet spaces and composite-key updates.
- PR #88 — rate-limit phone/password updates that verify the current password.
- PR #89 — make high/critical npm audit findings visible in CI output.
- PR #90 — track and verify Google-account ownership for Meet spaces; repair per-space/cron/manual sync logic; add Meet owner migration and clearer Google connection UI.
- PR #91 — rate-limit high-impact staff mutations, including test/lesson/team/task/report-review/settings/staff-role/support/banner/score-rule operations.

Relevant repo: https://github.com/dimaw1k/shyraq

## Verified checks

### Application and CI

- `npm ci`: passed.
- `npm run typecheck`: passed on the validated PR #91 head.
- `npm run lint`: passed on the validated PR #91 head.
- `npm run build`: passed on the validated PR #91 head.
- Snyk status: passed for PR #91.
- Netlify deploy preview: passed for PR #91.
- The normal CI run on main after PR #91 merge was queued at the time this note was written; re-check it before release.

These checks establish that the reviewed source type-checks, lints and builds. They do not prove that every user flow works against production integrations.

### Supabase

- Project was reported ACTIVE_HEALTHY; Postgres 17.6.
- All tables in the exposed `public` schema had RLS enabled; query returned no public tables with RLS disabled.
- No public/anon table grants and no public views were found in the audited schema.
- Reviewed public SECURITY DEFINER functions were not executable by `PUBLIC`, `anon` or `authenticated`; execution was restricted to `service_role`.
- Integrity queries returned zero for: auth users missing profiles, profiles missing auth users, duplicate normalized phones, students with multiple active team memberships, inactive mentors assigned to active teams, orphaned video-progress rows, test answers without attempts and attempts without tests.
- Profile phone numbers matched the `+7XXXXXXXXXX` shape; email/phone uniqueness indexes were present.
- The Supabase migration workflow successfully dry-ran and deployed the migrations through `20261010081000_track_meet_space_google_owner`.
- The Meet owner index/trigger/RLS policies were found after deployment; the trigger helper was not executable by authenticated users.
- The rate-limit store's cleanup migration was applied; it keeps hashed keys, uses a service-role-only RPC, and prunes a bounded batch of stale entries opportunistically.

### Storage

- `avatars`: public, JPEG/PNG/WebP, 5 MiB configured limit.
- `banners`: public, JPEG/PNG/WebP, 8 MiB configured limit.
- `submissions`: private, allowed image/document MIME types, 20 MiB bucket limit.
- `test-question-files`: private, allowed image/document MIME types, 4 MiB bucket limit.
- Relevant upload endpoints add request-size and signature checks, and signed URLs validate the parent record/path before service-role signing.

## Open release blockers and residual risks

### P0 — deployment is not confirmed on Vercel

At the last inspection, `vercel.json` contained `"git": { "deploymentEnabled": false }`. The latest listed Vercel production deployment pointed to an older main commit (`ab5dfe9a82ebca9d355456e167b1d7137baebfef`), not the then-current audited main. Do **not** assume the merged fixes are serving users until the active production alias is verified against the intended commit. The Vercel project had automatic Git deployment disabled, consistent with the earlier deployment-limit constraint. No manual production deployment was performed as part of this audit.

### P0 — Google Meet needs a real OAuth smoke test

At the database inspection time, `google_connections` had zero rows, and the two existing active Meet-space rows had no confirmed `google_user_id`. This is fail-closed by design: the system will not guess the OAuth owner. An active Chief Mentor must connect the intended Google account through the Meet page, then verify:
1. Create a morning and evening Meet for one team.
2. Confirm both links appear in the mentor UI.
3. Run manual sync, then verify cron sync; inspect attendance and participant mappings.
4. Replace a disabled space and confirm its composite unique key is not violated.
5. Confirm an unconnected or unauthorized Google account cannot take ownership of a space.

Until that test is done with a real connected account, Meet attendance is **not production-verified**.

### P1 — leaked-password protection remains disabled

Supabase Security Advisor reported `auth_leaked_password_protection` as disabled. Enable it in the Supabase Auth dashboard only after confirming the available account/configuration supports the chosen leaked-password-check option. Re-run the advisor after changing it. Application password-strength checks and login rate limits do not replace compromised-password screening.

### P1 — high-severity development-tool dependency advisories

The CI `npm audit` report showed **5 high, 0 critical** findings in the lint/build toolchain, including the `eslint-config-next` / `@next/eslint-plugin-next` / `fast-glob` / `micromatch` / `braces` dependency chain. The finding was not auto-fixed because the offered forced fix downgraded `eslint-config-next` to a major version incompatible with this Next.js 16 project. These appear in development tooling rather than the direct runtime dependency set, but remain an unresolved supply-chain risk:
- Recheck advisories and upstream patched versions at the next dependency update.
- Upgrade only to a compatible patched chain and regenerate the lockfile.
- Do not run `npm audit fix --force` blindly.
- Re-run CI and `npm audit` after remediation.

### P2 — advisor/performance notes

- Supabase reported the RLS-enabled rate-limit table has no policies. This is intentional: the table has no public/authenticated grants; the server-only service-role RPC is the access path.
- The advisor also reported unused indexes and duplicate permissive policies on Meet-space insert/update. These are follow-up performance cleanups, not known bypasses. Review with query plans before dropping indexes or merging policies.

## Required client handoff smoke test

Before declaring the platform ready, test through the intended public domain and current production deployment, using actual accounts for each role:

- Register a new student; verify duplicate phone/email handling and login using email and phone.
- Verify password reset from request email through callback, reset form and subsequent login.
- Verify inactive users cannot enter a private workspace or use its API endpoints.
- Verify a Mentor can access only the assigned active team's student, report, submission, and Meet data; try another team's record and confirm denial.
- Verify Chief Mentor and Leader actions match their intended roles; verify students cannot change role/status or call staff mutations directly.
- Upload valid and invalid file types/sizes; confirm files stay private where intended and signed URLs cannot address another student's object.
- Confirm a student cannot unlock a lesson test before the configured minimum watch percentage, and cannot exceed test-attempt limits via parallel submissions.
- Review a report and task submission; confirm scoring is recorded once and audit logs reflect the action.
- Test the three-language UI, mobile layout, logout/session expiry, and production error pages.
- Confirm `/api/health` returns healthy through the public production alias, and that the deployed commit matches audited main.

## Decision

Code and database hardening improved materially, but a final **GO** is contingent on: (1) verifying/deploying the intended commit to the actual production alias, (2) successful authenticated student/staff smoke tests, and (3) a real Google Meet OAuth/sync test. Keep the npm audit findings and Supabase leaked-password protection warning on the follow-up list until resolved.
