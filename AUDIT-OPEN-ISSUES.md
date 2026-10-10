# Shyraq pre-launch security audit — 2026-10-10

## Release decision

**Production deployment completed; authenticated release verification is still outstanding.** Application commit `fc8c3fa331824085921ab6a815598d927e213654` passed GitHub Actions (`npm ci`, typecheck, lint and production build). The Supabase migration workflow succeeded through `20261010210000_revoke_direct_staff_writes`. On 2026-10-10, Vercel deployment `dpl_2TAgfQFC9tmcfGxtBy4s9ft8eurC` reached `READY` from that application commit and was assigned the production alias `https://shyraq-nu.vercel.app`. Public smoke tests passed, but a full browser-based test with real student/staff accounts and Google OAuth is still required before calling the hand-off fully verified.

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

The repository's GitHub Actions pipeline runs `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build`. These checks passed for the current application commit `fc8c3fa331824085921ab6a815598d927e213654`, including the server-side staff-write follow-up. CI confirms compilation and build health, not every authenticated workflow.

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

## Production deployment verification

- Deployment: `dpl_2TAgfQFC9tmcfGxtBy4s9ft8eurC`, state `READY`, target `production`, source commit `fc8c3fa331824085921ab6a815598d927e213654`.
- Canonical alias: `https://shyraq-nu.vercel.app`; Vercel reported no alias error.
- Post-deployment smoke tests on 2026-10-10: `/api/health` returned HTTP 200 with `{"ok":true}`; `/`, `/register` and `/reset-password` returned HTTP 200; an unauthenticated `/dashboard` request redirected to `/login`.
- The recent Vercel runtime-error scan showed one `invalid_credentials` rejection on `/api/auth/login`. This is an expected failed-login response, not by itself evidence of a server crash. Vercel's current Hobby log-retention window limits broader runtime-log verification.
- These smoke tests establish deployment and basic public routing only. They do not replace authenticated tests for every role or a real Google OAuth/Meet attendance synchronization run.

## Open release blockers and residual risks

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

## Password recovery hardening — 2026-10-10

The password recovery implementation was tightened after the targeted review:

- Recovery emails use the configured app callback and an implicit token-fragment flow, so no server-side PKCE verifier is created without persistent storage.
- The browser callback removes tokens from the visible URL before exchanging them with the server.
- The exchange endpoint verifies the Supabase user, requires a recent `amr=recovery` authentication claim, revokes the temporary Supabase session, then issues a signed, HTTP-only recovery grant with a 10-minute lifetime.
- The new grant is not an app login session. `src/proxy.ts` restricts requests while it is valid to the reset flow.
- Password changes require the signed grant, run server-side password checks, and consume a hashed, rate-limited one-use grant bucket before changing the password through the Supabase Admin API.
- Recovery requests, token exchange and password change have no-store responses and rate limits. Reset form minimum length matches server validation (12 characters).
- Supabase reset-request errors return a generic service error rather than falsely claiming a message was queued or revealing whether an address exists.

**Still required before calling this flow production-verified:** run a real mailbox test on the canonical domain, confirm the Supabase Auth Redirect URL allowlist contains the exact callback `https://shyraq-nu.vercel.app/auth/recovery` (and the local URL for localhost testing), then validate the complete flow with a test account. Verify email delivery, invalid/expired/reused link rejection, success with the new password, failure with the old password, and blocked access to other app/API routes during recovery. GitHub Actions proves build/type/lint health, not real email delivery or an end-to-end auth test.

The Supabase Security Advisor warning for leaked-password protection remains open; the stricter application password validator does not replace that provider-level check.
