// Shared by the server (which broadcasts) and the game screens (which listen).
// postgres_changes can't reach these screens: students have no Supabase
// session and game_players/submissions are service-role only under RLS, so the
// server announces changes itself on a public broadcast channel instead. The
// message carries no game data, only "refetch /state".
export const GAME_CHANGED_EVENT = "changed";

export function gameChannelTopic(gameId: string) {
  return `pixa-game:${gameId}`;
}
