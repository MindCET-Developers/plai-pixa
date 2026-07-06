"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PlayerSession } from "./PlayerSession";
import type { StoredPlayer } from "./types";

type JoinState = "idle" | "joining" | "error";

function getDevice() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function avatarUrl(name: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(name)}`;
}

export function JoinGameForm({ initialCode }: { initialCode?: string }) {
  const [player, setPlayer] = useState<StoredPlayer | null | undefined>(undefined);
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [state, setState] = useState<JoinState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    function restore() {
      const stored = window.localStorage.getItem("pixa-player");
      if (stored) {
        try {
          setPlayer(JSON.parse(stored) as StoredPlayer);
          return;
        } catch {
          window.localStorage.removeItem("pixa-player");
        }
      }
      setPlayer(null);
    }

    restore();
  }, []);

  const canSubmit = useMemo(() => /^\d{5}$/.test(code) && name.trim().length > 0, [code, name]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setState("joining");
    setMessage("");

    try {
      const response = await fetch("/api/pixa/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          avatar: avatarUrl(name),
          device: getDevice(),
        }),
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "לא הצלחנו להצטרף למשחק.");
      }

      const stored: StoredPlayer = {
        gameId: body.data.game.id,
        code: body.data.game.id_number,
        userId: body.data.user.id,
        name: body.data.user.name_text,
      };
      window.localStorage.setItem("pixa-player", JSON.stringify(stored));
      setState("idle");
      setPlayer(stored);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "לא הצלחנו להצטרף למשחק.");
    }
  }

  function onExit() {
    window.localStorage.removeItem("pixa-player");
    setState("idle");
    setMessage("");
    setPlayer(null);
  }

  if (player === undefined) {
    return null;
  }

  if (player) {
    return <PlayerSession player={player} onExit={onExit} />;
  }

  return (
    <form onSubmit={onSubmit} className="glass-card w-full max-w-md border border-white/20 p-5 text-white sm:p-6">
      <p className="text-sm font-bold text-white/70">PIXA</p>
      <h1 className="mt-2 text-3xl font-extrabold">כניסת תלמידים</h1>

      <label className="mt-6 block text-sm font-bold text-white/82">
        קוד משחק
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="12345"
          className="ltr-field mt-2 min-h-14 w-full rounded-lg border border-white/30 bg-white px-4 text-center text-3xl font-extrabold tracking-[0.2em] text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
        />
      </label>

      <div className="mt-4 flex items-end gap-3">
        <label className="block flex-1 text-sm font-bold text-white/82">
          שם
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className="mt-2 min-h-12 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
          />
        </label>
        {name.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl(name)}
            alt="אווטאר"
            className="h-12 w-12 shrink-0 rounded-full border border-white/30 bg-white"
          />
        ) : null}
      </div>

      <button
        type="submit"
        disabled={!canSubmit || state === "joining"}
        className="mt-5 min-h-12 w-full rounded-lg bg-pixa-pink px-5 py-3 text-base font-extrabold text-white transition hover:bg-[#c9365d] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {state === "joining" ? "מצטרפים..." : "להצטרף למשחק"}
      </button>

      {message ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{message}</p> : null}
    </form>
  );
}
