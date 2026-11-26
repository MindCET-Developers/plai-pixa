"use client";

import { FormEvent, useState } from "react";
import { he } from "@/lib/i18n/he";
import { isSamePrompt } from "@/lib/pixa/gameLogic";
import { PromptWritingTipsCard } from "./PromptWritingTipsCard";
import { GenerationProgressStepper } from "./GenerationProgressStepper";
import { useSpeechToText } from "./useSpeechToText";
import type { SubmissionRow } from "./types";

export function StudentPromptAttemptForm({
  gameId,
  userId,
  mode,
  initialPrompt,
  onSubmitted,
  onKeepFirst,
}: {
  gameId: string;
  userId: string;
  mode: "create" | "improve";
  initialPrompt?: string;
  onSubmitted: (submission: SubmissionRow) => void;
  onKeepFirst?: () => void;
}) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [clearedText, setClearedText] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const genericSubmitError = "לא הצלחנו ליצור תמונה כרגע. נסו שוב בעוד רגע.";

  const improving = mode === "improve";
  const attempt = improving ? 2 : 1;
  const unchanged = improving && isSamePrompt(prompt, initialPrompt);
  const canSubmit = prompt.trim().length > 0 && !unchanged && !submitting;

  const speech = useSpeechToText((text) => {
    setConfirming(false);
    setClearedText(null);
    setPrompt((previous) => (previous.trim() ? `${previous.trimEnd()} ${text}` : text));
  });

  function changePrompt(value: string) {
    setPrompt(value);
    setClearedText(null);
    setConfirming(false);
  }

  function clearAll() {
    speech.abort();
    setClearedText(prompt);
    setPrompt("");
    setConfirming(false);
  }

  function undoClear() {
    if (clearedText === null) return;
    setPrompt(clearedText);
    setClearedText(null);
  }

  async function send() {
    if (!canSubmit) return;
    speech.abort();

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/pixa/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, userId, prompt }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body.ok) {
        throw new Error(response.status >= 500 ? genericSubmitError : (body?.error ?? genericSubmitError));
      }

      onSubmitted(body.data.submission as SubmissionRow);
    } catch (err) {
      setError(err instanceof Error ? err.message : genericSubmitError);
      setSubmitting(false);
      setConfirming(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    // The second attempt replaces the first image and score, so ask before sending it.
    if (improving && !confirming) {
      setConfirming(true);
      return;
    }
    void send();
  }

  const secondaryButton =
    "min-h-12 rounded-lg border border-white/35 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50";

  return (
    <div className="glass-card w-full max-w-md border border-white/20 p-5 text-white sm:p-6">
      {submitting ? (
        <div className="mb-5">
          <GenerationProgressStepper mode={mode} />
        </div>
      ) : null}

      {!submitting && mode === "create" ? <PromptWritingTipsCard /> : null}

      <form onSubmit={onSubmit} className={submitting ? "opacity-60" : "mt-5"}>
        <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-white">
          {he.play.attemptBadge.replace("{n}", String(attempt))}
        </p>

        <label htmlFor="student-prompt" className="block text-sm font-bold text-white/85">
          {improving ? he.play.improvePrompt : he.play.describeBoard}
        </label>
        <textarea
          id="student-prompt"
          value={prompt}
          onChange={(event) => changePrompt(event.target.value)}
          maxLength={2000}
          rows={5}
          autoFocus={!improving}
          disabled={submitting}
          className="mt-2 min-h-32 w-full resize-y rounded-lg border border-white/30 bg-white px-4 py-3 text-base leading-relaxed text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
        />
        {speech.listening && speech.interim ? (
          <p className="mt-1 text-sm text-white/60">{speech.interim}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          {speech.supported ? (
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              disabled={submitting}
              aria-pressed={speech.listening}
              className={`${secondaryButton} ${speech.listening ? "border-pixa-pink bg-pixa-pink/30" : ""}`}
            >
              <span aria-hidden="true" className={speech.listening ? "animate-pulse" : ""}>
                🎤
              </span>{" "}
              {speech.listening ? he.play.dictateStop : he.play.dictate}
            </button>
          ) : null}

          {clearedText !== null && !prompt ? (
            <button type="button" onClick={undoClear} disabled={submitting} className={secondaryButton}>
              {he.play.undoClear}
            </button>
          ) : (
            <button
              type="button"
              onClick={clearAll}
              disabled={submitting || !prompt}
              className={secondaryButton}
            >
              {he.play.clearAll}
            </button>
          )}
        </div>

        {speech.listening ? <p className="mt-2 text-xs text-white/70">{he.play.dictateListening}</p> : null}
        {speech.error ? <p className="mt-2 text-sm font-bold text-red-200">{speech.error}</p> : null}
        {speech.supported && !speech.listening ? (
          <p className="mt-2 text-xs text-white/50">{he.play.dictateNote}</p>
        ) : null}

        {mode === "create" ? <p className="mt-3 text-xs text-white/60">{he.play.oneChance}</p> : null}

        {improving ? (
          <p className="mt-4 rounded-lg border border-amber-200/40 bg-amber-300/15 px-3 py-2 text-sm font-bold text-amber-100">
            {he.play.replaceWarning}
          </p>
        ) : null}

        {confirming ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="min-h-12 rounded-lg bg-pixa-pink px-3 py-3 text-base font-extrabold text-white transition hover:bg-[#c9365d] disabled:opacity-55"
            >
              {he.play.confirmReplace}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={secondaryButton}>
              {he.play.backToEdit}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-4 min-h-12 w-full rounded-lg bg-pixa-pink px-5 py-3 text-base font-extrabold text-white transition hover:bg-[#c9365d] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {improving ? he.play.stepImprove : he.play.stepCreate}
          </button>
        )}

        {unchanged && !submitting ? (
          <p className="mt-2 text-center text-xs text-white/70">{he.play.unchangedHint}</p>
        ) : null}

        {improving && onKeepFirst && !submitting ? (
          <button type="button" onClick={onKeepFirst} className={`${secondaryButton} mt-3 w-full`}>
            {he.play.keepFirst}
          </button>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error === "יש תוכן לא ראוי בפרומפט, תקן אותו ונסה שוב." ||
            error === "יש תוכן לא ראוי בפרומפט, תקן אותו ונסה שוב"
              ? he.play.inappropriatePrompt
              : error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
