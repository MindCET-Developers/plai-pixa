"use client";

import { useEffect, useState } from "react";
import { he } from "@/lib/i18n/he";
import type { BankImage, ImagesLevel } from "./types";

const TABS: { level: ImagesLevel; label: string; tip?: string }[] = [
  { level: "beginners", label: he.levels.beginners, tip: he.levels.beginnersTip },
  { level: "advanced", label: he.levels.advanced, tip: he.levels.advancedTip },
  { level: "experts", label: he.levels.experts, tip: he.levels.expertsTip },
  { level: "mine", label: he.levels.mine },
];

export function ImagePicker({
  selected,
  onToggle,
}: {
  selected: BankImage[];
  onToggle: (image: BankImage) => void;
}) {
  const [tab, setTab] = useState<ImagesLevel>("beginners");
  const [images, setImages] = useState<BankImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/pixa/images?level=${tab}`);
        const body = await response.json();
        if (!response.ok || !body.ok) {
          throw new Error(body.error ?? "לא הצלחנו לטעון את מאגר התמונות.");
        }
        if (!cancelled) setImages(body.data.images as BankImage[]);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "לא הצלחנו לטעון את מאגר התמונות.");
          setImages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tab]);

  const isSelected = (id: string) => selected.some((image) => image.id === id);
  const selectionFull = selected.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tabInfo) => (
          <button
            key={tabInfo.level}
            type="button"
            onClick={() => setTab(tabInfo.level)}
            title={tabInfo.tip}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === tabInfo.level
                ? "bg-white text-pixa-btn-dark"
                : "border border-white/30 text-white hover:bg-white/10"
            }`}
          >
            {tabInfo.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-white/70">{he.common.loading}</p> : null}
      {loadError ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{loadError}</p> : null}

      {!loading && !loadError ? (
        images.length === 0 ? (
          <p className="text-sm text-white/70">
            {tab === "mine" ? "עדיין לא יצרת תמונות. אפשר ליצור למטה." : "אין תמונות בקטגוריה הזו כרגע."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image) => {
              const active = isSelected(image.id);
              const disabled = !active && selectionFull;
              return (
                <button
                  key={image.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(image)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                    active
                      ? "border-pixa-pink ring-4 ring-pixa-pink/40"
                      : disabled
                        ? "border-white/10 opacity-40"
                        : "border-white/20 hover:border-white/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url_text}
                    alt={image.prompt_text}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {active ? (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pixa-pink text-xs font-extrabold text-white">
                      {selected.findIndex((selectedImage) => selectedImage.id === image.id) + 1}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )
      ) : null}

      <div className="rounded-xl border border-white/15 bg-white/5 p-5">
        <h2 className="text-lg font-extrabold text-white">{he.create.customImages}</h2>
        <div className="mt-4 flex items-center justify-center rounded-lg border border-dashed border-white/25 bg-white/5 px-4 py-8 text-center">
          <p className="text-sm font-bold text-white/60">בקרוב - יצירת תמונות בהתאמה אישית</p>
        </div>
      </div>
    </div>
  );
}
