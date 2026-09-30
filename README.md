# Shyraq

Shyraq is an operations platform for a structured student marathon focused on discipline, learning habits, team work, reporting, live attendance and measurable progress.

## Current stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth / PostgreSQL / Storage
- Kinescope for lesson videos
- Google Meet for team live lessons
- Vercel for deployment

## v1 core flow

Registration -> waiting for team -> mentor phone assignment -> tasks/reports -> Kinescope lesson -> unique watch coverage -> 85% gate -> lesson test -> Google Meet attendance -> score events -> ranking -> analytics.

## Explicit v1 exclusions

- WhatsApp API
- Payment automation
- OTP/SMS login
- Password recovery
- YouTube lesson hosting
- Native mobile apps
- AI features

## Implemented foundation

- Student-facing dashboard, tasks, task detail/submission, reports and lesson catalog UI
- Mentor operational dashboard with phone-based student management and Meet sync controls
- Admin operational dashboard with team, task, lesson and test creation UI
- Scheduled Meet attendance sync endpoint and Vercel cron configuration

- Student registration/login skeleton
- Student-first role creation
- Mentor phone lookup and team assignment backend
- Team/task/report APIs
- Private Supabase Storage uploads
- Kinescope player + watch-coverage tracking
- 85% server-side test gate
- Test submission and hidden correct answers
- Idempotent score events
- Student/mentor/admin overview APIs
- Role-scoped ranking API
- Google OAuth connection
- Encrypted Google refresh-token storage
- Team Meet-space connection
- Conference/participant/session attendance sync
- Manual Google participant mapping
- Admin APIs for teams, tasks, lessons and tests
- GitHub Actions CI

## Local setup

1. Install a current Node.js release supported by the pinned Next.js version.
2. Copy `.env.example` to `.env.local`.
3. Fill Supabase credentials.
4. For Google Meet, configure Google OAuth credentials and a base64-encoded 32-byte `GOOGLE_TOKEN_ENCRYPTION_KEY`.
5. Install dependencies:

```bash
npm install
```

6. Start development:

```bash
npm run dev
```

7. Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Database

Apply all migrations in order:

```text
supabase/migrations/0001_initial.sql
supabase/migrations/0002_security_and_storage.sql
supabase/migrations/0003_test_answers.sql
supabase/migrations/0004_score_events.sql
supabase/migrations/0005_google_meet_integration.sql
supabase/migrations/0006_meet_participant_sessions.sql
supabase/migrations/0007_test_answer_privacy.sql
supabase/migrations/0008_storage_and_team_hardening.sql
supabase/migrations/0009_profile_privilege_hardening.sql
supabase/migrations/0010_profile_rpc_hardening.sql
```

## Important product rules

### Team assignment

Student registration never automatically assigns a team.

Mentors search by phone number and add only registered, unassigned students to their own team.

### Kinescope

The lesson test remains locked until the backend confirms the required unique watch coverage. The default threshold is 85%.

### Google Meet

Each team has its own Meet space. Shyraq imports conferences, participants and participant sessions and calculates attendance from session duration.

Uncertain participant identity is not silently assigned; a unique name match or explicit mentor mapping is required.

## Documentation

- `SHYRAQ-PLATFORM-PLAN.md` — complete product and engineering plan.
- `docs/ARCHITECTURE.md` — architecture boundaries.
- `docs/DECISIONS.md` — important implementation decisions.
- `docs/API.md` — API routes, environment and integration notes.

## Verification

The repository includes GitHub Actions for typecheck, lint and production build on pushes and pull requests.

The current execution environment cannot reliably clone the GitHub repository from the public network, so local build execution has not been claimed as verified. The CI workflow is the authoritative automated verification path after each push.