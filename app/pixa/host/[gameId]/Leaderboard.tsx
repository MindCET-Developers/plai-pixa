import { he } from "@/lib/i18n/he";
import type { PlayerRow } from "./types";

export function Leaderboard({ players }: { players: PlayerRow[] }) {
  const sorted = [...players].sort(
    (a, b) => (b.user?.final_score_number ?? 0) - (a.user?.final_score_number ?? 0),
  );

  return (
    <ol className="space-y-2">
      {sorted.map((player, index) => (
        <li
          key={player.id}
          className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-3"
        >
          <span className="ltr-field w-8 text-center text-lg font-extrabold text-pixa-pink">{index + 1}</span>
          {player.user?.avatar_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.user.avatar_image} alt="" className="h-9 w-9 rounded-full bg-white" />
          ) : null}
          <span className="flex-1 truncate font-extrabold">{player.user?.name_text ?? "תלמיד/ה"}</span>
          <span className="ltr-field text-lg font-extrabold">
            {player.user?.final_score_number ?? 0} {he.common.points}
          </span>
        </li>
      ))}
    </ol>
  );
}
