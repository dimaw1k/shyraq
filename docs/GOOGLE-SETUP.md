# Google Meet Setup

## 1. Google Cloud project

Create or use a Google Cloud project for Shyraq.

Enable the Google Meet REST API and the Google OpenID Connect identity endpoints used by the OAuth flow.

## 2. OAuth client

Create a Web application OAuth client.

Local redirect URI:

`http://localhost:3000/api/integrations/google/callback`

Production redirect URI:

`https://YOUR_SHYRAQ_DOMAIN/api/integrations/google/callback`

Keep the client ID and client secret in server environment variables.

## 3. Requested scope

The current v1 integration requests:

`https://www.googleapis.com/auth/meetings.space.readonly`

Authentication is user-level OAuth because Shyraq needs access to meeting spaces and conference participant/session data for authorized mentors/admins.

## 4. Encryption key

Generate a random 32-byte key and base64 encode it.

Example:

```bash
openssl rand -base64 32
```

Put the result in:

`GOOGLE_TOKEN_ENCRYPTION_KEY`

Never commit this value.

## 5. Flow

1. Mentor signs into Shyraq.
2. Mentor starts Google connection.
3. Google redirects back to Shyraq.
4. Shyraq exchanges the authorization code server-side.
5. Shyraq stores only an encrypted refresh token.
6. The access token is refreshed server-side when Meet sync runs.

## 6. Team connection

After Google is connected:

1. Obtain the canonical Meet space resource.
2. Call `POST /api/mentor/meet/connect` with the team ID and space resource.
3. Shyraq verifies that the connected Google account can access the space.
4. The verified `spaces/...` resource is stored.

## 7. Attendance sync

Call:

`POST /api/mentor/meet/sync`

Payload:

```json
{
  "teamId": "TEAM_UUID",
  "startTime": "2026-09-30T00:00:00Z",
  "endTime": "2026-10-01T00:00:00Z"
}
```

The sync imports conferences, participants, participant sessions and calculated attendance.

## 8. Identity matching

Preferred order:

1. previously stored Google user ID mapping;
2. unique exact display-name match inside the team;
3. manual mapping.

Ambiguous matches remain unresolved instead of being silently assigned.