import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { getMeetSpace, listConferences, listParticipants, listParticipantSessions, sessionDurationSeconds } from "@/lib/google-meet";
import { recordAttendanceScore } from "@/lib/attendance-scoring";

function normalizeName(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("kk-KZ").replace(/[\s_]+/gu, " ").trim();
}

function conferenceDurationSeconds(start?: string, end?: string) {
  if (!start || !end) return 0;
  const s = Date.parse(start);
  const e = Date.parse(end);
  return Number.isFinite(s) && Number.isFinite(e) && e > s ? Math.floor((e - s) / 1000) : 0;
}

function meetingCodeFromUrl(meetingUrl?: string | null) {
  if (!meetingUrl) return null;
  try {
    const url = new URL(meetingUrl);
    if (url.hostname !== "meet.google.com") return null;
    const code = url.pathname.replace(/^\//, "").split("/")[0];
    return /^[a-z0-9-]{6,}$/i.test(code) ? code : null;
  } catch {
    return null;
  }
}

async function resolveSpaceName(
  accessToken: string,
  configuredSpaceId: string,
  meetingUrl?: string | null,
) {
  if (configuredSpaceId.startsWith("spaces/")) return configuredSpaceId;

  const code = meetingCodeFromUrl(meetingUrl);
  if (!code) throw new Error("Google Meet space identifier is not configured.");

  const space = await getMeetSpace(accessToken, code);
  const name = typeof space.name === "string" ? space.name : "";
  if (!name.startsWith("spaces/")) throw new Error("Google Meet space could not be resolved.");
  return name;
}

export type MeetSyncResult = {
  teamId: string;
  importedConferences: number;
  importedParticipants: number;
  matchedParticipants: number;
  unmatchedParticipants: number;
  attendanceRows: number;
  startTime: string;
  endTime: string;
};

export async function syncTeamMeet(teamId: string, startTime?: string, endTime?: string): Promise<MeetSyncResult> {
  const admin = createAdminSupabaseClient();

  const { data: team, error: teamError } = await admin
    .from("teams")
    .select("id,name,mentor_id,status")
    .eq("id", teamId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (teamError || !team) throw new Error("Team not found or inactive.");
  if (!team.mentor_id) throw new Error("Team mentor is not assigned.");

  const { data: space, error: spaceError } = await admin
    .from("meet_spaces")
    .select("id,team_id,external_space_id,meeting_url,active")
    .eq("team_id", teamId)
    .eq("active", true)
    .maybeSingle();

  if (spaceError || !space) throw new Error("Meet space is not connected to this team.");

  const now = new Date();
  const rangeStart = startTime ?? new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const rangeEnd = endTime ?? now.toISOString();

  const accessToken = await getGoogleAccessToken(team.mentor_id);
  const resolvedSpaceName = await resolveSpaceName(accessToken, space.external_space_id, space.meeting_url);

  if (resolvedSpaceName !== space.external_space_id) {
    await admin.from("meet_spaces").update({
      external_space_id: resolvedSpaceName,
    }).eq("id", space.id);
  }

  const conferences = await listConferences(accessToken, resolvedSpaceName, rangeStart, rangeEnd);

  const { data: members } = await admin
    .from("team_members")
    .select("student_id,profiles(id,full_name,phone,email)")
    .eq("team_id", teamId)
    .eq("status", "ACTIVE");

  const students = (members ?? [])
    .map((item) => Array.isArray(item.profiles) ? item.profiles[0] : item.profiles)
    .filter(Boolean) as Array<{ id: string; full_name: string; phone: string; email: string }>;

  const nameBuckets = new Map<string, string[]>();
  for (const student of students) {
    const key = normalizeName(student.full_name);
    nameBuckets.set(key, [...(nameBuckets.get(key) ?? []), student.id]);
  }

  const { data: mappings } = await admin
    .from("meet_participant_mappings")
    .select("google_user_id,student_id");

  const mappingMap = new Map(
    (mappings ?? [])
      .filter((mapping) => students.some((student) => student.id === mapping.student_id))
      .map((mapping) => [mapping.google_user_id, mapping.student_id]),
  );

  let importedConferences = 0;
  let importedParticipants = 0;
  let matchedParticipants = 0;
  let unmatchedParticipants = 0;
  let attendanceRows = 0;

  for (const conference of conferences) {
    const externalConferenceId = conference.name;
    const { data: conferenceRow, error: conferenceError } = await admin
      .from("meet_conferences")
      .upsert({
        team_id: teamId,
        external_conference_id: externalConferenceId,
        space_name: resolvedSpaceName,
        start_time: conference.startTime ?? null,
        end_time: conference.endTime ?? null,
        raw: conference,
      }, { onConflict: "external_conference_id" })
      .select("id")
      .single();

    if (conferenceError || !conferenceRow) continue;
    importedConferences += 1;

    const participants = await listParticipants(accessToken, conference.name);

    for (const participant of participants) {
      const googleUserId = participant.signedinUser?.user ?? null;
      const displayName =
        participant.signedinUser?.displayName ??
        participant.anonymousUser?.displayName ??
        participant.phoneUser?.displayName ??
        null;

      let studentId = googleUserId ? mappingMap.get(googleUserId) ?? null : null;
      let matchStatus = studentId ? "MANUALLY_MATCHED" : "UNMATCHED";

      if (!studentId && displayName) {
        const candidates = nameBuckets.get(normalizeName(displayName)) ?? [];
        if (candidates.length === 1) {
          studentId = candidates[0];
          matchStatus = "MATCHED";
        }
      }

      if (studentId) matchedParticipants += 1;
      else unmatchedParticipants += 1;

      const { data: participantRow, error: participantError } = await admin
        .from("meet_participants")
        .upsert({
          conference_id: conferenceRow.id,
          external_participant_id: participant.name,
          google_user_id: googleUserId,
          display_name: displayName,
          student_id: studentId,
          match_status: matchStatus,
          earliest_start_time: participant.earliestStartTime ?? null,
          latest_end_time: participant.latestEndTime ?? null,
          raw: participant,
        }, { onConflict: "conference_id,external_participant_id" })
        .select("id")
        .single();

      if (participantError || !participantRow) continue;
      importedParticipants += 1;

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

      const attendedSeconds = sessions.reduce(
        (sum, session) => sum + sessionDurationSeconds(session),
        0,
      );
      const meetingDuration = conferenceDurationSeconds(conference.startTime, conference.endTime);
      const attendancePercent = meetingDuration > 0
        ? Math.min(100, Math.max(0, (attendedSeconds / meetingDuration) * 100))
        : 0;

      const status =
        attendancePercent === 0 ? "ABSENT" :
        attendancePercent < 60 ? "LOW" :
        attendancePercent < 85 ? "PARTIAL" :
        attendancePercent < 100 ? "ATTENDED" :
        "FULL";

      const { data: attendanceRow, error: attendanceError } = await admin
        .from("attendance_records")
        .upsert({
          team_id: teamId,
          student_id: studentId,
          external_conference_id: externalConferenceId,
          session_count: sessions.length,
          attended_seconds: attendedSeconds,
          meeting_duration_seconds: meetingDuration,
          attendance_percent: Number(attendancePercent.toFixed(2)),
          status,
          started_at: conference.startTime ?? null,
          ended_at: conference.endTime ?? null,
          imported_at: new Date().toISOString(),
        }, { onConflict: "external_conference_id,student_id" })
        .select("id")
        .single();

      if (!attendanceError && attendanceRow) {
        attendanceRows += 1;
        await recordAttendanceScore(admin, {
          attendanceId: attendanceRow.id,
          studentId,
          teamId,
          attendancePercent,
          conferenceEnded: Boolean(conference.endTime && Date.parse(conference.endTime) <= Date.now()),
        });
      }
    }
  }

  return {
    teamId,
    importedConferences,
    importedParticipants,
    matchedParticipants,
    unmatchedParticipants,
    attendanceRows,
    startTime: rangeStart,
    endTime: rangeEnd,
  };
}
