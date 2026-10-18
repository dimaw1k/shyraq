import { supabase } from "@/lib/supabase";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()?.replace(/\/$/, "");

if (!apiBaseUrl) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL is missing. Copy mobile/.env.example to mobile/.env.");
}

export type StudentOverview = {
  profile: {
    id: string;
    full_name: string | null;
    role: string;
    status: string;
  };
  team: { id: string; name: string; mentor_id: string | null } | null;
  score: number;
  scoreBreakdown: Record<string, number>;
  streak: number;
  longestStreak: number;
  reports: Array<{ report_date: string; status: string }>;
  videoProgress: Array<{
    lesson_id: string;
    watched_percent: number;
    test_unlocked: boolean;
  }>;
};

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Сессия аяқталды. Қайта кіріңіз.");
  }
  return data.session.access_token;
}

async function requestJson<T>(path: string, retried = false): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 && !retried) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.access_token) {
      return requestJson<T>(path, true);
    }
    await supabase.auth.signOut();
    throw new Error("Сессия аяқталды. Қайта кіріңіз.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Серверден дерек алу мүмкін болмады.";
    throw new Error(message);
  }

  return body as T;
}

export function getStudentOverview() {
  return requestJson<StudentOverview>("/api/student/overview");
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}
