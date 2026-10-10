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
- Password reset flow with canonical callback URLs and server-side recovery-token validation
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

Apply repository migrations in order. The connected Shyraq Supabase database was verified through migration `20261010110000_atomic_leader_student_promotion` on 2026-10-10. The Supabase Deploy workflow checks migration history, validates pending migrations with a dry run, and only then applies them. Do not bypass the workflow or assume a migration is applied merely because similar SQL was run manually.

## Important product rules

### Team assignment

Student registration never automatically assigns a team.

Mentors search by phone number and add only registered, unassigned students to their own team.

### Kinescope

The lesson test remains locked until the backend confirms the required unique watch coverage. The default threshold is 85%.

### Google Meet

Each team can have separate MORNING, EVENING and EXTRA Meet spaces. Shyraq imports conferences, participants and participant sessions using the verified Google account that owns each space, then calculates attendance from session duration.

Uncertain participant identity is not silently assigned; a unique name match or explicit mentor mapping is required.

## Documentation

- `SHYRAQ-PLATFORM-PLAN.md` — complete product and engineering plan.
- `docs/ARCHITECTURE.md` — architecture boundaries.
- `docs/DECISIONS.md` — important implementation decisions.
- `docs/API.md` — API routes, environment and integration notes.
- `docs/DEPLOYMENT.md` — production deployment variables and setup checks.

## Production deployment

The GitHub repository is associated with the Shyraq Vercel project. Automatic Git deployments remain disabled in `vercel.json` (`git.deploymentEnabled: false`), so production releases must be initiated deliberately.

On 2026-10-10, production deployment `dpl_2TAgfQFC9tmcfGxtBy4s9ft8eurC` reached `READY` from application commit `fc8c3fa331824085921ab6a815598d927e213654` (`main`, `fix(api): route staff writes through service client`). Vercel assigned the canonical alias `https://shyraq-nu.vercel.app` with no alias error. After deployment, `/api/health` returned HTTP 200 with `{"ok":true}`; the home page, registration page and password-reset page returned HTTP 200, while an unauthenticated `/dashboard` request redirected to `/login`.

These checks confirm deployment health and basic public routing, not all authenticated workflows. Complete the authenticated role-by-role smoke tests and real Google Meet OAuth/attendance sync test before treating the platform as fully production-verified.

The current responsive mobile-web implementation includes the shared mobile app shell, role-aware slide-out navigation, bottom navigation, safe-area handling, mobile spacing, table overflow handling, viewport metadata, and mobile-safe authentication/lesson screens.

Production URL:

```text
https://shyraq-nu.vercel.app
```

Production health endpoint:

```text
https://shyraq-nu.vercel.app/api/health
```

## Verification

The repository includes GitHub Actions for typecheck, lint and production build on pushes and pull requests.

The production alias was updated to application commit `fc8c3fa331824085921ab6a815598d927e213654` on 2026-10-10 and passed the public health/routing smoke tests listed above. Git-based Vercel deployment remains disabled, so future merges to `main` still require a deliberate deployment. These public checks do not replace authenticated end-to-end testing.

Before a full production hand-off, enable Supabase Auth leaked-password protection and rerun the Security Advisor; the previous connected-project audit reported it as a warning.

<!-- Vercel deployment sync: current main includes responsive mobile web UI changes. -->

## Mobile web UI

The application is responsive for phone and tablet viewports without a separate native app. The shared app shell now provides a compact mobile header, slide-out role-aware navigation, five-item bottom navigation, safe-area support for iOS, mobile-friendly page spacing and horizontally scrollable dense tables. Authentication, lessons and lesson detail screens also use mobile-specific spacing and viewport metadata.

<!-- Vercel production deployment sync: 2026-10-10; deployment dpl_2TAgfQFC9tmcfGxtBy4s9ft8eurC from fc8c3fa331824085921ab6a815598d927e213654 -->
