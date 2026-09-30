# Shyraq Architecture

## System boundaries

```
Browser
  |
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

The browser can request actions but cannot decide authorization.

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
