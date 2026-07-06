"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { he } from "@/lib/i18n/he";
import { createClient } from "@/lib/supabase/client";
import type { CreatedGame } from "./types";

type Player = {
  id: string;
  user: { name_text: string | null; avatar_image: string | null } | null;
};

export function GameLobby({ game, code, joinUrl }: { game: CreatedGame; code: number; joinUrl: string }) {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 220, color: { dark: "#091747", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [joinUrl]);

  useEffect(() => {
    async function refresh() {
      try {
        const response = await fetch(`/api/pixa/games/${game.id}/state`);
        const body = await response.json();
        if (response.ok && body.ok) {
          setPlayers(body.data.players as Player[]);
        }
      } catch {
        // polling fallback stays silent; realtime channel covers the common case
      }
    }

    refresh();
    pollRef.current = setInterval(refresh, 3000);

    const supabase = createClient();
    const channel = supabase
      .channel(`game-players-${game.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${game.id}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      supabase.removeChannel(channel);
    };
  }, [game.id]);

  async function onStart() {
    setStarting(true);
    setError("");

    try {
      const response = await fetch(`/api/pixa/games/${game.id}/start`, { method: "POST" });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "לא הצלחנו להתחיל את המשחק.");
      }

      router.push(`/pixa/host/${game.id}`);
    } catch (err) {
      setStarting(false);
      setError(err instanceof Error ? err.message : "לא הצלחנו להתחיל את המשחק.");
    }
  }

  return (
    <div className="glass-card grid w-full max-w-4xl gap-8 border border-white/20 p-8 text-white md:grid-cols-2">
      <div>
        <p className="text-sm font-bold text-white/70">PIXA</p>
        <h1 className="mt-2 text-2xl font-extrabold">{he.create.scanQr}</h1>

        <div className="ltr-field mt-5 flex items-center justify-center rounded-xl bg-white p-3">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code" width={220} height={220} />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center text-sm text-pixa-ink">
              {he.common.loading}
            </div>
          )}
        </div>

        <p className="ltr-field mt-5 text-center text-5xl font-extrabold tracking-[0.2em]">{code}</p>
        <p className="mt-2 truncate text-center text-sm text-white/70">{joinUrl}</p>
      </div>

      <div className="flex flex-col">
        <h2 className="text-lg font-extrabold">{he.create.joinedPlayers}</h2>
        <ul className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {players.length === 0 ? (
            <li className="text-sm text-white/60">עדיין אין מצטרפים.</li>
          ) : (
            players.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-3 py-2"
              >
                {player.user?.avatar_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={player.user.avatar_image} alt="" className="h-8 w-8 rounded-full bg-white" />
                ) : null}
                <span className="font-bold">{player.user?.name_text ?? "תלמיד/ה"}</span>
              </li>
            ))
          )}
        </ul>

        <button
          type="button"
          onClick={onStart}
          disabled={starting || players.length === 0}
          className="mt-6 min-h-12 w-full rounded-lg bg-pixa-pink px-6 py-3 text-base font-extrabold text-white transition hover:bg-[#c9365d] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {starting ? "מתחילים..." : he.create.startGame}
        </button>
        {players.length === 0 ? (
          <p className="mt-2 text-xs text-white/60">אפשר להתחיל ברגע שתלמיד/ה ראשונ/ה מצטרפ/ת.</p>
        ) : null}
        {error ? <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p> : null}
      </div>
    </div>
  );
}
