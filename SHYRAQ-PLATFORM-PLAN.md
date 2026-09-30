# Shyraq — Full Platform Plan

> **Project:** Shyraq Marathon Platform  
> **Repository:** https://github.com/dimaw1k/shyraq  
> **Status:** Planning / Greenfield  
> **Primary goal:** Build a low-cost, production-ready platform for a 300–500 student discipline and development marathon with student, mentor, and admin workflows.

## 1. Product Vision

Shyraq is not intended to replace WhatsApp. WhatsApp remains an external announcement channel only.

Shyraq is the operational system of the marathon:

- student registration and profile;
- manual mentor-to-student team assignment;
- daily tasks and submissions;
- daily reports;
- file/image attachments;
- Kinescope-hosted video lessons;
- measurable video progress;
- unlocking lesson tests only after required watch coverage;
- Google Meet attendance per team;
- student and team rankings;
- streaks and points;
- mentor-level team management;
- admin/head-level global analytics;
- auditability and reliable data.

The first release must prioritize the smallest set of features that creates operational value while keeping recurring infrastructure costs low.

## 2. Explicit Scope Decisions

### Included in v1

- Student registration.
- Student login.
- Student profile.
- Required registration data: phone number, email, full name, age, school/college/university/other education place.
- Student lifecycle: REGISTERED, WAITING_FOR_TEAM, ACTIVE, INACTIVE, COMPLETED (future use).
- Mentor-managed team assignment by phone number.
- Duplicate and conflicting assignment detection.
- Teams and mentors.
- Tasks.
- Task submissions.
- Image/file uploads.
- Daily reports.
- Kinescope lessons.
- Video progress tracking.
- 85% video-watch gate for tests.
- Lesson tests and results.
- Google Meet per-team attendance.
- Participant-session attendance calculation.
- Student ranking.
- Team ranking.
- Points.
- Streaks.
- Mentor team statistics.
- Admin/head global statistics.
- Audit logs.
- Role-based authorization.
- Server-side validation.
- Database row-level security where supported.
- Production logging and error handling.
- Responsive web UI.

### Explicitly NOT included in v1

- WhatsApp Business API.
- WhatsApp automation.
- Payment automation.
- Online payment providers.
- OTP login.
- SMS verification.
- Email verification.
- Password recovery.
- Subscription billing.
- Native iOS/Android application.
- AI mentor features.
- In-app chat.
- Complex CRM.
- Multi-organization / multi-tenant SaaS.
- Advanced notification infrastructure.
- Automatic student assignment to teams.
- YouTube as the lesson-video source.

These can be introduced after real marathon usage validates the core platform.

## 3. Core Principles

### 3.1 Cost first

Use managed services before custom infrastructure.

Initial target stack: Next.js, Vercel, Supabase, Kinescope, Google Workspace / Google Meet.

Do not introduce AWS, Redis, Kafka, separate object storage, separate analytics database, or microservices unless real usage requires them.

### 3.2 Server is the source of truth

The browser must never be trusted to assign teams, grant test access, calculate final scores, overwrite attendance, modify another student's data, or grant mentor/admin permissions.

Critical business rules are enforced server-side.

### 3.3 Modular architecture

Build separate modules for auth, users, students, mentors, teams, tasks, reports, lessons, video progress, tests, Meet attendance, scoring, ranking, analytics, and audit logs.

### 3.4 Build for 500 users, not 5,000

The system must be structurally scalable but must not pay for hypothetical traffic.

Target launch size: approximately 300–500 students, 5–6 mentors/team leaders, a small admin/head group, and one marathon instance.

## 4. Roles and Permissions

### Student

Can register, sign in, view own profile, update allowed profile fields, view assigned team, view active tasks, submit tasks, upload permitted files/images, submit daily reports, view own Kinescope lessons, watch lessons, unlock and take tests after required coverage, view own video progress, attendance, score and allowed ranking information, and view own streak.

Cannot view another student's private data, assign students, modify team membership, modify scores or attendance, or access mentor/admin dashboards.

### Mentor

Can view own team, search students by phone, add registered students to own team, detect unregistered/assigned students, view team activity, submissions, reports, attendance, video progress and team ranking.

Cannot move students between other teams, change global scoring rules, manage system configuration, or change admin permissions.

### Admin / Head

Can manage mentors, teams, students, lessons, tasks, tests, reports, attendance, rankings, global analytics, scoring rules, audit logs, marathon settings, and support actions.

