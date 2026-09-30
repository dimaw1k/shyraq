# Shyraq Production Deployment

## Vercel production environment variables

Configure these in the Vercel project **Production** environment:

- `NEXT_PUBLIC_SUPABASE_URL`
  - `https://sqjjqnisnndulkzcqfwb.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - Use the current Shyraq publishable key from Supabase Dashboard → Project Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY`
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

The production project is `Shyraq` with project ref `dujeagndgxlehxsvwrsq`.

All repository migrations through `0018_performance_hardening` must exist in production. The current production database has migrations `0001` through `0018` applied.

For hosted Auth, set the production Site URL in Supabase Dashboard to:

`https://shyraq-nu.vercel.app`

## Verification

After Vercel Production variables are saved, redeploy the project and open:

`https://shyraq-nu.vercel.app/api/health`

A healthy response must report:

- `ok: true`
- `publicEnvConfigured: true`
- `adminEnvConfigured: true`
- `appUrlConfigured: true`
- `supabase.reachable: true`

Do not place `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, `KINESCOPE_API_TOKEN`, or `GOOGLE_TOKEN_ENCRYPTION_KEY` in GitHub.