# Google Meet Setup

## 1. Google Cloud project

Create or use the Google Cloud project dedicated to Shyraq. Enable the Google Meet REST API and the Google OpenID Connect identity endpoint.

Use an OAuth consent screen appropriate for your deployment. Authorize only the accounts used by the Shyraq integration and keep the OAuth client secret private.

## 2. OAuth client

Create an OAuth client of type **Web application** and register these exact authorized redirect URIs:

- Local development: http://localhost:3000/api/integrations/google/callback
- Shyraq production: https://shyraq-nu.vercel.app/api/integrations/google/callback

The redirect URI must exactly match the GOOGLE_REDIRECT_URI environment variable and the origin configured in NEXT_PUBLIC_APP_URL. The application rejects mismatched callbacks.

## 3. Required server environment variables

Configure these as server-side environment variables in local .env.local and (when production deployment is approved) Vercel. Never commit real values.

| Variable | Purpose |
| --- | --- |
| GOOGLE_CLIENT_ID | Google OAuth Web client ID |
| GOOGLE_CLIENT_SECRET | OAuth client secret |
| GOOGLE_REDIRECT_URI | Exact callback URL from section 2 |
| GOOGLE_TOKEN_ENCRYPTION_KEY | Base64-encoded random 32-byte key for AES-256-GCM refresh-token encryption |
| CRON_SECRET | Long random secret for the scheduled Meet sync endpoint |

Generate and store the encryption key securely. Do not rotate it until existing Google refresh tokens have been re-encrypted, or stored tokens will become unreadable.

The integration fails closed if OAuth variables, callback URL or encryption key are missing or malformed. CRON_SECRET must be configured for scheduled synchronization; without it, the cron route returns 401.

## 4. OAuth scopes

The integration requests:

- openid, email and profile to identify the connected Google account.
- https://www.googleapis.com/auth/meetings.space.created to access Meet spaces created by the app.
- https://www.googleapis.com/auth/meetings.space.readonly to read authorized pre-existing Meet spaces and conference records.

The integration does not require broad Google Calendar access and no longer requests the Calendar events scope. Re-authorize the Google account if the scope set changes.

## 5. Connection flow and storage

1. A signed-in, active Chief Mentor starts Google connection from the Meet page.
2. Shyraq creates a cryptographically random OAuth state value in a short-lived HTTP-only cookie.
3. Google redirects to the exact registered callback.
4. Shyraq validates callback state using a timing-safe comparison.
5. The server exchanges the single-use authorization code with a bounded timeout.
6. Shyraq calls Google's UserInfo endpoint and only saves a connection when Google subject, email and the email_verified claim are present and verified.
7. The refresh token is encrypted using AES-256-GCM before storage. Access tokens are fetched server-side and never returned to the browser.

## 6. Create and verify Meet spaces

Use the Chief Mentor Meet page to create MORNING, EVENING or EXTRA spaces for the intended team. Shyraq stores the canonical spaces/... resource name, verified Meet URL and owning Google account ID.

Do not manually set google_user_id or insert an unverified external-space identifier. A legacy unowned space must be resolved by testing which active connected staff account can access the actual Google resource; otherwise synchronization must fail closed.

## 7. Attendance synchronization

The signed-in Chief Mentor can trigger manual sync from the Meet page. The scheduled job calls GET /api/cron/meet-sync with Authorization: Bearer <CRON_SECRET>; it is not an unauthenticated public endpoint.

The cron job imports recent conferences, participants and participant sessions, matches participants conservatively, and calculates attendance. If any team fails, the job returns a non-2xx status so monitoring can detect partial failure. Review the per-team results instead of treating HTTP 200 alone as proof of complete synchronization.

## 8. Release verification checklist

A real Google account and real test Meet sessions are required before this integration can be marked production-verified:

1. Connect an active Chief Mentor's intended Google account.
2. Create distinct MORNING and EVENING spaces; verify their canonical IDs, URLs and owners are saved.
3. Hold or use a real test meeting and confirm participant/session results for the correct date range.
4. Run manual sync and compare imported records with the Google Meet report.
5. Run scheduled sync with the configured cron secret and confirm every eligible team succeeds.
6. Disable and replace a space; verify the existing unique (team_id, study_time) row is updated instead of inserting a duplicate.
7. Verify an unrelated or unconnected Google account cannot claim ownership of a space.
8. Verify OAuth denial, invalid/replayed state, revoked refresh token, failed UserInfo response and missing secrets fail closed without storing an unverified connection.

Until those actions are completed using a real authorized Google account, live Meet attendance remains **not production-verified**.