## 5. Student Lifecycle

Registration does not automatically assign the student to a team.

Lifecycle:

`REGISTERED -> WAITING_FOR_TEAM -> ACTIVE`

Possible future states:

`ACTIVE -> INACTIVE`

`ACTIVE -> COMPLETED`

A newly registered student must clearly see that they are waiting for mentor assignment.

## 6. Registration

### Required fields

- phone number;
- email;
- full name;
- age;
- education type;
- education place.

Education type can be SCHOOL, COLLEGE, UNIVERSITY, OTHER.

### Rules

- normalize phone numbers before storage;
- reject or safely handle duplicate phone numbers;
- safely handle duplicate email;
- validate age;
- require a non-empty full name;
- never auto-assign a team.

### v1 Authentication

Use a basic credential flow compatible with Supabase Auth.

Do not build OTP, SMS verification, email verification, or password recovery in v1.

Passwords must be handled by the auth provider rather than custom password hashing.

## 7. Mentor Student Assignment

This is a critical v1 workflow.

Mentor clicks **Add Student** and enters only the phone number.

### Result A — student exists and is unassigned

Show name, email, age, education place, status, and assignment availability.

Action: **Add to my team**.

### Result B — student not registered

Show: `No Shyraq account found for this phone number.`

### Result C — student belongs to another team

Show: `This student is already assigned to another team.`

Do not expose unnecessary private information.

### Result D — student already in current team

Show: `This student is already in your team.`

Only a mentor with permission over a team can add a student to that team. Admin can override/reassign.

## 8. Team Model

Each team contains: id, name, mentor, status, optional capacity, created_at, updated_at.

Initial operating assumption: 5–6 teams with roughly 60–70 students per team.

v1 does not automatically balance teams. Mentors manually add students.

## 9. Task System

A task contains title, description, instructions, start date/time, deadline, points, attachment requirement, active status, creator, optional team scope, created_at and updated_at.

Student task submission can contain text, uploaded image, uploaded document, and submission timestamp.

Possible submission states: NOT_STARTED, DRAFT, SUBMITTED, REVIEWED, REJECTED (future/optional).

v1 can keep the workflow simple and use SUBMITTED as the primary final state.

## 10. File Uploads

Use Supabase Storage for v1.

Supported examples: JPG, PNG, PDF, and common office/document files.

Set explicit limits on file size, content type, and number of attachments.

Do not allow arbitrary executable files.

Every uploaded file is associated with an owner/student, submission/report, and created_at.

Suggested storage pattern: `submissions/{studentId}/{submissionId}/{fileId}`.

## 11. Daily Reports

Students submit one daily report per required reporting period.

Suggested fields: report date, study minutes, completed task count, reflection text, difficulty/challenge, next-day goal, attachments, submitted_at.

Status: NOT_SUBMITTED, SUBMITTED, REVIEWED (optional).

Calculate report completion rate, missed report count, report streak, and team report completion.

## 12. Kinescope Lesson System

YouTube is not used for v1 lesson delivery.

Kinescope is the video platform.

Each lesson contains: title, description, Kinescope video id, duration, required watch percentage, test association, availability status, ordering, publication date.

Default required watch percentage: `85`.

Lesson lifecycle:

1. Upload video to Kinescope.
2. Get the Kinescope video identifier.
3. Create lesson in Shyraq.
4. Associate video.
5. Attach test.
6. Publish lesson.

Student lifecycle:

1. Open lesson.
2. Watch embedded Kinescope player.
3. Capture player events.
4. Store progress.
5. Calculate unique watched coverage.
6. Unlock test at or above 85%.

## 13. Kinescope Progress Logic

Do not calculate completion from a single current playback position.

For example, a 60-minute video should not count as 92% watched merely because the student jumps to 55:00.

Instead, maintain covered time ranges, merge overlapping ranges, and calculate:

`uniqueWatchedSeconds / videoDurationSeconds * 100`

Progress persistence should use periodic batched updates plus pause, seek, ended, and unload events rather than a database write every second.

Suggested video progress fields:

- student_id;
- lesson_id;
- duration_seconds;
- watched_seconds;
- watched_percent;
- maximum_position_seconds;
- completed;
- test_unlocked;
- first_started_at;
- last_watched_at.

Optional advanced data: watch sessions/ranges.

## 14. Video Gate

Before 85%:

`test_unlocked = false`

