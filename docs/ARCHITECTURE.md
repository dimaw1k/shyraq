# Shyraq Architecture

## System boundaries

```
Browser (cookie session) -----------+
                                    |
Native iOS app (Bearer access token)+
                                    v
                              Next.js App Router
                                    |
                                    +--> Server Components / Route Handlers / Server Actions
                                    |
                                    v
                                  Supabase
  +--> PostgreSQL
  +--> Auth
  +--> Storage
  |
  +--> Kinescope
  |
  +--> Google Meet
```

## Data ownership

Supabase is the system of record for Shyraq application data.

Kinescope is the source of hosted lesson video media, while Shyraq stores lesson metadata and student progress needed by the product.

Google Meet remains the source of meeting/conference events; Shyraq stores normalized attendance records and imported session data.

## Security boundary

The browser and native app can request actions but cannot decide authorization.

- Web sessions use the existing Supabase SSR cookie flow.
- Native API requests send `Authorization: Bearer <Supabase access token>`.
- On the current feature branch, Bearer support is intentionally enabled only for `GET /api/student/overview`; do not assume other API routes accept native tokens until they are migrated and tested.

Server-side code must validate:

- current user;
- role;
- team ownership;
- record ownership;
- feature eligibility;
- score rules;
- video unlock eligibility.

## Performance boundaries

- Do not write video progress every second.
- Batch progress writes.
- Store raw Meet sessions and derived attendance separately.
- Index all foreign keys and high-frequency filters.
- Use pagination for student/submission lists.
- Calculate expensive analytics asynchronously when the dataset grows.

## v1 deployment

- local development;
- Vercel preview;
- Vercel production;
- Supabase development/production projects.

Do not introduce a separate backend service until the platform proves that it needs one.

## Native mobile integration status

The Expo app is maintained in `mobile/`, separately from the Next.js web UI. The web and mobile clients share Supabase Auth, PostgreSQL, private Storage and the Next.js API.

The first mobile-auth proof of concept lives on the draft pull request for issue #120. The login endpoint can return access/refresh tokens only when explicitly requested by a native client and only after password authentication plus active-profile validation. The student overview endpoint verifies the Bearer token with Supabase Auth and performs subsequent data reads with a token-scoped client so RLS sees the authenticated user.

Before expanding the helper to other endpoints, add cookie/Bearer regression coverage and role/ownership negative-path tests. Do not merge or deploy an API auth change solely because TypeScript/build checks pass.
