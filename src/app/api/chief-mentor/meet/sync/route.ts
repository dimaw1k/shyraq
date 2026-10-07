import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import {
  listConferences,
  listParticipants,
  listParticipantSessions,
  sessionDurationSeconds,
} from "@/lib/google-meet";
import { recordAttendanceScore } from "@/lib/attendance-scoring";

type StudyTime = "ALL" | "MORNING" | "EVENING" | "EXTRA";

function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("kk-KZ")
    .replace(/[\s_]+/gu, " ")
    .trim();
}

function duration(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const s = Date.parse(start);
  const e = Date.parse(end);
  return Number.isFinite(s) && e > s ? Math.floor((e - s) / 1000) : 0;
}

function parseStudyTime(value: unknown): StudyTime {
  if (value === "MORNING" || value === "EVENING" || value === "EXTRA") {
    return value;
  }
  return value === "ALL" ? "ALL" : "MORNING";
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "CHIEF_MENTOR") {
    return NextResponse.json(
      { error: "Chief Mentor access required" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const allTeams = body?.allTeams === true;
  const requestedTeamId =
    typeof body?.teamId === "string" ? body.teamId : "";
  const studyTime = parseStudyTime(body?.studyTime);

  if (!allTeams && !requestedTeamId) {
    return NextResponse.json({ error: "teamId қажет." }, { status: 400 });
  }

  const now = new Date();
  const startTime =
    typeof body?.startTime === "string"
      ? body.startTime
      : new Date(now.getTime() - 7 * 86400000).toISOString();
  const endTime =
    typeof body?.endTime === "string" ? body.endTime : now.toISOString();

  const admin = createAdminSupabaseClient();

  const { data: activeTeams, error: teamError } = await admin
    .from("teams")
    .select("id,name,mentor_id,status")
    .eq("status", "ACTIVE")
    .order("name");

  if (teamError) {
    return NextResponse.json(
      { error: teamError.message },
      { status: 500 },
    );
  }

  const activeTeamIds = new Set((activeTeams ?? []).map((team) => team.id));
  const allowedTeamIds = requestedTeamId
    ? [requestedTeamId]
    : Array.from(activeTeamIds);

  if (requestedTeamId && !activeTeamIds.has(requestedTeamId)) {
    return NextResponse.json(
      { error: "Белсенді команда табылмады." },
      { status: 404 },
    );
  }

  let spaceQuery = admin
    .from("meet_spaces")
    .select("id,team_id,external_space_id,study_time,active")
    .eq("active", true)
    .in("team_id", allowedTeamIds);

  if (studyTime !== "ALL") {
    spaceQuery = spaceQuery.eq("study_time", studyTime);
  }

  const { data: spaces, error: spaceError } = await spaceQuery;

  if (spaceError) {
    return NextResponse.json(
      { error: spaceError.message },
      { status: 500 },
    );
  }

  if (!spaces?.length) {
    return NextResponse.json({
      ok: true,
      allTeams,
      studyTime,
      importedConferences: 0,
      attendanceRows: 0,
      matchedParticipants: 0,
      unmatchedParticipants: 0,
      skippedSpaces: 0,
      range: { startTime, endTime },
    });
  }

  const token = await getGoogleAccessToken(user.id);
  const teamIds = [...new Set(spaces.map((space) => space.team_id))];

  const { data: members } = await admin
    .from("team_members")
    .select(
      "team_id,student_id,profiles(id,full_name,phone,email)",
    )
    .in("team_id", teamIds)
    .eq("status", "ACTIVE");

  const membersByTeam = new Map<
    string,
    Array<{
      id: string;
      full_name: string;
      phone: string;
      email: string;
    }>
  >();

  for (const member of members ?? []) {
    const profile = Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles;

    if (!profile) continue;

    const list = membersByTeam.get(member.team_id) ?? [];
    list.push(profile as {
      id: string;
      full_name: string;
      phone: string;
      email: string;
    });
    membersByTeam.set(member.team_id, list);
  }

  const studentIds = [
    ...new Set(
      [...membersByTeam.values()]
        .flat()
        .map((student) => student.id),
    ),
  ];

  const { data: mappings } = studentIds.length
    ? await admin
        .from("meet_participant_mappings")
        .select("google_user_id,student_id")
        .in("student_id", studentIds)
    : { data: [] as Array<{ google_user_id: string; student_id: string }> };

  const mappingMap = new Map(
    (mappings ?? []).map((mapping) => [
      mapping.google_user_id,
      mapping.student_id,
    ]),
  );

  let importedConferences = 0;
  let attendanceRows = 0;
  let matchedParticipants = 0;
  let unmatchedParticipants = 0;
  let processedSpaces = 0;

  for (const space of spaces) {
    const students = membersByTeam.get(space.team_id) ?? [];
    const buckets = new Map<string, string[]>();

    for (const student of students) {
      const key = normalizeName(student.full_name);
      buckets.set(key, [
        ...(buckets.get(key) ?? []),
        student.id,
      ]);
    }

    const conferences = await listConferences(
      token,
      space.external_space_id,
      startTime,
      endTime,
    );

    processedSpaces += 1;

    for (const conference of conferences) {
      const externalConferenceId = conference.name;

      const { data: conferenceRow } = await admin
        .from("meet_conferences")
        .upsert(
          {
            team_id: space.team_id,
            external_conference_id: externalConferenceId,
            space_name: space.external_space_id,
            start_time: conference.startTime ?? null,
            end_time: conference.endTime ?? null,
            raw: conference,
          },
          { onConflict: "external_conference_id" },
        )
        .select("id")
        .single();

      if (!conferenceRow) continue;
      importedConferences += 1;

      const participants = await listParticipants(
        token,
        conference.name,
      );

      for (const participant of participants) {
        const googleUserId = participant.signedinUser?.user ?? null;
        const displayName =
          participant.signedinUser?.displayName ??
          participant.anonymousUser?.displayName ??
          participant.phoneUser?.displayName ??
          null;

        let studentId = googleUserId
          ? mappingMap.get(googleUserId) ?? null
          : null;

        let matchStatus = studentId
          ? "MANUALLY_MATCHED"
          : "UNMATCHED";

        if (!studentId && displayName) {
          const candidates =
            buckets.get(normalizeName(displayName)) ?? [];

          if (candidates.length === 1) {
            studentId = candidates[0];
            matchStatus = "MATCHED";
          }
        }

        if (studentId) {
          matchedParticipants += 1;
        } else {
          unmatchedParticipants += 1;
        }

        const { data: participantRow } = await admin
          .from("meet_participants")
          .upsert(
            {
              conference_id: conferenceRow.id,
              external_participant_id: participant.name,
              google_user_id: googleUserId,
              display_name: displayName,
              student_id: studentId,
              match_status: matchStatus,
              earliest_start_time:
                participant.earliestStartTime ?? null,
              latest_end_time:
                participant.latestEndTime ?? null,
              raw: participant,
            },
            {
              onConflict:
                "conference_id,external_participant_id",
            },
          )
          .select("id")
          .single();

        if (!participantRow) continue;

        const sessions = await listParticipantSessions(
          token,
          participant.name,
        );

        for (const session of sessions) {
          await admin
            .from("meet_participant_sessions")
            .upsert(
              {
                participant_id: participantRow.id,
                external_session_id: session.name,
                start_time: session.startTime ?? null,
                end_time: session.endTime ?? null,
                duration_seconds:
                  sessionDurationSeconds(session),
                raw: session,
              },
              { onConflict: "participant_id,external_session_id" },
            );
        }

        if (!studentId) continue;

        const attendedSeconds = sessions.reduce(
          (sum, session) =>
            sum + sessionDurationSeconds(session),
          0,
        );
        const meetingDuration = duration(
          conference.startTime,
          conference.endTime,
        );
        const attendancePercent = meetingDuration
          ? Math.min(
              100,
              Math.max(
                0,
                (attendedSeconds / meetingDuration) * 100,
              ),
            )
          : 0;
        const status =
          attendancePercent === 0
            ? "ABSENT"
            : attendancePercent < 60
              ? "LOW"
              : attendancePercent < 85
                ? "PARTIAL"
                : attendancePercent < 100
                  ? "ATTENDED"
                  : "FULL";

        const { data: attendanceRow } = await admin
          .from("attendance_records")
          .upsert(
            {
              team_id: space.team_id,
              student_id: studentId,
              external_conference_id:
                externalConferenceId,
              session_count: sessions.length,
              attended_seconds: attendedSeconds,
              meeting_duration_seconds: meetingDuration,
              attendance_percent: Number(
                attendancePercent.toFixed(2),
              ),
              status,
              started_at: conference.startTime ?? null,
              ended_at: conference.endTime ?? null,
              imported_at: new Date().toISOString(),
            },
            {
              onConflict:
                "external_conference_id,student_id",
            },
          )
          .select("id")
          .single();

        if (attendanceRow) {
          attendanceRows += 1;

          await recordAttendanceScore(admin, {
            attendanceId: attendanceRow.id,
            studentId,
            teamId: space.team_id,
            attendancePercent,
            conferenceEnded: Boolean(
              conference.endTime &&
                Date.parse(conference.endTime) <= Date.now(),
            ),
          });
        }
      }
    }
  }

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    actor_role: "CHIEF_MENTOR",
    action: "CHIEF_MENTOR_MEET_SYNCED",
    entity_type: "MEET_SYNC",
    entity_id: user.id,
    metadata: {
      allTeams,
      studyTime,
      processedSpaces,
      importedConferences,
      attendanceRows,
      matchedParticipants,
      unmatchedParticipants,
      startTime,
      endTime,
    },
  });

  return NextResponse.json({
    ok: true,
    allTeams,
    studyTime,
    processedSpaces,
    importedConferences,
    attendanceRows,
    matchedParticipants,
    unmatchedParticipants,
    range: { startTime, endTime },
  });
}
