export type AdvanceResult =
  | { finished: true; nextIndex: null; nextImageId: null }
  | { finished: false; nextIndex: number; nextImageId: string };

/**
 * Decides the next round for a game given its ordered images and the current
 * round index. Returns finished=true once every image has had its round.
 */
export function computeAdvance(
  images: { image_id: string }[],
  currentRoundIndex: number,
): AdvanceResult {
  const nextIndex = currentRoundIndex + 1;
  const nextImage = images[nextIndex];

  if (nextImage === undefined) {
    return { finished: true, nextIndex: null, nextImageId: null };
  }

  return { finished: false, nextIndex, nextImageId: nextImage.image_id };
}

/** A student gets two attempts per image; the second attempt replaces the first. */
export function computeNextTryNumber(existingTryNumber: number | undefined | null) {
  return (existingTryNumber ?? 0) + 1;
}

export function isOutOfAttempts(existingTryNumber: number | undefined | null, maxAttempts = 2) {
  return (existingTryNumber ?? 0) >= maxAttempts;
}

/**
 * The student's running score only reflects their latest attempt per image,
 * so replacing a submission must subtract the previous score before adding the new one.
 */
export function computeScoreDelta(newScore: number, previousScore: number | undefined | null) {
  return newScore - (previousScore ?? 0);
}

/**
 * Two prompts count as the same submission when only whitespace differs, so the
 * student cannot spend their second attempt on the exact text they already sent.
 */
export function isSamePrompt(prompt: string, previousPrompt: string | undefined | null) {
  if (previousPrompt == null) return false;
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ");
  return normalize(prompt) === normalize(previousPrompt);
}

export type AttemptScore = { tryNumber: number; score: number };

/**
 * Which attempt counts right after a new one is scored: the higher score wins,
 * and a tie goes to the newer attempt. The student can still switch afterwards.
 */
export function pickDefaultAttempt(previous: AttemptScore | null | undefined, next: AttemptScore) {
  if (!previous) return next.tryNumber;
  return next.score >= previous.score ? next.tryNumber : previous.tryNumber;
}

/** Rows that predate stored attempts have no selected_try_number; they mirror their latest try. */
export function effectiveSelectedTry(row: { selected_try_number?: number | null; try_number: number }) {
  return row.selected_try_number ?? row.try_number;
}