Display: `Watch at least 85% of the lesson to unlock the test.`

At or above 85%:

`test_unlocked = true`

Display: `Test unlocked.`

The backend must re-check eligibility when the test is opened. Never trust a client-side unlock flag.

## 15. Lesson Tests

Each lesson can optionally have one test.

Test contains: title, instructions, questions, answer options, correct answer, points, passing score (optional), active status.

Student can start only when video progress meets required watch percentage.

Test result stores student, lesson, attempt, answers, score, and submitted_at.

v1 may use one attempt by default unless product rules require otherwise.

## 16. Google Meet Integration

Each team has its own Google Meet.

Example: ALASH -> Meet A, TULPAR -> Meet B, SAMGAU -> Meet C.

Do not combine all 300–500 students into one meeting.

Required flow:

1. Authorized mentor/admin connects the team to a Meet space.
2. Shyraq stores the Meet space identifier.
3. Conferences occur in Google Meet.
4. Shyraq retrieves conference, participant, and session data.
5. Participant identity is matched to a Shyraq student.
6. Join/leave sessions are calculated.
7. Total attendance duration is stored.

## 17. Attendance Calculation

Example:

`19:03–19:47 = 44 min`

`19:50–20:28 = 38 min`

Total = `82 min`.

For a 90-minute lesson:

`attendance_percent = 82 / 90 * 100 = 91.1%`

Store both raw session records and derived totals.

## 18. Meet Identity Matching

Preferred matching order:

1. Google account/user identity;
2. Shyraq email association;
3. manual matching for unresolved participants.

Possible participant states:

- MATCHED;
- UNMATCHED;
- MANUALLY_MATCHED;
- IGNORED.

Do not silently attach an uncertain participant to the wrong student.

## 19. Attendance Status

Suggested derived statuses: ABSENT, LOW, PARTIAL, ATTENDED, FULL.

Exact threshold values should be configuration rather than hard-coded product rules.

## 20. Scoring Engine

Do not hard-code ranking directly inside task/report/attendance features.

Create a central scoring model.

Possible score sources:

- task completion;
- daily report;
- attendance;
- video completion;
- test score;
- streak bonus.

Store score events.

Example events:

- +10 task;
- +5 daily report;
- +20 attendance;
- +10 video;
- +3 streak.

Final weights must be decided by the marathon organizers.

Recommended architecture: a configurable `score_rules` layer for TASKS, REPORTS, ATTENDANCE, VIDEO, TESTS, and STREAK.

## 21. Streak System

A streak represents consecutive successful days according to marathon rules.

Example candidate rule:

`daily_success = report_submitted AND required_task_completed`

Store current_streak, longest_streak, and last_successful_date.

The exact definition remains configurable.

## 22. Student Ranking

Student ranking is based on total score.

Possible display: current rank, points, streak, and selected performance metrics.

Visibility rules for the public leaderboard should be a product setting rather than assumed.

## 23. Team Ranking

Team score must not depend on one student.

Possible aggregation factors:

- average student score;
- attendance completion;
- report completion;
- task completion;
- video completion.

Exact weights should remain configurable.

## 24. Mentor Dashboard Requirements

Mentor sees only their own team.

Core data:

- student count;
- active students;
- attendance average;
- report completion;
- task completion;
- average score;
- team ranking;
- problem students.

Problem flags can include missed report, low attendance, low task completion, broken streak, and low video progress.

## 25. Admin / Head Dashboard Requirements

Admin/head sees the entire marathon.

Global metrics:

- total students;
- registered;
- waiting for team;
- active;
- teams;
- mentors;
- average attendance;
- report completion;
- task completion;
- video completion;
- test completion;
- average score;
- team performance;
- top students;
- unresolved Meet participants.

Admin dashboard is for operational oversight, not student experience.

## 26. Audit Log

Record important actions such as mentor assignment, admin reassignment, score rule changes, report/task submissions, attendance imports, manual attendance matching, and lesson publication.

Suggested fields:

- actor_id;
- actor_role;
- action;
- entity_type;
- entity_id;
- metadata;
- created_at.

Audit logs should be append-only from normal application actions.

## 27. Database Design

Initial core entities:

- users;
- students;
- mentors;
- admins;
- teams;
- team_members;
- tasks;
- task_submissions;
- submission_files;
- daily_reports;
- report_files;
- lessons;
- lesson_tests;
- test_questions;
- test_attempts;
- test_answers;
- video_progress;
- video_watch_sessions or ranges;
- meet_spaces;
- meet_conferences;
- meet_participants;
- meet_participant_sessions;
- attendance_records;
- score_rules;
- score_events;
- rankings or ranking snapshots where required;
- audit_logs;
- marathon_settings.

