"use client";

import { FormEvent, useState } from "react";
import { he } from "@/lib/i18n/he";
import { PromptWritingTipsCard } from "./PromptWritingTipsCard";
import { GenerationProgressStepper } from "./GenerationProgressStepper";
import type { SubmissionRow } from "./types";

export function StudentPromptAttemptForm({
  gameId,
  userId,
  mode,
  initialPrompt,
  onSubmitted,
}: {
  gameId: string;
  userId: string;
  mode: "create" | "improve";
  initialPrompt?: string;
  onSubmitted: (submission: SubmissionRow) => void;
}) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/pixa/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, userId, prompt }),
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "לא הצלחנו לשלוח את הפרומפט.");
      }

      onSubmitted(body.data.submission as SubmissionRow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "לא הצלחנו לשלוח את הפרומפט.");
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="glass-card w-full max-w-md border border-white/20 p-6">
        <GenerationProgressStepper mode={mode} />
      </div>
    );
  }

  return (
    <div className="glass-card w-full max-w-md border border-white/20 p-5 text-white sm:p-6">
      {mode === "create" ? <PromptWritingTipsCard /> : null}

      <form onSubmit={onSubmit} className="mt-5">
        <label className="block text-sm font-bold text-white/85">
          {mode === "improve" ? he.play.improvePrompt : he.play.describeBoard}
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={2000}
            rows={4}
            autoFocus
            className="mt-2 w-full rounded-lg border border-white/30 bg-white px-4 py-3 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
          />
        </label>

        {mode === "create" ? <p className="mt-2 text-xs text-white/60">{he.play.oneChance}</p> : null}

        <button
          type="submit"
          disabled={!prompt.trim()}
          className="mt-4 min-h-12 w-full rounded-lg bg-pixa-pink px-5 py-3 text-base font-extrabold text-white transition hover:bg-[#c9365d] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {mode === "improve" ? he.play.stepImprove : he.play.stepCreate}
        </button>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error === "יש תוכן לא ראוי בפרומפט, תקן אותו ונסה שוב." ? he.play.inappropriatePrompt : error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
