# Architecture Decisions

## ADR-001 — No WhatsApp API in v1

WhatsApp remains an external announcement channel. Shyraq does not depend on WhatsApp for core workflows.

## ADR-002 — Kinescope is the lesson-video provider

Lessons are hosted and played through Kinescope. YouTube is not part of the v1 lesson flow.

## ADR-003 — 85% watch coverage unlocks the test

The gate is based on unique watched coverage, not the latest playback position.

## ADR-004 — Mentor controls team assignment

Student registration never auto-assigns a team. Mentors add registered students by phone number; admins can reassign.

## ADR-005 — Team-based Google Meet

Each team has its own Meet space. The v1 target is approximately 60–70 students per team rather than one 300–500 student meeting.

## ADR-006 — Payments are deferred

Payment automation is deliberately excluded from v1 to reduce launch risk and recurring cost.

## ADR-007 — Supabase is the initial application backend

Use PostgreSQL, Auth and Storage from Supabase before adding separate infrastructure.

## ADR-008 — Score events instead of duplicated ranking logic

Points are stored as auditable events so ranking rules can evolve without rewriting every feature.
