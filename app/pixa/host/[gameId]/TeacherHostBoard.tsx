"use client";

import { useEffect, useState } from "react";
import { he } from "@/lib/i18n/he";
import { createClient } from "@/lib/supabase/client";
import { SubmissionsGallery } from "./SubmissionsGallery";
import { Leaderboard } from "./Leaderboard";
import { TeacherReviewModal } from "./TeacherReviewModal";
import type { GameState } from "./types";

export function TeacherHostBoard({
  gameId,
  teacherUserId,
  initialState,
}: {
  gameId: string;
  teacherUserId: string | null;
  initialState: GameState;
}) {
  const [state, setState] = useState<GameState>(initialState);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(`/api/pixa/games/${gameId}/state`);
        const body = await response.json();
        if (!cancelled && response.ok && body.ok) {
          setState(body.data as GameState);
        }
      } catch {
        // polling fallback stays silent; realtime channel covers the common case
      }
    }

    const interval = setInterval(refresh, 3000);

    const supabase = createClient();
    const channel = supabase
      .channel(`host-game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions", filter: `game_id=eq.${gameId}` },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const { game, images, players, submissions } = state;
  const currentImage = images.find((gameImage) => gameImage.image_id === game.current_image_id);
  const isResults = game.progress_option_progress === "results" || game.progress_option_progress === "closed";
  const currentRoundSubmissions = currentImage
    ? submissions.filter((submission) => submission.target_image_id === currentImage.image_id)
    : [];

  async function onNext() {
    setAdvancing(true);
    setError("");

    try {
      const response = await fetch(`/api/pixa/games/${gameId}/next`, { method: "POST" });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "לא הצלחנו לעבור לתמונה הבאה.");

      const refreshed = await fetch(`/api/pixa/games/${gameId}/state`);
      const refreshedBody = await refreshed.json();
      if (refreshedBody.ok) setState(refreshedBody.data as GameState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "לא הצלחנו לעבור לתמונה הבאה.");
    } finally {
      setAdvancing(false);
    }
  }

  if (isResults) {
    return (
      <div className="glass-card space-y-6 border border-white/20 p-6">
        <h1 className="text-center text-2xl font-extrabold">{he.host.leaderboardTitle}</h1>
        <Leaderboard players={players} />
        {teacherUserId ? <TeacherReviewModal gameId={gameId} userId={teacherUserId} /> : null}
      </div>
    );
  }

  return (
    <div className="glass-card space-y-6 border border-white/20 p-6">
      <p className="text-sm font-bold text-white/70">
        {players.length} {he.host.participants} ·{" "}
        {he.host.roundLabel
          .replace("{current}", String(game.current_round_index + 1))
          .replace("{total}", String(images.length))}
      </p>

      {currentImage?.image ? (
        <div className="overflow-hidden rounded-xl border border-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.image.url_text}
            alt={currentImage.image.prompt_text}
            className="max-h-80 w-full object-contain bg-black/20"
          />
        </div>
      ) : null}

      <SubmissionsGallery submissions={currentRoundSubmissions} />

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onNext}
          disabled={advancing}
          className="min-h-12 w-full max-w-xs rounded-lg bg-pixa-pink px-6 py-3 text-base font-extrabold text-white transition hover:bg-[#c9365d] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {advancing ? he.common.loading : he.create.nextImage}
        </button>
        {error ? <p className="text-sm font-bold text-red-200">{error}</p> : null}
      </div>
    </div>
  );
}
