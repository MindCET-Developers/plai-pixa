import { createClient } from "@/lib/supabase/client";
import { GAME_CHANGED_EVENT, gameChannelTopic } from "./gameChannel";

// The server broadcasts on the game's channel after every change, so polling
// only runs while that channel is down. Every /state call counts toward Vercel
// CDN requests and Fast Origin Transfer, so it stays a slow safety net.
export const FALLBACK_POLL_MS = 15000;
const REALTIME_DEBOUNCE_MS = 600;
// /submit may still be running when the teacher advances to results (60s max).
// Leave time for those scores, then take one final snapshot before stopping.
export const RESULTS_SETTLE_MS = 120000;
type GameProgress = "setup" | "waiting" | "active" | "between_rounds" | "results" | "closed";

// Calls refresh whenever the game changes: on each server broadcast, when the
// channel (re)connects, after the tab was hidden long enough to miss updates,
// and every FALLBACK_POLL_MS while the channel is not connected.
export function subscribeToGameUpdates(
  gameId: string,
  refresh: () => Promise<GameProgress | void>,
) {
  let connected = false;
  let hiddenAt: number | null = null;
  let stopped = false;
  let pending = false;
  let running: Promise<void> | null = null;
  let resultsTimer: ReturnType<typeof setTimeout> | null = null;
  let settling = false;
  let finalSnapshotDue = false;

  function requestRefresh(): Promise<void> {
    if (stopped) return Promise.resolve();
    pending = true;
    if (running) return running;
    running = (async () => {
      while (pending && !stopped) {
        pending = false;
        // A trigger during an in-flight fetch gets one trailing refresh, so
        // updates that happened after its snapshot are not lost.
        const isFinalSnapshot = finalSnapshotDue;
        const progress = await refresh();
        if (stopped) break;
        if (progress === "closed" || (progress === "results" && isFinalSnapshot)) {
          unsubscribe();
        } else if (progress === "results" && !settling) {
          settling = true;
          resultsTimer = setTimeout(() => {
            finalSnapshotDue = true;
            if (document.visibilityState === "visible") void requestRefresh();
          }, RESULTS_SETTLE_MS);
        } else if (progress && progress !== "results") {
          if (resultsTimer) clearTimeout(resultsTimer);
          resultsTimer = null;
          settling = false;
          finalSnapshotDue = false;
        }
      }
    })().finally(() => { running = null; });
    return running;
  }

  const onChange = debounceRefresh(() => { void requestRefresh(); });

  const interval = setInterval(() => {
    if ((!connected || finalSnapshotDue) && document.visibilityState === "visible") {
      void requestRefresh();
    }
  }, FALLBACK_POLL_MS);

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
      return;
    }
    // Mobile browsers can drop the socket in the background without the
    // channel reporting it straight away.
    if (finalSnapshotDue || (hiddenAt !== null && Date.now() - hiddenAt >= FALLBACK_POLL_MS)) {
      void requestRefresh();
    }
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
      if (connected && !wasConnected) void requestRefresh();
    });

  function unsubscribe() {
    if (stopped) return;
    stopped = true;
    pending = false;
    clearInterval(interval);
    if (resultsTimer) clearTimeout(resultsTimer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    onChange.cancel();
    void supabase.removeChannel(channel);
  }

  // Keep the callable cleanup API; explicit refreshes (including initial
  // loads and teacher actions) must use the same queue as realtime/polling.
  return Object.assign(unsubscribe, { refresh: requestRefresh });
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
