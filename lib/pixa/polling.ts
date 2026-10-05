// Realtime (Supabase postgres_changes) is the primary update channel.
// Polling is only a slow safety net, and pauses while the tab is hidden,
// because every /state call counts toward Vercel Fast Origin Transfer.
export const FALLBACK_POLL_MS = 15000;
const REALTIME_DEBOUNCE_MS = 600;

export function startFallbackPolling(refresh: () => void) {
  const interval = setInterval(() => {
    if (document.visibilityState === "visible") refresh();
  }, FALLBACK_POLL_MS);

  return () => clearInterval(interval);
}

// Collapses bursts of realtime events (e.g. many students submitting at once)
// into a single refetch.
export function debounceRefresh(refresh: () => void) {
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
