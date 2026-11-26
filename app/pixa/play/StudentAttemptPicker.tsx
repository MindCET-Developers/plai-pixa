"use client";

import { useState } from "react";
import { he } from "@/lib/i18n/he";
import { effectiveSelectedTry } from "@/lib/pixa/gameLogic";
import type { AttemptRow, SubmissionRow } from "./types";

/**
 * Shown once a student has used both attempts: they see both images side by side
 * and pick the one that is projected on the board and counted in their score.
 */
export function StudentAttemptPicker({
  gameId,
  userId,
  submission,
  attempts,
  onChanged,
}: {
  gameId: string;
  userId: string;
  submission: SubmissionRow;
  attempts: AttemptRow[];
  onChanged: (submission: SubmissionRow) => void;
}) {
  const [pendingTry, setPendingTry] = useState<number | null>(null);
  const [error, setError] = useState("");
  const selectedTry = effectiveSelectedTry(submission);

  async function choose(tryNumber: number) {
    if (pendingTry !== null || tryNumber === selectedTry) return;
    setPendingTry(tryNumber);
    setError("");

    try {
      const response = await fetch("/api/pixa/select-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, userId, tryNumber }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.ok) {
        throw new Error(response.status === 409 ? he.play.roundLocked : he.play.chooseError);
      }

      onChanged(body.data.submission as SubmissionRow);
    } catch (err) {
      setError(err instanceof Error ? err.message : he.play.chooseError);
    } finally {
      setPendingTry(null);
    }
  }

  return (
    <div className="glass-card w-full max-w-md border border-white/20 p-5 text-white sm:p-6">
      <p className="text-base font-extrabold">{he.play.pickTitle}</p>
      <p className="mt-1 text-sm text-white/70">{he.play.pickHint}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {attempts.map((attempt) => {
          const selected = attempt.try_number === selectedTry;
          const pending = pendingTry === attempt.try_number;

          return (
            <div
              key={attempt.id}
              className={`flex flex-col rounded-xl border p-2 ${
                selected ? "border-pixa-pink bg-white/15 ring-2 ring-pixa-pink" : "border-white/20 bg-white/5"
              }`}
            >
              <p className="text-xs font-bold text-white/75">
                {he.play.attemptLabel.replace("{n}", String(attempt.try_number))}
              </p>

              {attempt.generated_image_url_text ? (
                <div className="mt-1 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attempt.generated_image_url_text}
                    alt={attempt.sent_prompt_text}
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ) : null}

              <p className="ltr-field mt-2 text-center text-xl font-extrabold">{attempt.score_text ?? "0"}</p>

              {selected ? (
                <p className="mt-2 rounded-lg bg-pixa-pink px-2 py-2 text-center text-xs font-extrabold">
                  {he.play.selectedBadge}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void choose(attempt.try_number)}
                  disabled={pendingTry !== null}
                  className="mt-2 min-h-12 rounded-lg border border-white/40 px-2 py-2 text-xs font-bold transition hover:bg-white/10 disabled:opacity-50"
                >
                  {pending ? he.play.choosing : he.play.chooseThis}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-800">{error}</p>
      ) : null}

      <p className="mt-4 text-center text-sm text-white/65">ממתינים לתמונה הבאה...</p>
    </div>
  );
}
