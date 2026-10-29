// Vercel usage for this project over the last 30 days, from the team usage API.
// Needs VERCEL_USAGE_TOKEN: a Vercel access token with read access to the team.
// The API reports team-wide daily totals plus each project's rounded percentage,
// so this project's figures are approximate.

const TEAM_ID = process.env.VERCEL_USAGE_TEAM_ID || "team_nOTzKhJPjO7wwDwoEV3MSm4Q";
const PROJECT_ID = process.env.VERCEL_USAGE_PROJECT_ID || "prj_3qLwmzbo3hSAIPIg7noGj4qhMUex";
const DAYS = 30;

type Share = { id?: string; percent?: number };
type UsageDay = {
  date: string;
  request_hit_count?: number;
  request_miss_count?: number;
  bandwidth_outgoing_bytes?: number;
  function_invocation_successful_count?: number;
  function_invocation_error_count?: number;
  function_invocation_throttle_count?: number;
  function_invocation_timeout_count?: number;
  function_execution_successful_gb_hours?: number;
  function_execution_error_gb_hours?: number;
  function_execution_timeout_gb_hours?: number;
  breakdown?: Record<string, Share[] | undefined>;
};

export type VercelUsageTotals = { requests: number; bandwidthBytes: number; invocations: number; gbHours: number };
export type VercelUsage =
  | { status: "not_configured" }
  | { status: "error" }
  | { status: "ok"; days: ({ day: string } & VercelUsageTotals)[]; project: VercelUsageTotals; team: VercelUsageTotals };

function teamTotals(day: UsageDay): VercelUsageTotals {
  return {
    requests: (day.request_hit_count ?? 0) + (day.request_miss_count ?? 0),
    bandwidthBytes: day.bandwidth_outgoing_bytes ?? 0,
    invocations:
      (day.function_invocation_successful_count ?? 0) +
      (day.function_invocation_error_count ?? 0) +
      (day.function_invocation_throttle_count ?? 0) +
      (day.function_invocation_timeout_count ?? 0),
    gbHours:
      (day.function_execution_successful_gb_hours ?? 0) +
      (day.function_execution_error_gb_hours ?? 0) +
      (day.function_execution_timeout_gb_hours ?? 0),
  };
}

function projectShare(day: UsageDay, metric: string) {
  const entry = day.breakdown?.[metric]?.find((share) => share.id === PROJECT_ID);
  return (entry?.percent ?? 0) / 100;
}

function sum(rows: VercelUsageTotals[]): VercelUsageTotals {
  return rows.reduce(
    (total, row) => ({
      requests: total.requests + row.requests,
      bandwidthBytes: total.bandwidthBytes + row.bandwidthBytes,
      invocations: total.invocations + row.invocations,
      gbHours: total.gbHours + row.gbHours,
    }),
    { requests: 0, bandwidthBytes: 0, invocations: 0, gbHours: 0 },
  );
}

export async function getVercelUsage(): Promise<VercelUsage> {
  const token = process.env.VERCEL_USAGE_TOKEN;
  if (!token) return { status: "not_configured" };

  const to = new Date();
  const from = new Date(to.getTime() - DAYS * 24 * 60 * 60 * 1000);
  const url = new URL("https://api.vercel.com/v2/usage");
  url.search = new URLSearchParams({ teamId: TEAM_ID, type: "requests", from: from.toISOString(), to: to.toISOString() }).toString();

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // Vercel updates usage a few times an hour; one fetch an hour is plenty.
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`Vercel usage request failed: ${response.status}`);
      return { status: "error" };
    }
    const json = (await response.json()) as { data?: UsageDay[] };
    const data = json.data ?? [];

    const days = data.map((day) => {
      const team = teamTotals(day);
      return {
        day: day.date.slice(0, 10),
        requests: Math.round(team.requests * projectShare(day, "requests")),
        bandwidthBytes: Math.round(team.bandwidthBytes * projectShare(day, "bandwidth")),
        invocations: Math.round(team.invocations * projectShare(day, "function_invocations")),
        gbHours: team.gbHours * projectShare(day, "function_execution"),
      };
    });

    return { status: "ok", days, project: sum(days), team: sum(data.map(teamTotals)) };
  } catch (error) {
    console.error("Vercel usage request failed", error);
    return { status: "error" };
  }
}
