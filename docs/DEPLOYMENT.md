# Shyraq Production Deployment

## Vercel production environment variables

Configure these in the Vercel project **Production** environment:

- `NEXT_PUBLIC_SUPABASE_URL`
  - `https://sqjjqnisnndulkzcqfwb.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - Use the current Shyraq publishable key from Supabase Dashboard → Project Settings → API.
- `SUPABASE_SECRET_KEY`
  - Secret. Copy it only from Supabase Dashboard → Project Settings → API and keep it out of GitHub/chat.
- `NEXT_PUBLIC_APP_URL`
  - `https://shyraq-nu.vercel.app`
- `CRON_SECRET`
  - High-entropy secret used by the Vercel Meet-sync cron endpoint.

### Google Meet integration

Configure these only when Google Meet integration is enabled:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
  - `https://shyraq-nu.vercel.app/api/integrations/google/callback`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
  - Base64-encoded 32-byte key.
- `GOOGLE_MEET_SCOPES`
  - `https://www.googleapis.com/auth/meetings.space.readonly`

The exact Google redirect URI must also be registered in the Google Cloud OAuth client.

### Kinescope integration

Configure:

- `KINESCOPE_API_TOKEN`
- `KINESCOPE_WORKSPACE_ID`

## Supabase production configuration

The connected Shyraq Supabase project is **Shyraq** with project ref `sqjjqnisnndulkzcqfwb` in region `eu-central-1`.

The production database currently reports migration history through `20261002185843_lesson_team_assignment`. The repository now also contains a new hardening migration, `20261003002500_security_and_fk_indexes.sql`, whose SQL has already been applied directly to the connected database. Run the normal migration push/reconciliation flow before the next schema change so the migration ledger and repository stay aligned.

For hosted Auth, keep the production Site URL aligned with the deployed application URL:

`https://shyraq-nu.vercel.app`

## Verification

The repository health contract requires:

- `NEXT_PUBLIC_SUPABASE_URL` configured
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configured
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` configured
- `NEXT_PUBLIC_APP_URL` configured
- real Supabase REST reachability

The latest Vercel production deployment inspected during the audit is not current: it points to an older commit and is in `ERROR` state. A later Vercel status check on commit `c4d22c82...` reported a `build-rate-limit` failure. The code changes in the repository therefore require a fresh successful CI/build/deployment before production can be treated as current.

Do not place `SUPABASE_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`, `KINESCOPE_API_TOKEN`, or `GOOGLE_TOKEN_ENCRYPTION_KEY` in GitHub.
