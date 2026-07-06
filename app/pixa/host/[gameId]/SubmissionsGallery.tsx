import { he } from "@/lib/i18n/he";
import type { SubmissionRow } from "./types";

export function SubmissionsGallery({ submissions }: { submissions: SubmissionRow[] }) {
  if (submissions.length === 0) {
    return (
      <p className="rounded-lg border border-white/15 bg-white/10 p-4 text-center text-sm text-white/70">
        {he.host.waitingForSubmissions}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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
            <div className="mt-2 overflow-hidden rounded-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={submission.generated_image_url_text}
                alt={submission.sent_prompt_text}
                className="w-full object-cover"
              />
            </div>
          ) : null}

          <p className="ltr-field mt-2 text-center text-2xl font-extrabold">{submission.score_text ?? "0"}</p>

          <p className="mt-2 line-clamp-2 text-xs text-white/75">{submission.sent_prompt_text}</p>

          {submission.tip_text ? (
            <p className="mt-1 text-xs font-bold text-pixa-pink">
              {he.create.tipLabel} {submission.tip_text}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
