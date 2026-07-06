import { he } from "@/lib/i18n/he";
import type { SubmissionRow } from "./types";

export function StudentResultCard({ submission, final }: { submission: SubmissionRow; final: boolean }) {
  return (
    <div className="glass-card w-full max-w-md border border-white/20 p-5 text-white sm:p-6">
      <p className="text-sm font-bold text-white/70">{he.play.firstReady}</p>

      {submission.generated_image_url_text ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={submission.generated_image_url_text}
            alt={submission.sent_prompt_text}
            className="w-full object-cover"
          />
        </div>
      ) : null}

      <p className="ltr-field mt-4 text-center text-3xl font-extrabold">
        {he.play.myScore.replace("{score}", submission.score_text ?? "0")}
      </p>

      {submission.tip_text ? (
        <div className="mt-4 rounded-lg border border-white/15 bg-white/10 p-3">
          <p className="text-sm font-bold text-white/80">{he.play.tipLabel}</p>
          <p className="mt-1 text-sm text-white/90">{submission.tip_text}</p>
        </div>
      ) : null}

      {final ? (
        <p className="mt-4 text-center text-sm text-white/65">ממתינים לתמונה הבאה...</p>
      ) : null}
    </div>
  );
}
