"use client";

import { useEffect, useRef, useState } from "react";
import { he } from "@/lib/i18n/he";
import { subscribeToGameUpdates } from "@/lib/pixa/polling";
import { StudentWaitingScreen } from "./StudentWaitingScreen";
import { StudentPromptAttemptForm } from "./StudentPromptAttemptForm";
import { StudentResultCard } from "./StudentResultCard";
import { StudentReviewModal } from "./StudentReviewModal";
import type { GameState, StoredPlayer, SubmissionRow } from "./types";

export function PlayerSession({ player, onExit }: { player: StoredPlayer; onExit: () => void }) {
  const [state, setState] = useState<GameState | null>(null);
  const [localSubmission, setLocalSubmission] = useState<SubmissionRow | null>(null);
  const [keptFirst, setKeptFirst] = useState(false);
  const roundRef = useRef<string | null>(null);

  function keepKeyFor(imageId: string) {
    return `pixa-keep:${player.gameId}:${imageId}`;
  }

  function setKept(value: boolean) {
    setKeptFirst(value);
    if (!currentImageId) return;
    try {
      if (value) window.localStorage.setItem(keepKeyFor(currentImageId), "1");
      else window.localStorage.removeItem(keepKeyFor(currentImageId));
    } catch {
      // storage can be blocked; the choice then lasts only until the page reloads
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(
          `/api/pixa/games/${player.gameId}/state?userId=${encodeURIComponent(player.userId)}`,
        );
        const body = await response.json();
        if (!cancelled && response.ok && body.ok) {
          setState(body.data as GameState);
          return (body.data as GameState).game.progress_option_progress;
        }
      } catch {
        // polling fallback stays silent; realtime channel covers the common case
      }
    }

    const unsubscribe = subscribeToGameUpdates(player.gameId, refresh);
    void unsubscribe.refresh();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [player.gameId, player.userId]);

  const game = state?.game;
  const currentImageId = game?.current_image_id ?? null;

  useEffect(() => {
    if (roundRef.current !== currentImageId) {
      roundRef.current = currentImageId;
      setLocalSubmission(null);
      let kept = false;
      try {
        kept = currentImageId
          ? window.localStorage.getItem(`pixa-keep:${player.gameId}:${currentImageId}`) === "1"
          : false;
      } catch {
        kept = false;
      }
      setKeptFirst(kept);
    }
  }, [currentImageId, player.gameId]);

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

    if (submission.try_number < 2 && keptFirst) {
      return <StudentResultCard submission={submission} final onReopen={() => setKept(false)} />;
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
            onKeepFirst={() => setKept(true)}
          />
        </div>
      );
    }

    return <StudentResultCard submission={submission} final />;
  }
}
