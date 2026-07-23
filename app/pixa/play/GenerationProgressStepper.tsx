"use client";

import { useEffect, useState } from "react";
import { he } from "@/lib/i18n/he";

export function GenerationProgressStepper({ mode }: { mode: "create" | "improve" }) {
  const [stage, setStage] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const stageTimer = setTimeout(() => setStage(1), 2500);
    const tipTimer = setInterval(() => {
      setTipIndex((current) => (current + 1) % he.play.generatingTips.length);
    }, 2200);

    return () => {
      clearTimeout(stageTimer);
      clearInterval(tipTimer);
    };
  }, []);

  const steps = [mode === "improve" ? he.play.stepImprove : he.play.stepCreate, he.play.stepGetScore];
  const message = mode === "improve" ? he.play.improvedOnTheWay : he.play.generatingFirst;

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-white">
      <p className="text-sm font-bold text-white/80">{message}</p>

      <div className="flex items-center justify-center gap-2">
        {steps.map((label, index) => {
          const isActive = index === stage;
          const isDone = index < stage;
          return (
            <div key={label} className="flex items-center gap-2">
              <span className="relative flex h-8 w-8 items-center justify-center">
                {isActive ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pixa-pink/60" />
                ) : null}
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold transition ${
                    isActive || isDone ? "bg-pixa-pink text-white" : "bg-white/15 text-white/50"
                  }`}
                >
                  {isDone ? "✓" : index + 1}
                </span>
              </span>
              <span className={`text-sm font-bold ${isActive || isDone ? "text-white" : "text-white/45"}`}>
                {label}
              </span>
              {index === 0 ? <span className="mx-1 h-px w-6 bg-white/25" /> : null}
            </div>
          );
        })}
      </div>

      <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-1/3 animate-[loading-bar_1.4s_ease-in-out_infinite] rounded-full bg-pixa-pink" />
      </div>

      <p key={tipIndex} className="animate-[fade-in_0.3s_ease-out] text-xs font-semibold text-white/60">
        {he.play.generatingTips[tipIndex]}
      </p>
    </div>
  );
}
