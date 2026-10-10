const MEET_API = "https://meet.googleapis.com/v2";

type JsonRecord = Record<string, unknown>;

const MEET_API_TIMEOUT_MS = 10_000;
const RESOURCE_PATH_RE = /^\/[A-Za-z0-9_./-]+$/;

async function getJson(path: string, accessToken: string, searchParams?: URLSearchParams) {
  if (
    !RESOURCE_PATH_RE.test(path) ||
    path.includes("..") ||
    path.includes("//") ||
    !accessToken ||
    accessToken.length > 8192
  ) {
    throw new Error("Google Meet request parameters are invalid.");
  }

  const url = new URL(MEET_API + path);
  if (searchParams) url.search = searchParams.toString();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: "Bearer " + accessToken },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(MEET_API_TIMEOUT_MS),
    });
  } catch {
    throw new Error("Google Meet API is temporarily unavailable.");
  }

  if (!response.ok) {
    throw new Error("Google Meet API request failed (" + response.status + ").");
  }

  try {
    return (await response.json()) as JsonRecord;
  } catch {
    throw new Error("Google Meet API returned an invalid response.");
  }
}

export type CreatedMeetSpace = {
  name?: string;
  meetingUri?: string;
  meetingCode?: string;
};

export async function createMeetSpace(
  accessToken: string,
): Promise<CreatedMeetSpace> {
  if (!accessToken || accessToken.length > 8192) {
    throw new Error("Google Meet access token is invalid.");
  }

  let response: Response;
  try {
    response = await fetch(MEET_API + "/spaces", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(MEET_API_TIMEOUT_MS),
    });
  } catch {
    throw new Error("Google Meet API is temporarily unavailable.");
  }

  if (!response.ok) {
    throw new Error("Google Meet space creation failed (" + response.status + ").");
  }

  try {
    return (await response.json()) as CreatedMeetSpace;
  } catch {
    throw new Error("Google Meet API returned an invalid response.");
  }
}

export type MeetConference = {
  name: string;
  space?: { name?: string; meetingCode?: string };
  startTime?: string;
  endTime?: string;
};

export type MeetParticipant = {
  name: string;
  signedinUser?: { user?: string; displayName?: string };
  anonymousUser?: { displayName?: string };
  phoneUser?: { displayName?: string };
  earliestStartTime?: string;
  latestEndTime?: string;
};

export type MeetParticipantSession = {
  name: string;
  startTime?: string;
  endTime?: string;
};

export async function getMeetSpace(accessToken: string, spaceName: string) {
  return getJson("/" + spaceName.replace(/^\//, ""), accessToken);
}

export async function listConferences(
  accessToken: string,
  spaceName: string,
  startTime?: string,
  endTime?: string,
): Promise<MeetConference[]> {
  const filters = ['space.name = "' + spaceName.replace(/"/g, '\\\"') + '"'];
  if (startTime) filters.push('start_time>="' + startTime + '"');
  if (endTime) filters.push('start_time<="' + endTime + '"');

  let pageToken = "";
  const conferences: MeetConference[] = [];

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      filter: filters.join(" AND "),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await getJson("/conferenceRecords", accessToken, params);
    conferences.push(...((data.conferenceRecords as MeetConference[] | undefined) ?? []));
    pageToken = typeof data.nextPageToken === "string" ? data.nextPageToken : "";
  } while (pageToken);

  return conferences;
}

export async function listParticipants(
  accessToken: string,
  conferenceName: string,
): Promise<MeetParticipant[]> {
  let pageToken = "";
  const participants: MeetParticipant[] = [];

  do {
    const params = new URLSearchParams({ pageSize: "250" });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await getJson("/" + conferenceName + "/participants", accessToken, params);
    participants.push(...((data.participants as MeetParticipant[] | undefined) ?? []));
    pageToken = typeof data.nextPageToken === "string" ? data.nextPageToken : "";
  } while (pageToken);

  return participants;
}

export async function listParticipantSessions(
  accessToken: string,
  participantName: string,
): Promise<MeetParticipantSession[]> {
  let pageToken = "";
  const sessions: MeetParticipantSession[] = [];

  do {
    const params = new URLSearchParams({ pageSize: "250" });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await getJson(
      "/" + participantName + "/participantSessions",
      accessToken,
      params,
    );

    sessions.push(
      ...((data.participantSessions as MeetParticipantSession[] | undefined) ?? []),
    );
    pageToken = typeof data.nextPageToken === "string" ? data.nextPageToken : "";
  } while (pageToken);

  return sessions;
}

export function sessionDurationSeconds(session: MeetParticipantSession): number {
  if (!session.startTime || !session.endTime) return 0;
  const start = Date.parse(session.startTime);
  const end = Date.parse(session.endTime);
  return Number.isFinite(start) && Number.isFinite(end) && end > start
    ? Math.floor((end - start) / 1000)
    : 0;
}
