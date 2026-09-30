import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { listConferences, listParticipants, listParticipantSessions, sessionDurationSeconds } from "@/lib/google-meet";
import { recordAttendanceScore } from "@/lib/attendance-scoring";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === "Bearer " + secret;
}

function durationSeconds(start?: string, end?: string) {
  if (!start || !end) return 0;
  const s = Date.parse(start), e = Date.parse(end);
  return Number.isFinite(s) && Number.isFinite(e) && e > s ? Math.floor((e - s) / 1000) : 0;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const now = new Date();
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const endTime = now.toISOString();

  const { data: spaces } = await admin.from("meet_spaces")
    .select("team_id,external_space_id,teams(id,mentor_id,status)")
    .eq("active", true);

  let syncedTeams = 0;
  let attendanceRows = 0;
  const errors: string[] = [];

  for (const row of spaces ?? []) {
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    if (!team || team.status !== "ACTIVE" || !team.mentor_id) continue;

    try {
      const accessToken = await getGoogleAccessToken(team.mentor_id);
      const conferences = await listConferences(accessToken, row.external_space_id, startTime, endTime);
      const { data: members } = await admin.from("team_members")
        .select("student_id").eq("team_id", team.id).eq("status", "ACTIVE");
      const studentIds = new Set((members ?? []).map((member) => member.student_id));
      const { data: mappings } = await admin.from("meet_participant_mappings").select("google_user_id,student_id");
      const mapping = new Map(
        (mappings ?? [])
          .filter((item) => studentIds.has(item.student_id))
          .map((item) => [item.google_user_id, item.student_id]),
      );

      for (const conference of conferences) {
        const { data: conferenceRow } = await admin.from("meet_conferences").upsert({
          team_id: team.id,
          external_conference_id: conference.name,
          space_name: row.external_space_id,
          start_time: conference.startTime ?? null,
          end_time: conference.endTime ?? null,
          raw: conference,
        }, { onConflict: "external_conference_id" }).select("id").single();
        if (!conferenceRow) continue;

        const meetingDuration = durationSeconds(conference.startTime, conference.endTime);
        const conferenceEnded = Boolean(conference.endTime && Date.parse(conference.endTime) <= Date.now());
        const participants = await listParticipants(accessToken, conference.name);

        for (const participant of participants) {
          const googleUserId = participant.signedinUser?.user ?? null;
          const studentId = googleUserId ? mapping.get(googleUserId) ?? null : null;

          const { data: participantRow } = await admin.from("meet_participants").upsert({
            conference_id: conferenceRow.id,
            external_participant_id: participant.name,
            google_user_id: googleUserId,
            display_name: participant.signedinUser?.displayName ?? participant.anonymousUser?.displayName ?? participant.phoneUser?.displayName ?? null,
            student_id: studentId,
            match_status: studentId ? "MANUALLY_MATCHED" : "UNMATCHED",
            earliest_start_time: participant.earliestStartTime ?? null,
            latest_end_time: participant.latestEndTime ?? null,
            raw: participant,
          }, { onConflict: "conference_id,external_participant_id" }).select("id").single();

          if (!participantRow) continue;

          const sessions = await listParticipantSessions(accessToken, participant.name);
          for (const session of sessions) {
            await admin.from("meet_participant_sessions").upsert({
              participant_id: participantRow.id,
              external_session_id: session.name,
              start_time: session.startTime ?? null,
              end_time: session.endTime ?? null,
              duration_seconds: sessionDurationSeconds(session),
              raw: session,
            }, { onConflict: "participant_id,external_session_id" });
          }

          if (!studentId) continue;

          const attendedSeconds = sessions.reduce((sum, session) => sum + sessionDurationSeconds(session), 0);
          const percent = meetingDuration ? Math.min(100, Math.max(0, (attendedSeconds / meetingDuration) * 100)) : 0;

          const { data: attendanceRow, error } = await admin.from("attendance_records").upsert({
            team_id: team.id,
            student_id: studentId,
            external_conference_id: conference.name,
            session_count: sessions.length,
            attended_seconds: attendedSeconds,
            meeting_duration_seconds: meetingDuration,
            attendance_percent: Number(percent.toFixed(2)),
            status: percent === 0 ? "ABSENT" : percent < 60 ? "LOW" : percent < 85 ? "PARTIAL" : percent < 100 ? "ATTENDED" : "FULL",
            started_at: conference.startTime ?? null,
            ended_at: conference.endTime ?? null,
            imported_at: new Date().toISOString(),
          }, { onConflict: "external_conference_id,student_id" }).select("id").single();

          if (!error && attendanceRow) {
            attendanceRows += 1;
            await recordAttendanceScore(admin, {
              attendanceId: attendanceRow.id,
              studentId,
              teamId: team.id,
              attendancePercent: percent,
              conferenceEnded,
            });
          }
        }
      }

      syncedTeams += 1;
    } catch (error) {
      errors.push(team.id + ": " + (error instanceof Error ? error.message : "sync failed"));
    }
  }

  return NextResponse.json({ ok: true, syncedTeams, attendanceRows, range: { startTime, endTime }, errors });
}
