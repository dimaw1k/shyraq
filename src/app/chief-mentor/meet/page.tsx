import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { ChiefMentorMeetManager } from "@/components/staff/ChiefMentorMeetManager";
import { getAuthenticatedStaff } from "@/lib/staff/server";

type MeetType = "ALL" | "MORNING" | "EVENING" | "EXTRA";

function kzToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dayBounds(date: string) {
  return {
    start: new Date(date + "T00:00:00+05:00"),
    end: new Date(date + "T23:59:59.999+05:00"),
  };
}


export default async function ChiefMentorMeetPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; type?: MeetType }>;
}) {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const params = (await searchParams) ?? {};
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? params.date!
    : kzToday();
  const selectedType: MeetType =
    params.type === "MORNING" || params.type === "EVENING" || params.type === "EXTRA"
      ? params.type
      : "ALL";

  const { start, end } = dayBounds(selectedDate);

  const [
    { data: teams },
    { data: spaces },
    { data: conferences },
    { data: attendance },
    { data: googleConnection },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("id,name,mentor_id,status")
      .eq("status", "ACTIVE")
      .order("name"),
    supabase
      .from("meet_spaces")
      .select("id,team_id,meeting_url,display_name,external_space_id,study_time,active")
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("meet_conferences")
      .select("id,team_id,external_conference_id,space_name,start_time,end_time")
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString())
      .order("start_time", { ascending: false }),
    supabase
      .from("attendance_records")
      .select("team_id,student_id,external_conference_id,attendance_percent,status,started_at,ended_at")
      .gte("started_at", start.toISOString())
      .lte("started_at", end.toISOString())
      .order("imported_at", { ascending: false })
      .limit(5000),
    supabase
      .from("google_connections")
      .select("google_email")
      .eq("user_id", profile.id)
      .maybeSingle(),
  ]);

  const mentorIds = [...new Set((teams ?? []).map((team) => team.mentor_id).filter(Boolean))] as string[];
  const { data: mentors } = mentorIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", mentorIds)
    : { data: [] as Array<{ id: string; full_name: string }> };

  const mentorMap = new Map((mentors ?? []).map((mentor) => [mentor.id, mentor.full_name]));
  const teamMap = new Map((teams ?? []).map((team) => [team.id, team]));
  const spaceMap = new Map(
    (spaces ?? []).map((space) => [space.external_space_id, space]),
  );

  const matchingSpaces = (spaces ?? []).filter(
    (space) => selectedType === "ALL" || space.study_time === selectedType,
  );

  const latestConferenceBySpace = new Map<
    string,
    new Map<NonNullable<typeof conferences>[number]["space_name"], NonNullable<typeof conferences>[number]>
  >();
  for (const conference of conferences ?? []) {
    if (!latestConferenceBySpace.has(conference.space_name)) {
      latestConferenceBySpace.set(conference.space_name, conference);
    }
  }

  const attendanceByConference = new Map<string, typeof attendance>();
  for (const row of attendance ?? []) {
    if (!row.external_conference_id) continue;
    attendanceByConference.set(
      row.external_conference_id,
      [
        ...(attendanceByConference.get(row.external_conference_id) ?? []),
        row,
      ],
    );
  }

  const studentIds = [
    ...new Set((attendance ?? []).map((row) => row.student_id).filter(Boolean)),
  ];
  const { data: students } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", studentIds)
    : { data: [] as Array<{ id: string; full_name: string }> };

  const studentMap = new Map(
    (students ?? []).map((student) => [student.id, student.full_name]),
  );

  const rows = matchingSpaces.map((space) => {
    const conference = latestConferenceBySpace.get(space.external_space_id);
    const conferenceRows = conference
      ? attendanceByConference.get(conference.external_conference_id) ?? []
      : [];
    const valid = conferenceRows.filter((row) => row.student_id);
    const attended = valid.filter(
      (row) => Number(row.attendance_percent ?? 0) > 0,
    ).length;
    const average = valid.length
      ? valid.reduce(
          (sum, row) => sum + Number(row.attendance_percent ?? 0),
          0,
        ) / valid.length
      : 0;

    return {
      id: space.id,
      team_id: space.team_id,
      team_name: teamMap.get(space.team_id)?.name ?? "Команда",
      mentor_name: teamMap.get(space.team_id)?.mentor_id
        ? mentorMap.get(teamMap.get(space.team_id)!.mentor_id!) ?? "Ментор жоқ"
        : "Ментор жоқ",
      study_time: space.study_time as Exclude<MeetType, "ALL">,
      display_name: space.display_name,
      meeting_url: space.meeting_url,
      conference_id: conference?.external_conference_id ?? null,
      started_at: conference?.start_time ?? null,
      ended_at: conference?.end_time ?? null,
      attended,
      average: Number(average.toFixed(1)),
      participated_rows: valid.length,
      has_conference: Boolean(conference),
    };
  });

  const history = (attendance ?? [])
    .filter((row) => {
      const space = row.external_conference_id
        ? (() => {
            const conference = (conferences ?? []).find(
              (item) => item.external_conference_id === row.external_conference_id,
            );
            return conference ? spaceMap.get(conference.space_name) : null;
          })()
        : null;
      return Boolean(space);
    })
    .map((row) => {
      const conference = (conferences ?? []).find(
        (item) => item.external_conference_id === row.external_conference_id,
      );
      const space = conference ? spaceMap.get(conference.space_name) : null;
      return {
        id: row.external_conference_id + ":" + row.student_id,
        student_name: studentMap.get(row.student_id) ?? "Оқушы",
        team_id: row.team_id,
        team_name: teamMap.get(row.team_id)?.name ?? "Команда",
        type: space?.study_time ?? "EXTRA",
        percent: Number(row.attendance_percent ?? 0),
        status: row.status,
      };
    });

  const totalMeetings = rows.filter((row) => row.has_conference).length;
  const totalAttended = rows.reduce((sum, row) => sum + row.attended, 0);
  const avgAttendance = history.length
    ? history.reduce((sum, row) => sum + row.percent, 0) / history.length
    : 0;

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Кездесулер"
      hideHeader
    >
      <PageContainer>
        <ChiefMentorMeetManager
          teams={(teams ?? []).map((team) => ({
            id: team.id,
            name: team.name,
          }))}
          rows={rows}
          history={history}
          googleConnected={Boolean(googleConnection?.google_email)}
          selectedDate={selectedDate}
          selectedType={selectedType}
          stats={{
            meetings: totalMeetings,
            attended: totalAttended,
            average: Number(avgAttendance.toFixed(1)),
          }}
        />
      </PageContainer>
    </AppShell>
  );
}
