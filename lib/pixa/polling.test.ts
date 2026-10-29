import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const realtime = vi.hoisted(() => ({
  change: () => {},
  status: (() => {}) as (status: string) => void,
  removeChannel: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => {
      const channel = {
        on: (_type: string, _filter: unknown, callback: () => void) => {
          realtime.change = callback;
          return channel;
        },
        subscribe: (callback: (status: string) => void) => {
          realtime.status = callback;
          return channel;
        },
      };
      return channel;
    },
    removeChannel: realtime.removeChannel,
  }),
}));

import { FALLBACK_POLL_MS, RESULTS_SETTLE_MS, subscribeToGameUpdates } from "./polling";

let visibility: string;
let events: EventTarget;
const subscriptions: ReturnType<typeof subscribeToGameUpdates>[] = [];
function subscribe(refresh: Parameters<typeof subscribeToGameUpdates>[1]) {
  const subscription = subscribeToGameUpdates("game", refresh);
  subscriptions.push(subscription);
  return subscription;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  visibility = "visible";
  events = new EventTarget();
  vi.stubGlobal("document", {
    get visibilityState() { return visibility; },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  });
});

afterEach(() => {
  subscriptions.splice(0).forEach(stop => stop());
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("game updates", () => {
  it("serializes initial, reconnect, broadcast and explicit refreshes without losing an update", async () => {
    let finish!: () => void;
    let active = 0;
    let maxActive = 0;
    const refresh = vi.fn(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      if (refresh.mock.calls.length === 1) await new Promise<void>(resolve => { finish = resolve; });
      active--;
      return "active" as const;
    });
    const subscription = subscribe(refresh);
    const first = subscription.refresh();
    realtime.status("SUBSCRIBED");
    realtime.change();
    await vi.advanceTimersByTimeAsync(600);
    const explicit = subscription.refresh();
    expect(refresh).toHaveBeenCalledTimes(1);
    finish();
    await Promise.all([first, explicit]);
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(maxActive).toBe(1);
  });

  it("polls only while disconnected and visible", async () => {
    const refresh = vi.fn(async () => "active" as const);
    subscribe(refresh);
    await vi.advanceTimersByTimeAsync(FALLBACK_POLL_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
    visibility = "hidden";
    await vi.advanceTimersByTimeAsync(FALLBACK_POLL_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
    visibility = "visible";
    realtime.status("SUBSCRIBED");
    await vi.advanceTimersByTimeAsync(FALLBACK_POLL_MS * 2);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("keeps late scores during results, takes a final snapshot and stops all triggers", async () => {
    const refresh = vi.fn(async () => "results" as const);
    const subscription = subscribe(refresh);
    realtime.status("SUBSCRIBED");
    await subscription.refresh();
    refresh.mockClear();
    realtime.change();
    await vi.advanceTimersByTimeAsync(600);
    expect(refresh).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(RESULTS_SETTLE_MS - 600);
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(realtime.removeChannel).toHaveBeenCalledTimes(1);
    realtime.change();
    realtime.status("CHANNEL_ERROR");
    await subscription.refresh();
    await vi.advanceTimersByTimeAsync(RESULTS_SETTLE_MS);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("defers the final results snapshot until a hidden tab is visible", async () => {
    const refresh = vi.fn(async () => "results" as const);
    const subscription = subscribe(refresh);
    await subscription.refresh();
    visibility = "hidden";
    events.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(RESULTS_SETTLE_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
    visibility = "visible";
    events.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(realtime.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("retries a failed final snapshot rather than freezing old results", async () => {
    const refresh = vi.fn<Parameters<typeof subscribeToGameUpdates>[1]>().mockResolvedValue("results");
    const subscription = subscribe(refresh);
    realtime.status("SUBSCRIBED");
    await subscription.refresh();
    refresh.mockResolvedValueOnce(undefined);
    await vi.advanceTimersByTimeAsync(RESULTS_SETTLE_MS);
    expect(realtime.removeChannel).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(FALLBACK_POLL_MS);
    expect(realtime.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("does not stop a game that resumes during the results grace period", async () => {
    const refresh = vi.fn<Parameters<typeof subscribeToGameUpdates>[1]>().mockResolvedValue("results");
    const subscription = subscribe(refresh);
    await subscription.refresh();
    refresh.mockResolvedValue("active");
    await subscription.refresh();
    await vi.advanceTimersByTimeAsync(RESULTS_SETTLE_MS * 2);
    expect(realtime.removeChannel).not.toHaveBeenCalled();
  });

  it("stops immediately for a closed game", async () => {
    const refresh = vi.fn(async () => "closed" as const);
    const subscription = subscribe(refresh);
    await subscription.refresh();
    await vi.advanceTimersByTimeAsync(RESULTS_SETTLE_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(realtime.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("cleans pending broadcasts, trailing work and listeners on unmount", async () => {
    let finish!: () => void;
    const refresh = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const subscription = subscribe(refresh);
    const inFlight = subscription.refresh();
    void subscription.refresh();
    realtime.change();
    subscription();
    finish();
    await inFlight;
    events.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(RESULTS_SETTLE_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(realtime.removeChannel).toHaveBeenCalledTimes(1);
  });
});
