"use client";

import { useState } from "react";
import { he } from "@/lib/i18n/he";
import type { SubmissionRow } from "./types";

export function SubmissionsGallery({ submissions }: { submissions: SubmissionRow[] }) {
  const [showScores, setShowScores] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionRow | null>(null);

  if (submissions.length === 0) {
    return (
      <p className="rounded-lg border border-white/15 bg-white/10 p-4 text-center text-sm text-white/70">
        {he.host.waitingForSubmissions}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-bold text-white/85">
          <input
            type="checkbox"
            checked={showScores}
            onChange={(event) => setShowScores(event.target.checked)}
            className="h-4 w-4"
          />
          {he.host.showScores}
        </label>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white/85 hover:bg-white/20"
        >
          {expanded ? he.host.collapseGallery : he.host.expandGallery}
        </button>
      </div>

      <div
        className={
          expanded
            ? "grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
        }
      >
        {submissions.map((submission) => (
          <div key={submission.id} className="rounded-xl border border-white/15 bg-white/10 p-3">
            <div className="flex items-center gap-2">
              {submission.user?.avatar_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={submission.user.avatar_image} alt="" className="h-8 w-8 rounded-full bg-white" />
              ) : null}
              <span className="truncate text-sm font-extrabold">{submission.user?.name_text ?? "תלמיד/ה"}</span>
            </div>

            {submission.generated_image_url_text ? (
              <button
                type="button"
                onClick={() => setActiveSubmission(submission)}
                className="mt-2 block w-full overflow-hidden rounded-lg border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.generated_image_url_text}
                  alt={submission.sent_prompt_text}
                  className="w-full object-cover"
                />
              </button>
            ) : null}

            {showScores ? (
              <p className="ltr-field mt-2 text-center text-2xl font-extrabold">{submission.score_text ?? "0"}</p>
            ) : null}
          </div>
        ))}
      </div>

      {activeSubmission ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveSubmission(null)}
        >
          <div
            className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-xl border border-white/15 bg-[#241a3a] p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-extrabold">
                {activeSubmission.user?.name_text ?? "תלמיד/ה"}
              </span>
              <button
                type="button"
                onClick={() => setActiveSubmission(null)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/85 hover:bg-white/20"
              >
                {he.host.closeImage}
              </button>
            </div>

            {activeSubmission.generated_image_url_text ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeSubmission.generated_image_url_text}
                alt={activeSubmission.sent_prompt_text}
                className="w-full rounded-lg object-contain"
              />
            ) : null}

            {showScores ? (
              <p className="ltr-field mt-2 text-center text-2xl font-extrabold">
                {activeSubmission.score_text ?? "0"}
              </p>
            ) : null}

            <p className="mt-2 text-center text-xs text-white/75">{activeSubmission.sent_prompt_text}</p>

            {activeSubmission.tip_text ? (
              <p className="mt-1 text-center text-xs font-bold text-pixa-pink">
                {he.create.tipLabel} {activeSubmission.tip_text}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
