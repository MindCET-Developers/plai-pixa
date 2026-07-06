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
