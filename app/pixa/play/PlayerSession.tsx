"use client";

import { useEffect, useRef, useState } from "react";
import { he } from "@/lib/i18n/he";
import { createClient } from "@/lib/supabase/client";
import { StudentWaitingScreen } from "./StudentWaitingScreen";
import { StudentPromptAttemptForm } from "./StudentPromptAttemptForm";
import { StudentResultCard } from "./StudentResultCard";
import { StudentReviewModal } from "./StudentReviewModal";
import type { GameState, StoredPlayer, SubmissionRow } from "./types";

export function PlayerSession({ player, onExit }: { player: StoredPlayer; onExit: () => void }) {
  const [state, setState] = useState<GameState | null>(null);
  const [localSubmission, setLocalSubmission] = useState<SubmissionRow | null>(null);
  const roundRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(`/api/pixa/games/${player.gameId}/state`);
        const body = await response.json();
        if (!cancelled && response.ok && body.ok) {
          setState(body.data as GameState);
        }
      } catch {
        // polling fallback stays silent; realtime channel covers the common case
      }
    }

    refresh();
    const interval = setInterval(refresh, 3000);

    const supabase = createClient();
    const channel = supabase
      .channel(`player-game-${player.gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${player.gameId}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [player.gameId]);

  const game = state?.game;
  const currentImageId = game?.current_image_id ?? null;

  useEffect(() => {
    if (roundRef.current !== currentImageId) {
      roundRef.current = currentImageId;
      setLocalSubmission(null);
    }
  }, [currentImageId]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <header className="flex w-full items-center justify-between text-white">
        <span className="text-xl font-extrabold">PIXA</span>
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg border border-white/35 px-3 py-1.5 text-xs font-bold"
        >
          {he.play.exitGame}
        </button>
      </header>

      {renderBody()}
    </div>
  );

  function renderBody() {
    if (!game) {
      return <p className="text-white/70">{he.common.loading}</p>;
    }

    if (game.progress_option_progress === "results" || game.progress_option_progress === "closed") {
      const me = state?.players.find((p) => p.user_id === player.userId);
      const finalScore = me?.user?.final_score_number ?? me?.user?.current_score_number ?? 0;

      return (
        <div className="glass-card w-full space-y-5 border border-white/20 p-6 text-white">
          <div className="text-center">
            <p className="text-sm font-bold text-white/70">PIXA</p>
            <p className="ltr-field mt-3 text-4xl font-extrabold">
              {he.play.myScore.replace("{score}", String(finalScore))}
            </p>
          </div>
          <StudentReviewModal gameId={player.gameId} userId={player.userId} />
        </div>
      );
    }

    if (game.progress_option_progress !== "active" || !currentImageId) {
      return <StudentWaitingScreen name={player.name} />;
    }

    const serverSubmission = state?.submissions.find(
      (submission) => submission.user_id === player.userId && submission.target_image_id === currentImageId,
    );
    const submission = localSubmission ?? serverSubmission ?? null;

    if (!submission) {
      return (
        <StudentPromptAttemptForm
          gameId={player.gameId}
          userId={player.userId}
          mode="create"
          onSubmitted={setLocalSubmission}
        />
      );
    }

    if (submission.try_number < 2) {
      return (
        <div className="w-full space-y-4">
          <StudentResultCard submission={submission} final={false} />
          <StudentPromptAttemptForm
            gameId={player.gameId}
            userId={player.userId}
            mode="improve"
            initialPrompt={submission.sent_prompt_text}
            onSubmitted={setLocalSubmission}
          />
        </div>
      );
    }

    return <StudentResultCard submission={submission} final />;
  }
}
