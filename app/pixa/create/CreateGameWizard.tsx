"use client";

import { useState } from "react";
import { he } from "@/lib/i18n/he";
import { IntroStep } from "./IntroStep";
import { ImagePicker } from "./ImagePicker";
import { GameLobby } from "./GameLobby";
import type { BankImage, CreatedGame } from "./types";

type Step = "intro" | "pick" | "lobby";
type CreateState = "idle" | "creating" | "error";

export function CreateGameWizard() {
  const [step, setStep] = useState<Step>("intro");
  const [selected, setSelected] = useState<BankImage[]>([]);
  const [createState, setCreateState] = useState<CreateState>("idle");
  const [createError, setCreateError] = useState("");
  const [game, setGame] = useState<{ game: CreatedGame; code: number; joinUrl: string } | null>(null);

  function toggleImage(image: BankImage) {
    setSelected((current) => {
      if (current.some((selectedImage) => selectedImage.id === image.id)) {
        return current.filter((selectedImage) => selectedImage.id !== image.id);
      }
      if (current.length >= 2) return current;
      return [...current, image];
    });
  }

  async function onCreateGame() {
    if (selected.length === 0) return;
    setCreateState("creating");
    setCreateError("");

    try {
      const response = await fetch("/api/pixa/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageIds: selected.map((image) => image.id),
        }),
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "לא הצלחנו ליצור את המשחק.");
      }

      setGame(body.data);
      setStep("lobby");
    } catch (error) {
      setCreateState("error");
      setCreateError(error instanceof Error ? error.message : "לא הצלחנו ליצור את המשחק.");
    }
  }

  if (step === "intro") {
    return <IntroStep onContinue={() => setStep("pick")} />;
  }

  if (step === "lobby" && game) {
    return <GameLobby game={game.game} code={game.code} joinUrl={game.joinUrl} />;
  }

  return (
    <div className="w-full max-w-4xl space-y-6 text-white">
      <div className="glass-card border border-white/20 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold">{he.create.chosenImages}</h2>
          <span className="text-sm font-bold text-white/70">{selected.length}/2</span>
        </div>
        <div className="mt-3 flex gap-3">
          {[0, 1].map((slot) => {
            const image = selected[slot];
            return (
              <div
                key={slot}
                className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/25 bg-white/5"
              >
                {image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url_text} alt={image.prompt_text} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => toggleImage(image)}
                      className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                      aria-label="הסרה"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-white/40">ריק</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCreateGame}
          disabled={selected.length === 0 || createState === "creating"}
          className="min-h-12 rounded-lg bg-white px-8 py-3 text-base font-extrabold text-pixa-btn-dark transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {createState === "creating" ? "יוצרים משחק..." : "יצירת המשחק"}
        </button>
        {createError ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{createError}</p>
        ) : null}
      </div>

      <div className="glass-card border border-white/20 p-6">
        <h2 className="text-lg font-extrabold">{he.create.imageBank}</h2>
        <div className="mt-4">
          <ImagePicker selected={selected} onToggle={toggleImage} />
        </div>
      </div>
    </div>
  );
}
