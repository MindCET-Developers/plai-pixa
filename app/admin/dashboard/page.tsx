import Link from "next/link";
import { getAdminDashboard, getAdminPageAccess } from "@/lib/pixa/api";
import { he } from "@/lib/i18n/he";
import { AdminAccessGate } from "../AdminAccessGate";
import { AdminNav } from "../AdminNav";

export default async function AdminDashboardPage() {
  const access = await getAdminPageAccess();
  if (access.status !== "ok") return <AdminAccessGate access={access} />;

  const stats = await getAdminDashboard();

  return (
    <main className="min-h-screen bg-[url('/backgrounds/bg-admin.png')] bg-cover bg-center px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 text-white">
          <Link href="/" className="text-2xl font-extrabold">
            PIXA
          </Link>
          <AdminNav active="dashboard" />
        </header>

        <div className="glass-card border border-white/20 p-6 text-white sm:p-8">
          <h1 className="text-2xl font-extrabold">{he.admin.dashboardTitle}</h1>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={he.admin.statGames} value={stats.gamesCount} />
            <Stat label={he.admin.statSubmissions} value={stats.submissionsCount} />
            <Stat label={he.admin.statPlayers} value={stats.playersCount} />
            <Stat
              label={he.admin.statAvgStars}
              value={stats.avgStars !== null ? stats.avgStars.toFixed(1) : "—"}
            />
          </div>

          <h2 className="mt-8 text-lg font-extrabold">{he.admin.recentGamesTitle}</h2>
          {stats.recentGames.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">אין עדיין נתוני משחקים.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-right text-xs text-white/60">
                    <th className="border-b border-white/10 px-3 py-2">קוד</th>
                    <th className="border-b border-white/10 px-3 py-2">שחקנים</th>
                    <th className="border-b border-white/10 px-3 py-2">הגשות</th>
                    <th className="border-b border-white/10 px-3 py-2">משך (שניות)</th>
                    <th className="border-b border-white/10 px-3 py-2">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentGames.map((game) => (
                    <tr key={game.id}>
                      <td className="ltr-field border-b border-white/5 px-3 py-2">{game.id_number ?? "—"}</td>
                      <td className="border-b border-white/5 px-3 py-2">{game.players_count_number}</td>
                      <td className="border-b border-white/5 px-3 py-2">{game.submissions_count_number}</td>
                      <td className="ltr-field border-b border-white/5 px-3 py-2">
                        {game.duration_seconds ?? "—"}
                      </td>
                      <td className="border-b border-white/5 px-3 py-2">{game.progress_option_progress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center">
      <p className="ltr-field text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-bold text-white/70">{label}</p>
    </div>
  );
}