Avoid putting every feature into one giant table.

## 28. Relationship Rules

- One auth user -> one student profile.
- One team -> one primary mentor in v1.
- One student -> zero or one active team assignment.
- One lesson -> one Kinescope video.
- One lesson -> zero or one test.
- One conference -> many participants.
- One participant -> many sessions.
- One student -> many attendance records over time.

Historical team assignments should be retained if needed for auditability.

## 29. Data Integrity Rules

Must enforce:

- normalized phone uniqueness;
- email uniqueness where applicable;
- one active team per student;
- valid mentor-team ownership;
- no cross-team mentor access;
- no test unlock without video eligibility;
- no negative scores;
- no attendance for an unknown conference;
- file ownership checks;
- immutable audit entries.

## 30. Security

Minimum security:

- Supabase Auth for credentials;
- server-side authorization;
- Row Level Security where appropriate;
- strict role checks;
- API input validation;
- file type and size validation;
- no service keys in client code;
- environment secrets only;
- safe database queries;
- rate limiting on sensitive endpoints;
- protected admin routes;
- safe user-facing error messages;
- audit logging.

Never expose service-role keys, internal database errors, or other students' private records.

## 31. UI/UX Principles

The visual design is intentionally not fully specified in this document.

The product owner will define student, mentor, and admin dashboard structures, navigation, cards, tables, colors, branding, and interaction style.

Engineering should implement the approved UI without changing product intent.

## 32. Notification Strategy in v1

No WhatsApp API and no expensive notification infrastructure.

However, internal event hooks should be possible for future notifications, including TASK_CREATED, REPORT_MISSED, LESSON_AVAILABLE, TEST_UNLOCKED, ATTENDANCE_IMPORTED, and STREAK_BROKEN.

## 33. Payments

Payment automation is explicitly deferred.

v1 does not implement Kaspi, Halyk, Freedom, card acquiring, subscription billing, or payment webhooks.

Architecture should allow a future Payment module without changing student/team/task core logic.

## 34. Performance Strategy

Target: about 500 students, 5–6 mentors, and normal marathon peak activity.

Avoid per-second writes, full table scans for every dashboard request, and recomputing all rankings on every UI render.

Use indexes, aggregated queries, batched writes, pagination, cacheable summaries where useful, and background processing for attendance import if required.

## 35. Cost Control

Initial stack:

- Vercel;
- Supabase;
- Kinescope;
- Google Meet / Workspace.

Avoid additional services until required.

Use free tiers during development where practical and upgrade only the services that hit real limits.

## 36. Deployment

Production target:

- GitHub main branch;
- Vercel deployment;
- Supabase production project;
- Kinescope production content;
- separate environment variables for local/preview/production.

Environments:

- local;
- preview;
- production.

Do not use production credentials locally unless necessary and secured.

## 37. Environment Variables

Expected categories:

- Supabase URL;
- Supabase public key;
- Supabase service-role key (server-only);
- Kinescope credentials if required;
- Google OAuth credentials;
- Google Meet integration credentials;
- application base URL;
- environment name.

Secrets must never be committed to Git.

## 38. Testing Strategy

### Unit tests

Test score calculation, streak calculation, watch coverage calculation, attendance duration calculation, phone normalization, and permission checks.

### Integration tests

Test registration, mentor search, team assignment, task submission, report submission, video gate, and attendance import.

### End-to-end tests

Critical flow:

Student registers -> mentor searches by phone -> mentor assigns student -> student opens task -> student uploads file -> student submits report -> student watches Kinescope lesson -> test unlocks at required coverage -> Meet attendance appears -> score/rank updates.

## 39. Scale Test Plan

Validate progressively at 10, 50, 100, 300, and 500 students.

Measure page response, database latency, video progress writes, report submission speed, dashboard queries, and attendance processing time.

The goal is stable operation at about 500 students, not theoretical mega-scale.

## 40. Error Handling

User-facing errors should be understandable.

Examples:

- `This phone number is not registered in Shyraq.`
- `This student is already assigned to another team.`
- `You do not have permission to add students to this team.`
- `Watch at least 85% of the lesson to unlock the test.`
- `This file type is not supported.`

