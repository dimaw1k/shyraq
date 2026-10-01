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

- Student registration/login skeleton
- Student-first role creation
- Mentor phone lookup and team assignment backend
- Team/task/report APIs
- Private Supabase Storage uploads
- Kinescope player + watch-coverage tracking
- 85% server-side test gate
- Test submission and hidden correct answers
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

Apply all migrations in repository order. Note that phone normalization is split into two migrations (`0002_standardize_phone_format.sql` and `0020_signup_phone_normalization.sql`), so do not omit either one.

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

The `main` branch is connected to Vercel Production.

Latest application baseline deployed from GitHub:
```text
cd731dc269f3d1179830c6b9d971398ed33b75e5
```

Health endpoint:
```text
https://shyraq-nu.vercel.app/api/health
```

The health endpoint intentionally returns HTTP 503 until required production environment variables are present and the deployed server can reach Supabase.

## Verification

The repository includes GitHub Actions for typecheck, lint and production build on pushes and pull requests.

The current execution environment cannot reliably clone the GitHub repository from the public network, so local build execution has not been claimed as verified. The CI workflow is the authoritative automated verification path after each push.