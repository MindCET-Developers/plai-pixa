"use client";

import { FormEvent, useEffect, useState } from "react";
import { he } from "@/lib/i18n/he";
import type { AdminImage, BankLevel, ImagesLevel } from "./types";

const TABS: { level: ImagesLevel | "all"; label: string }[] = [
  { level: "all", label: "הכול" },
  { level: "beginners", label: he.levels.beginners },
  { level: "advanced", label: he.levels.advanced },
  { level: "experts", label: he.levels.experts },
  { level: "mine", label: he.levels.mine },
];

const BANK_LEVELS: { level: BankLevel; label: string }[] = [
  { level: "beginners", label: he.levels.beginners },
  { level: "advanced", label: he.levels.advanced },
  { level: "experts", label: he.levels.experts },
];

export function AdminImageBankPage() {
  const [tab, setTab] = useState<ImagesLevel | "all">("all");
  const [images, setImages] = useState<AdminImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [url, setUrl] = useState("");
  const [uploadPrompt, setUploadPrompt] = useState("");
  const [uploadLevel, setUploadLevel] = useState<BankLevel>("beginners");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [generateLevel, setGenerateLevel] = useState<BankLevel>("beginners");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [busyRow, setBusyRow] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/pixa/admin/images?level=${tab}`);
        const body = await response.json();
        if (!response.ok || !body.ok) throw new Error(body.error ?? "לא הצלחנו לטעון את מאגר התמונות.");
        if (!cancelled) setImages(body.data.images as AdminImage[]);
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

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || !uploadPrompt.trim()) return;

    setUploading(true);
    setUploadError("");

    try {
      const response = await fetch("/api/pixa/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, prompt: uploadPrompt, level: uploadLevel }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "לא הצלחנו להוסיף את התמונה.");

      setUrl("");
      setUploadPrompt("");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "לא הצלחנו להוסיף את התמונה.");
    } finally {
      setUploading(false);
    }
  }

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim() || !grade.trim() || !description.trim()) return;

    setGenerating(true);
    setGenerateError("");

    try {
      const response = await fetch("/api/pixa/admin/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade, description, level: generateLevel }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "לא הצלחנו ליצור את התמונה.");

      setDescription("");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "לא הצלחנו ליצור את התמונה.");
    } finally {
      setGenerating(false);
    }
  }

  async function onToggleArchive(image: AdminImage) {
    setBusyRow(image.id);
    setRowError((prev) => ({ ...prev, [image.id]: "" }));

    try {
      const response = await fetch(`/api/pixa/admin/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !image.back_boolean }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "הפעולה נכשלה.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setRowError((prev) => ({ ...prev, [image.id]: error instanceof Error ? error.message : "הפעולה נכשלה." }));
    } finally {
      setBusyRow(null);
    }
  }

  async function onDelete(image: AdminImage) {
    setBusyRow(image.id);
    setRowError((prev) => ({ ...prev, [image.id]: "" }));

    try {
      const response = await fetch(`/api/pixa/admin/images/${image.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "המחיקה נכשלה.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setRowError((prev) => ({ ...prev, [image.id]: error instanceof Error ? error.message : "המחיקה נכשלה." }));
    } finally {
      setBusyRow(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <form onSubmit={onUpload} className="rounded-xl border border-white/15 bg-white/5 p-5">
          <h2 className="text-lg font-extrabold">{he.admin.imagesUploadTitle}</h2>
          <label className="mt-4 block text-sm font-bold text-white/82">
            {he.admin.imageUrlLabel}
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
            />
          </label>
          <label className="mt-3 block text-sm font-bold text-white/82">
            {he.admin.imagePromptLabel}
            <textarea
              value={uploadPrompt}
              onChange={(event) => setUploadPrompt(event.target.value)}
              rows={2}
              className="mt-2 w-full rounded-lg border border-white/30 bg-white px-4 py-2 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
            />
          </label>
          <label className="mt-3 block text-sm font-bold text-white/82">
            {he.admin.levelLabel}
            <select
              value={uploadLevel}
              onChange={(event) => setUploadLevel(event.target.value as BankLevel)}
              className="mt-2 min-h-11 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
            >
              {BANK_LEVELS.map((option) => (
                <option key={option.level} value={option.level}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={uploading || !url.trim() || !uploadPrompt.trim()}
            className="mt-4 min-h-11 w-full rounded-lg bg-pixa-pink px-5 py-2 font-extrabold text-white transition hover:bg-[#c9365d] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {uploading ? he.common.loading : he.admin.uploadCta}
          </button>
          {uploadError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{uploadError}</p>
          ) : null}
        </form>

        <form onSubmit={onGenerate} className="rounded-xl border border-white/15 bg-white/5 p-5">
          <h2 className="text-lg font-extrabold">{he.admin.imagesGenerateTitle}</h2>
          <label className="mt-4 block text-sm font-bold text-white/82">
            {he.create.subject}
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
            />
          </label>
          <label className="mt-3 block text-sm font-bold text-white/82">
            {he.create.grade}
            <input
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
            />
          </label>
          <label className="mt-3 block text-sm font-bold text-white/82">
            {he.create.describeImage}
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="mt-2 w-full rounded-lg border border-white/30 bg-white px-4 py-2 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
            />
          </label>
          <label className="mt-3 block text-sm font-bold text-white/82">
            {he.admin.levelLabel}
            <select
              value={generateLevel}
              onChange={(event) => setGenerateLevel(event.target.value as BankLevel)}
              className="mt-2 min-h-11 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
            >
              {BANK_LEVELS.map((option) => (
                <option key={option.level} value={option.level}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={generating || !topic.trim() || !grade.trim() || !description.trim()}
            className="mt-4 min-h-11 w-full rounded-lg bg-pixa-purple px-5 py-2 font-extrabold text-white transition hover:bg-[#7530b7] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {generating ? "יוצרים תמונה..." : he.admin.generateCta}
          </button>
          {generateError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{generateError}</p>
          ) : null}
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tabInfo) => (
          <button
            key={tabInfo.level}
            type="button"
            onClick={() => setTab(tabInfo.level)}
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
          <p className="text-sm text-white/70">{he.admin.noImagesInLevel}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="rounded-xl border border-white/15 bg-white/10 p-3">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url_text} alt={image.prompt_text} className="h-full w-full object-cover" />
                  {image.back_boolean ? (
                    <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">
                      {he.admin.archivedBadge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-white/75">{image.prompt_text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyRow === image.id}
                    onClick={() => onToggleArchive(image)}
                    className="flex-1 rounded-lg border border-white/25 px-2 py-1.5 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {image.back_boolean ? he.admin.restoreCta : he.admin.archiveCta}
                  </button>
                  <button
                    type="button"
                    disabled={busyRow === image.id}
                    onClick={() => onDelete(image)}
                    className="flex-1 rounded-lg border border-red-300/50 px-2 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {he.admin.deleteCta}
                  </button>
                </div>
                {rowError[image.id] ? (
                  <p className="mt-2 text-xs font-bold text-red-200">{rowError[image.id]}</p>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
