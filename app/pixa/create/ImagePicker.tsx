"use client";

import { FormEvent, useEffect, useState } from "react";
import { he } from "@/lib/i18n/he";
import type { BankImage, ImagesLevel } from "./types";

const TABS: { level: ImagesLevel; label: string; tip?: string }[] = [
  { level: "beginners", label: he.levels.beginners, tip: he.levels.beginnersTip },
  { level: "advanced", label: he.levels.advanced, tip: he.levels.advancedTip },
  { level: "experts", label: he.levels.experts, tip: he.levels.expertsTip },
  { level: "mine", label: he.levels.mine },
];

type GenerateState = "idle" | "generating" | "error";

export function ImagePicker({
  selected,
  onToggle,
  onGenerated,
}: {
  selected: BankImage[];
  onToggle: (image: BankImage) => void;
  onGenerated: (image: BankImage) => void;
}) {
  const [tab, setTab] = useState<ImagesLevel>("beginners");
  const [images, setImages] = useState<BankImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [customOpen, setCustomOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [generateState, setGenerateState] = useState<GenerateState>("idle");
  const [generateError, setGenerateError] = useState("");

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
  }, [tab, reloadKey]);

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || !grade.trim() || !description.trim()) return;

    setGenerateState("generating");
    setGenerateError("");

    try {
      const response = await fetch("/api/pixa/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: subject, grade, description, level: "mine" }),
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "לא הצלחנו ליצור את התמונה.");
      }

      const image = body.data.image as BankImage;
      setGenerateState("idle");
      setDescription("");
      onGenerated(image);
      if (tab === "mine") setReloadKey((key) => key + 1);
    } catch (error) {
      setGenerateState("error");
      setGenerateError(error instanceof Error ? error.message : "לא הצלחנו ליצור את התמונה.");
    }
  }

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

      <div className="rounded-xl border border-white/15 bg-white/5">
        <button
          type="button"
          onClick={() => setCustomOpen((open) => !open)}
          aria-expanded={customOpen}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right"
        >
          <span>
            <span className="block text-sm font-extrabold text-white">{he.create.customImages}</span>
            <span className="block text-xs font-semibold text-white/55">
              אפשר גם ליצור תמונה משלכם עם AI — לא חובה
            </span>
          </span>
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition ${
              customOpen ? "rotate-180 bg-white/10" : ""
            }`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        {customOpen ? (
          <div className="border-t border-white/10 px-5 pb-5 pt-4">
            <form onSubmit={onGenerate} className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-bold text-white/82">
                {he.create.subject}
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={120}
                  className="mt-2 min-h-11 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
                />
              </label>
              <label className="block text-sm font-bold text-white/82">
                {he.create.grade}
                <input
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  maxLength={80}
                  className="mt-2 min-h-11 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
                />
              </label>
              <label className="block text-sm font-bold text-white/82 sm:col-span-2">
                {he.create.describeImage}
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-white/30 bg-white px-4 py-2 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
                />
              </label>
              <button
                type="submit"
                disabled={generateState === "generating" || !subject.trim() || !grade.trim() || !description.trim()}
                className="min-h-11 w-full rounded-lg bg-pixa-purple px-5 py-2 font-extrabold text-white transition hover:bg-[#7530b7] disabled:cursor-not-allowed disabled:opacity-55 sm:col-span-2 sm:w-auto"
              >
                {generateState === "generating" ? "יוצרים תמונה..." : he.create.generateImages}
              </button>
            </form>
            {generateError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{generateError}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
