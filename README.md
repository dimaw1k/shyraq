# Shyraq

Shyraq is an operations platform for a structured student marathon focused on discipline, learning habits, team work, reporting, live attendance and progress.

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

Registration -> waiting for team -> mentor assignment -> tasks/reports -> Kinescope lesson -> 85% watch gate -> lesson test -> Google Meet attendance -> score -> ranking -> analytics.

## Explicit v1 exclusions

- WhatsApp API
- Payment automation
- OTP/SMS login
- Password recovery
- YouTube lesson hosting
- Native mobile apps
- AI features

## Local setup

1. Install Node.js supported by Next.js.
2. Copy `.env.example` to `.env.local`.
3. Fill Supabase values.
4. Install dependencies:

```bash
npm install
```

5. Start development:

```bash
npm run dev
```

6. Verify:

```bash
npm run typecheck
npm run lint
npm run build
```

## Database

Apply the SQL migration in:

`supabase/migrations/0001_initial.sql`

The migration creates the core Shyraq schema, indexes, helper functions, triggers and initial RLS policies.

## Documentation

- `SHYRAQ-PLATFORM-PLAN.md` — product and engineering source of truth.
- `docs/ARCHITECTURE.md` — architecture boundaries.
- `docs/DECISIONS.md` — important implementation decisions.