Do not show raw stack traces.

## 41. Admin Data Export

Future-friendly export layer should support CSV and XLSX for students, team membership, attendance, reports, tasks, scores, and rankings.

This is lower priority than the core operational flows.

## 42. Development Phases

### Phase 0 — Repository and foundation

- project setup;
- Next.js;
- TypeScript;
- Tailwind;
- Supabase;
- environment setup;
- linting;
- formatting;
- base architecture;
- database migration strategy;
- README;
- project documentation.

### Phase 1 — Auth and students

- auth;
- registration;
- student profile;
- lifecycle statuses.

### Phase 2 — Teams and mentors

- teams;
- mentors;
- mentor access control;
- phone search;
- assignment;
- duplicate/conflict states.

### Phase 3 — Tasks and reports

- task CRUD;
- submissions;
- files;
- daily reports.

### Phase 4 — Kinescope

- lesson model;
- Kinescope integration;
- player embedding;
- progress;
- watch coverage;
- 85% unlock;
- tests.

### Phase 5 — Google Meet

- Google integration;
- team Meet mapping;
- conference retrieval;
- participant retrieval;
- session retrieval;
- matching;
- attendance.

### Phase 6 — Scores and rankings

- score rules;
- score events;
- streaks;
- student ranking;
- team ranking.

### Phase 7 — Dashboards

- student;
- mentor;
- admin/head;
- global metrics.

### Phase 8 — Security / quality

- RLS;
- role checks;
- audit logs;
- file validation;
- edge cases;
- tests;
- performance.

### Phase 9 — Production readiness

- deployment;
- environment checks;
- smoke tests;
- load checks;
- monitoring;
- backups;
- documentation.

## 43. Critical Proof-of-Concepts

Before building every screen, prove these four technical flows:

### POC 1 — Registration -> Mentor assignment

Registration -> phone search -> unassigned student -> add to team.

### POC 2 — Kinescope progress -> test gate

Video -> player event -> progress -> unique coverage -> 85% -> test unlock.

### POC 3 — Google Meet -> attendance

Meet -> participant -> sessions -> identity match -> total minutes.

### POC 4 — Task/report -> storage

Task/report -> file upload -> database record -> mentor visibility.

If any of these four flows are unreliable, do not continue expanding UI.

## 44. Definition of Done for v1

v1 is complete only when:

- students can register;
- mentors can add students by phone;
- team assignment is reliable;
- students can perform tasks;
- students can submit files/images;
- daily reports work;
- Kinescope videos work inside the platform;
- watch coverage is calculated correctly;
- tests remain locked before required coverage;
- tests unlock at required coverage;
- each team can be linked to a Google Meet;
- attendance can be imported and calculated;
- mentor sees only their team;
- admin sees global data;
- scores and rankings are consistent;
- audit logs exist;
- critical flows have tests;
- production environment is configured;
- no secrets are committed;
- system is usable at roughly 500 students.

## 45. Future Roadmap

Only after a successful marathon cycle:

- payment automation;
- password recovery;
- OTP login;
- notifications;
- WhatsApp API if business need appears;
- certificates;
- advanced gamification;
- automated team balancing;
- advanced mentor feedback;
- public leaderboards;
- advanced analytics;
- mobile app;
- multi-marathon support;
- multi-organization SaaS;
- subscription/billing layer;
- AI-assisted mentor tools.

## 46. Product KPIs

### Activation

- registration completion;
- percentage assigned to teams;
- time from registration to team assignment.

### Engagement

- daily active students;
- task completion;
- report completion;
- lesson completion;
- test completion.

### Attendance

- average Meet attendance;
- low-attendance students;
- unmatched participants.

### Discipline / retention

- current streak;
- longest streak;
- consecutive active days;
- inactivity rate.

### Team operations

- students per team;
- team report completion;
- team attendance;
- average team score.

## 47. Non-goals for the first release

The first version is not a complete LMS, CRM, communication suite, or payments platform.

The first version is an operations system for a structured marathon.

Core value:

**Registration -> Team assignment -> Tasks -> Reports -> Video progress -> Meet attendance -> Score -> Ranking -> Analytics**

Everything else comes later.

## 48. Recommended Initial Technical Stack

- Frontend: Next.js + TypeScript;
- UI: Tailwind CSS and reusable components;
- Backend: Next.js server APIs/server actions where appropriate;
- Database: Supabase PostgreSQL;
- Auth: Supabase Auth;
- Storage: Supabase Storage;
- Video: Kinescope;
- Live lessons: Google Meet;
- Hosting: Vercel;
- Source control: GitHub.

