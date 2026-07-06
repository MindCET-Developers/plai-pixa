import { he } from "@/lib/i18n/he";

export function PromptWritingTipsCard() {
  const tips = [he.play.tipAccurate, he.play.tipMainDetails, he.play.tipSmallDetails, he.play.tipStyle];

  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4">
      <p className="text-sm font-extrabold text-white">{he.play.howToWrite}</p>
      <ul className="mt-2 space-y-1.5">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm text-white/85">
            <span aria-hidden="true">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
