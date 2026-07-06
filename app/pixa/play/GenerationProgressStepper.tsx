"use client";

import { useEffect, useState } from "react";
import { he } from "@/lib/i18n/he";

export function GenerationProgressStepper({ mode }: { mode: "create" | "improve" }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    function reset() {
      setStage(0);
    }

    reset();
    const timer = setTimeout(() => setStage(1), 2500);
    return () => clearTimeout(timer);
  }, [mode]);

  const steps = [mode === "improve" ? he.play.stepImprove : he.play.stepCreate, he.play.stepGetScore];
  const message = mode === "improve" ? he.play.improvedOnTheWay : he.play.generatingFirst;

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-white">
      <p className="text-sm font-bold text-white/80">{message}</p>
      <div className="flex items-center justify-center gap-2">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold transition ${
                index <= stage ? "bg-pixa-pink text-white" : "bg-white/15 text-white/50"
              }`}
            >
              {index < stage ? "✓" : index + 1}
            </span>
            <span className={`text-sm font-bold ${index <= stage ? "text-white" : "text-white/45"}`}>{label}</span>
            {index === 0 ? <span className="mx-1 h-px w-6 bg-white/25" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