Do not introduce a separate backend service in v1 unless a concrete limitation requires it.

## 49. Repository Structure Target

Recommended structure:

`src/app/`
`src/components/`
`src/features/`
`src/lib/`
`src/server/`
`src/types/`
`src/config/`

Suggested feature modules:

`src/features/auth`
`src/features/students`
`src/features/mentors`
`src/features/teams`
`src/features/tasks`
`src/features/reports`
`src/features/lessons`
`src/features/tests`
`src/features/video-progress`
`src/features/meet-attendance`
`src/features/scoring`
`src/features/rankings`
`src/features/analytics`
`src/features/audit`

Keep business logic out of large page components.

## 50. Engineering Rules

1. No secrets in Git.
2. No client-side authorization as the only security layer.
3. No direct database access from untrusted client logic.
4. No scoring logic duplicated across components.
5. No video-gate logic implemented only in the UI.
6. No automatic team assignment in v1.
7. No WhatsApp API in v1.
8. No payment integration in v1.
9. No unnecessary infrastructure.
10. Every major feature gets tests.
11. Every critical business rule is server-validated.
12. Important data mutations are auditable.

## 51. Immediate Build Order

1. Repository foundation.
2. Environment/configuration.
3. Supabase integration.
4. Database schema.
5. Auth.
6. Student registration.
7. Teams.
8. Mentors.
9. Mentor phone search.
10. Student assignment.
11. Tasks.
12. File uploads.
13. Daily reports.
14. Kinescope proof-of-concept.
15. Video progress.
16. 85% gate.
17. Tests.
18. Google Meet proof-of-concept.
19. Attendance engine.
20. Score engine.
21. Rankings.
22. Mentor dashboard.
23. Student dashboard.
24. Admin analytics.
25. Audit logs.
26. Security hardening.
27. Test suite.
28. Production deployment.
29. 10 -> 50 -> 100 -> 300 -> 500 user validation.

## 52. Current Repository Status

The GitHub repository is active on `main`, with the v1 implementation and migrations committed.

Next engineering action:

**Complete production configuration, smoke testing, and the remaining analytics/streak work before launch.**

This document is the source of truth for the v1 implementation scope. Scope changes should be recorded explicitly rather than silently adding features during development.


## 53. Implementation Status — 2026-09-30

The repository is no longer empty. The initial foundation is implemented.

### Completed foundation

- Next.js / TypeScript / Tailwind project skeleton.
- Supabase browser/server clients.
- Supabase Auth registration and login skeleton.
- Secure student-first registration trigger.
- Student waiting-for-team lifecycle.
- Phone normalization for Kazakhstan numbers.
- Mentor phone-based student lookup API.
- Mentor student-to-team assignment API and database function.
- Teams, students, mentors and core role RLS.
- Tasks and task submissions.
- Private file upload path through Supabase Storage.
- Daily reports.
- Kinescope lesson entity and React player integration.
- Unique video watch coverage calculation.
- 85% test unlock gate.
- Lesson tests and server-side scoring.
- Idempotent score events.
- Student, mentor and admin overview APIs.
- Role-scoped ranking API.
- Google OAuth connection flow.
- Encrypted Google refresh-token storage.
- Team Google Meet space connection.
- Google Meet conference/participant/session sync.
- Raw participant/session persistence.
- Manual Google participant-to-student mapping.
- Attendance duration and attendance percentage calculation.
- Admin APIs for teams, tasks, lessons and tests.
- GitHub Actions quality pipeline.
- API/setup documentation.

### Not yet production-complete

- Final student/mentor/admin UI defined by the product owner.
- Production Google Cloud OAuth configuration.
- Production Kinescope credentials and content import workflow.
- Full attendance scheduling/background sync.
- Final score weights and exact streak rules.
- Admin user management UI for student/mentor/admin role and status changes.
- Mentor operational metrics for reports, tasks, video progress, attendance and score.
- Server-only mutation hardening for integrity-sensitive records.
- Student ranking UI with personal position.
- Full automated end-to-end test suite.
- Local build verification in this execution environment; GitHub Actions is configured to run typecheck, lint and build on push/PR.
- Final score weights and formal streak rules remain product configuration decisions.

This section is an implementation checkpoint and does not replace the original product scope.
