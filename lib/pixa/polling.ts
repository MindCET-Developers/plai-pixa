import { createClient } from "@/lib/supabase/client";
import { GAME_CHANGED_EVENT, gameChannelTopic } from "./gameChannel";

// The server broadcasts on the game's channel after every change, so polling
// only runs while that channel is down. Every /state call counts toward Vercel
// CDN requests and Fast Origin Transfer, so it stays a slow safety net.
export const FALLBACK_POLL_MS = 15000;
const REALTIME_DEBOUNCE_MS = 600;

// Calls refresh whenever the game changes: on each server broadcast, when the
// channel (re)connects, after the tab was hidden long enough to miss updates,
// and every FALLBACK_POLL_MS while the channel is not connected.
export function subscribeToGameUpdates(gameId: string, refresh: () => void) {
  let connected = false;
  let hiddenAt: number | null = null;
  const onChange = debounceRefresh(refresh);

  const interval = setInterval(() => {
    if (!connected && document.visibilityState === "visible") refresh();
  }, FALLBACK_POLL_MS);

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
      return;
    }
    // Mobile browsers can drop the socket in the background without the
    // channel reporting it straight away.
    if (hiddenAt !== null && Date.now() - hiddenAt >= FALLBACK_POLL_MS) refresh();
    hiddenAt = null;
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  const supabase = createClient();
  const channel = supabase
    .channel(gameChannelTopic(gameId))
    .on("broadcast", { event: GAME_CHANGED_EVENT }, onChange)
    .subscribe((status) => {
      const wasConnected = connected;
      connected = status === "SUBSCRIBED";
      // Broadcasts sent while the channel was down are lost, so catch up once.
      if (connected && !wasConnected) refresh();
    });

  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    onChange.cancel();
    supabase.removeChannel(channel);
  };
}

// Collapses bursts of broadcasts (e.g. many students submitting at once) into
// a single refetch.
function debounceRefresh(refresh: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(refresh, REALTIME_DEBOUNCE_MS);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return debounced;
}
