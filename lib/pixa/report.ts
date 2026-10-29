import { createAdminClient } from "../supabase/admin";
import { createClient as createServerSupabaseClient } from "../supabase/server";

// Production launch of the new app on plai.mindcet.io; totals and breakdowns count from here.
export const REPORT_LAUNCH_DAY = "2026-09-10";

// Google accounts on these domains may open /report. Overridable with a comma-separated env var.
function allowedDomains() {
  return (process.env.REPORT_ALLOWED_EMAIL_DOMAINS || "mindcet.io")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export type ReportAccess =
  | { status: "signed_out" }
  | { status: "forbidden"; email: string }
  | { status: "ok"; email: string };

export async function getReportAccess(): Promise<ReportAccess> {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user?.email) return { status: "signed_out" };

  // The address must come from Google, which verifies it, not from another sign-up method.
  const providers: unknown = user.app_metadata?.providers ?? [user.app_metadata?.provider];
  const signedInWithGoogle = Array.isArray(providers) && providers.includes("google");
  const domain = user.email.split("@").pop()?.toLowerCase() ?? "";

  if (!signedInWithGoogle || !user.email_confirmed_at || !allowedDomains().includes(domain)) {
    return { status: "forbidden", email: user.email };
  }
  return { status: "ok", email: user.email };
}

export type UsageReport = {
  summary: {
    games: number;
    started: number;
    teachers: number;
    players: number;
    submissions: number;
    second_tries: number;
    avg_score: number | null;
    reviews: number;
    avg_stars: number | null;
    median_players: number | null;
    max_players: number | null;
    teachers_one_game: number;
    teachers_two_three: number;
    teachers_four_plus: number;
    teachers_returning: number;
    top_teacher_games: number | null;
  };
  daily: { day: string; players: number; games: number; submissions: number }[];
  weekly: { week_start: string; games: number; started: number; teachers: number; players: number; submissions: number }[];
  hours: { hour: number; players: number }[];
  weekdays: { dow: number; players: number }[];
  devices: Record<string, number>;
  game_sizes: { bucket: string; games: number }[];
  scores: { upper: number; submissions: number }[];
  stars: { stars: number; students: number; teachers: number }[];
  levels: Record<string, number>;
  failures: number;
  costs: {
    tracked_since: string | null;
    total: number;
    openrouter: number;
    runware: number;
    student_cost: number;
    student_attempts: number;
  };
};

export async function getUsageReport() {
  const access = await getReportAccess();
  if (access.status !== "ok") throw new Error("Report access is required.");

  const { data, error } = await createAdminClient().rpc("usage_report", { launch_day: REPORT_LAUNCH_DAY });
  if (error) throw error;
  return data;
}
