# Shyraq API and Setup Notes

## Core API

### Student
- GET /api/student/profile — current student's profile.
- PATCH /api/student/profile — update allowed profile fields.
- GET /api/student/overview — own operational summary.

### Mentor
- POST /api/mentor/students/search — search registered student by phone.
- POST /api/mentor/students/add — add an unassigned student to the mentor's active team.
- GET /api/mentor/team — own team and operational statistics.
- POST /api/mentor/meet/connect — connect a Google Meet space to the mentor's team.
- POST /api/mentor/meet/sync — import recent Meet conferences, participants and sessions.
- POST /api/mentor/meet/mapping — manually bind a Google participant ID to a student.

### Student learning
- GET /api/tasks — visible tasks.
- POST /api/tasks/:taskId/submissions — submit a task.
- POST /api/tasks/:taskId/submissions/files — upload task evidence file.
- GET /api/reports/daily — current student's recent reports.
- POST /api/reports/daily — submit daily report.
- POST /api/reports/files — upload report file.
- GET /api/lessons/:lessonId/progress — own lesson progress.
- POST /api/lessons/:lessonId/progress — save merged watch coverage.
- POST /api/tests/:testId/attempts — submit test attempt after the video gate.
- GET /api/rankings — mentor/admin scoped ranking data.

### Admin
- GET /api/admin/overview — global marathon metrics.
- POST /api/admin/teams — create team.
- PATCH /api/admin/teams/:teamId — update team and mentor assignment.
- POST /api/admin/tasks — create task.
- POST /api/admin/lessons — create Kinescope lesson.
- POST /api/admin/tests — create test linked to lesson.
- POST /api/admin/tests/questions — create test question and options.

### Google OAuth
- GET /api/integrations/google/start — start mentor/admin Google authorization.
- GET /api/integrations/google/callback — OAuth callback.

The Google integration uses user OAuth and requests Meet read-only access. Authorization and token exchange happen server-side.

## Kinescope flow

1. Admin creates a Kinescope video.
2. Admin creates the Shyraq lesson with the Kinescope video ID and duration.
3. Student opens the lesson.
4. Player events contribute to time ranges.
5. Server merges stored ranges with incoming ranges.
6. Server calculates unique watch coverage.
7. Test unlocks only when coverage reaches the configured threshold (default 85%).

The browser never receives correct-answer fields for test options.

## Google Meet flow

1. Mentor/admin connects Google account.
2. Team is connected to a canonical Meet space resource.
3. Shyraq lists conference records for that space.
4. Participants are imported.
5. Participant sessions are imported.
6. Existing Google participant mappings are preferred.
7. If no mapping exists, Shyraq may auto-match a unique exact display-name match inside the team.
8. Ambiguous participants remain UNMATCHED.
9. Mentor can manually map an unmatched Google user ID to a student.
10. Attendance duration is calculated from participant sessions.

## Environment

Required for normal app operation:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_APP_URL

Required for server-side file/admin operations:
- SUPABASE_SERVICE_ROLE_KEY

Required for Kinescope management/API work:
- KINESCOPE_API_TOKEN
- KINESCOPE_WORKSPACE_ID

Required for Google Meet:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- GOOGLE_TOKEN_ENCRYPTION_KEY

GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.

## Supabase migrations

Apply in order:
1. 0001_initial.sql
2. 0002_security_and_storage.sql
3. 0003_test_answers.sql
4. 0004_score_events.sql
5. 0005_google_meet_integration.sql
6. 0006_meet_participant_sessions.sql
7. 0007_test_answer_privacy.sql
8. 0008_storage_and_team_hardening.sql
9. 0009_profile_privilege_hardening.sql
supabase/migrations/0009_profile_privilege_hardening.sql

## Security notes

- Registration cannot choose mentor/admin role; the database trigger always creates a student profile.
- Mentor student lookup is server-authorized.
- Team assignment is performed by a database security-definer function.
- Test correct-answer fields are not readable by normal students.
- Uploaded evidence stays in a private Supabase Storage bucket.
- Google refresh tokens are encrypted before storage.
- Service-role credentials are server-only.
- Score events are idempotent by student + source code + source ID.

## Known limitations

- Google OAuth credentials must be configured in Google Cloud before Meet sync can run.
- Kinescope credentials are not included in the repository.
- The current video gate uses client player telemetry merged server-side; it is not DRM-grade anti-cheat.
- Final score weights and streak definitions remain product configuration decisions.
- UI design for student, mentor and admin panels is intentionally not frozen by this document.