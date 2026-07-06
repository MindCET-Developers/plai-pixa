import { he } from "@/lib/i18n/he";

export function IntroStep({ onContinue }: { onContinue: () => void }) {
  const steps = [
    { title: he.landing.step1Title, body: he.create.explainPick },
    { title: he.landing.step2Title, body: he.create.explainCode },
    { title: he.landing.step3Title, body: he.create.explainWrite },
    { title: he.landing.step4Title, body: he.create.explainScore },
  ];

  return (
    <div className="glass-card w-full max-w-3xl border border-white/20 p-8 text-white">
      <p className="text-sm font-bold text-white/70">PIXA</p>
      <h1 className="mt-2 text-3xl font-extrabold">{he.create.gameSubtitle}</h1>
      <p className="mt-2 text-white/80">{he.create.duration}</p>

      <ol className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4 rounded-xl border border-white/15 bg-white/10 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-pixa-btn-dark">
              {index + 1}
            </span>
            <div>
              <p className="font-bold">{step.title}</p>
              <p className="mt-1 text-sm text-white/80">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onContinue}
        className="mt-7 min-h-12 w-full rounded-lg bg-white px-6 py-3 text-base font-extrabold text-pixa-btn-dark transition hover:bg-white/90 sm:w-auto"
      >
        המשך לבחירת תמונות
      </button>
    </div>
  );
}
