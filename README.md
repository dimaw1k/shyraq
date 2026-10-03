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

- Student-facing dashboard, tasks, task detail/submission, reports, lesson catalog, profile settings and ranking UI
- Unified Shyraq UI system: Montserrat typography, warm neutral surfaces, orange accent, simplified navigation and student/staff workspaces
- Mentor operational dashboard with phone-based student management, student progress metrics, task-submission review and Meet sync controls
- Chief Mentor operational workspace with mentor/team/lesson/task management, submission review, reports and analytics
- Leader operational workspace with staff/student/team/content management, submission review, analytics, audit log and settings
- Scheduled Meet attendance sync endpoint and Vercel cron configuration
- Student registration/login flow with KZ phone normalization
- Student-first role creation
- Mentor phone lookup and team assignment backend
- Team/task/report APIs
- Private Supabase Storage uploads
- Kinescope player + watch-coverage tracking
- 85% server-side test gate
- Test submission with server-only answer-key evaluation
- Idempotent score events
- Student/mentor/staff overview APIs
- Role-scoped ranking API
- Google OAuth connection
- Encrypted Google refresh-token storage
- Team Meet-space connection
- Conference/participant/session attendance sync
- Manual Google participant mapping
- Staff APIs for teams, tasks, lessons and tests
- GitHub Actions CI
- Kazakhstan-time-safe staff/lesson datetime handling
- Team/start-time authorization on lesson progress and test APIs
- Submitted task locking

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

Apply repository migrations in order. The connected production database already contains the migration history through `20261002185843_lesson_team_assignment`.

The repository also contains `20261003002500_security_and_fk_indexes.sql`. Its SQL has already been applied directly to the connected Shyraq database; use your normal Supabase migration reconciliation command before the next schema change so the remote migration ledger and the repository remain aligned.

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
- `docs/DEPLOYMENT.md` — production deployment variables and setup checks.

## Production deployment

The `main` branch is connected to the Shyraq Vercel project.

Current audited GitHub `main` head:

```text
f86fa0a5984e330d7c9adca724802c2f0bae2282
```

The latest Vercel production deployment inspected during the audit is still based on the older `2df68da544...` commit and is `ERROR` with `next build`/lint-or-type failure metadata. A subsequent Vercel status check on the newer `c4d22c82...` commit reported a `build-rate-limit` failure. Therefore the production deployment has not yet been verified against the audited `main` head.

Production health endpoint:

```text
https://shyraq-nu.vercel.app/api/health
```

## Verification

The repository includes GitHub Actions for typecheck, lint and production build on pushes and pull requests.

The current execution environment cannot reliably clone the GitHub repository from the public network, so local build execution has not been claimed as verified. Vercel's connected integration is currently blocked by its reported build-rate limit, so the final production deployment check must be completed after the rate limit clears.

For security, enable Supabase Auth leaked-password protection before the production release. The connected Supabase advisor currently reports this as a warning.


<!-- Vercel deployment sync: current main includes daily week/day staff navigation and review flows. -->
