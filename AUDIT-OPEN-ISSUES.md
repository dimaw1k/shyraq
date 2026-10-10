# Shyraq pre-launch security audit — 2026-10-10

## Release decision

**Conditional go for staging; not yet a verified production hand-off.** The application-code commit `118e542eaf491390000a5baf522ea2dfd64b2a6b` passed GitHub Actions (`npm ci`, typecheck, lint and production build), and the Supabase migration workflow succeeded through `20261010110000_atomic_leader_student_promotion`. This audit document is being refreshed in a separate documentation-only change. A complete browser-based test with real student/staff sessions and Google OAuth is still required.

This is a targeted repository, database-configuration and CI audit. It is not a third-party penetration test or proof that no vulnerabilities remain.

## Fixes reviewed in this audit

- Authentication and staff authorization: rate-limit sensitive routes, reject missing/invalid profile states during login, keep staff pages behind role + active-status checks, and sanitize trusted callback/redirect URLs.
- Student task/report/test writes: bound streamed request bodies, validate uploaded file signatures and storage paths, lock direct progress/attempt writes behind server validation, preserve the atomic test submission RPC, and enforce the video-watch threshold in the database.
- Staff/admin mutations: rate-limit privileged lesson, team, task, test, score-rule, banner, support, submission-review and staff-role operations; validate payload ranges and identifiers.
- Report and task review: make state transitions conditional so concurrent review attempts cannot approve/reject the same request twice or create duplicate tasks.
- Profile changes: require the current password for sensitive updates, fail closed if account status cannot be verified, and share a rate-limit bucket across phone-change endpoints.
- Rate-limit infrastructure: service-role-only RPC, hashed bucket keys and bounded cleanup of stale rate-limit rows.
- File access: validate a file’s parent record and storage path before creating signed URLs. Student upload endpoints enforce size/type/signature rules.
- Google Meet: support separate MORNING/EVENING/EXTRA spaces, use the correct composite upsert key, validate the real Google resource and link, record/verify the Google account that owns each space, and use that owner during manual/cron sync.
- Repository hygiene: ignore local `.env*` files except the checked-in `.env.example`; CI reports high/critical npm audit findings instead of hiding the package names.

Relevant source repository: https://github.com/dimaw1k/shyraq

## Checks completed

### Application and CI

The repository's GitHub Actions pipeline runs `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build`. These checks passed on prior hardening commits, including the fail-closed login fix. The current extended API-validation changes must also pass the same checks and the associated Snyk/preview checks before merge.

CI checks confirm that source compiles, type-checks and builds. They do not prove all live data, permissions, OAuth or UI flows work end to end.

### Supabase

The connected database was inspected directly. The audited checks found:

- All exposed `public` tables had RLS enabled; no RLS-disabled public tables were returned.
- No direct `anon` or `PUBLIC` grants on audited `public` tables were found. Public views were not found in the checked schema.
- Reviewed SECURITY DEFINER RPCs were restricted to `service_role`; the rate-limit cleanup RPC and stale-row index were present.
- Integrity queries returned zero for missing profile/auth-user pairs, duplicate normalized phone numbers, students with multiple active memberships, inactive mentors assigned to active teams, orphaned video-progress rows, test answers without attempts and attempts without tests.
- The Supabase deployment workflow successfully dry-ran and applied migrations through `20261010110000_atomic_leader_student_promotion`.
- The Meet owner column/index/trigger/RLS rules were present after migration. The trigger helper was not executable by `authenticated`.
- The Leader student-to-staff promotion RPC exists after migration; execute is denied to `anon` and `authenticated` and granted only to `service_role`.
- The security advisor still reports leaked-password protection as disabled. The rate-limit table has an informational RLS-without-policy warning; this is intentional because no client grants exist and the service-role RPC is the only intended access path.

### Dependency audit

The CI `npm audit` report showed **5 high and 0 critical findings** in the development lint/build toolchain, involving `eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob`, `micromatch` and `braces`. The suggested forced fix attempted to downgrade the Next.js ESLint configuration to a major version incompatible with this app. The report is visible in CI; do not run `npm audit fix --force` blindly. Recheck compatible patched versions during the next dependency update.

## Open release blockers and residual risks

### P0 — live Vercel frontend is not confirmed up to date

At the last Vercel inspection, `vercel.json` contained `"git": { "deploymentEnabled": false }`. The latest listed production deployment pointed to older commit `ab5dfe9a82ebca9d355456e167b1d7137baebfef`, not the audited GitHub `main` head. Merging source changes does **not** prove the public alias is serving them. No manual production frontend deployment was performed as part of this audit, consistent with the existing deployment-limit constraint.

Before client hand-off, identify the active production deployment and deliberately deploy the reviewed commit, or restore Git deployment through a controlled configuration change. Then confirm the public alias and `/api/health`.

### P0 — Google Meet requires a real OAuth smoke test

At the live database inspection time, `google_connections` contained no rows and the two existing active Meet spaces had no confirmed `google_user_id`. The new sync path intentionally fails closed instead of guessing which Google account owns a space.

An active Chief Mentor must connect the intended Google account and test:

1. Create MORNING and EVENING Meet spaces for a team.
2. Confirm both links appear in the mentor workspace.
3. Run manual sync and verify the attendance/participant records.
4. Confirm the cron sync works with the verified owner.
5. Replace a disabled space and confirm the composite unique key is not violated.
6. Confirm an unconnected or unauthorized Google account cannot claim ownership of a Meet space.

Until this is completed with actual OAuth credentials and live conferences, Meet attendance is **not production-verified**.

### P1 — leaked-password protection remains disabled

Supabase Security Advisor reported `auth_leaked_password_protection` as disabled. Enable the chosen leaked-password check in Supabase Auth if supported by the current project configuration, then rerun the advisor. Password-strength validation and login throttling are not substitutes for checking compromised passwords.

### P1 — high-severity development dependency advisories

The five high findings remain unresolved. They are in the development toolchain rather than the app's direct runtime package set, but still represent supply-chain risk for build/lint environments. Recheck current advisory details and upgrade to a compatible patched dependency chain; do not apply a major downgrade simply to silence `npm audit`.

### P2 — final authenticated staging smoke test

Using real accounts for each intended role, test registration, email/phone login, password reset, inactive-account rejection, team-scoped mentor access, student/report/task/test flows, signed file access, the 85% lesson watch gate, retry/score idempotency, audit logging, logout/session expiry, mobile layout and all three supported languages. Test both allowed and denied access paths.

## Decision

The code and database hardening has improved materially, but a final **GO** depends on: (1) confirming the intended code is running on the production alias, (2) successful authenticated staging/client smoke tests, and (3) a real Google Meet OAuth/sync test. Keep the dependency audit findings and leaked-password setting on the follow-up list until resolved.
