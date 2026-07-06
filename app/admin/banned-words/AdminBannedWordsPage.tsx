"use client";

import { FormEvent, useEffect, useState } from "react";
import { he } from "@/lib/i18n/he";

type BannedWord = { id: string; word_text: string };

export function AdminBannedWordsPage() {
  const [words, setWords] = useState<BannedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [newWord, setNewWord] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/pixa/admin/banned-words");
        const body = await response.json();
        if (!response.ok || !body.ok) throw new Error(body.error ?? "לא הצלחנו לטעון את הרשימה.");
        if (!cancelled) setWords(body.data.words as BannedWord[]);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "לא הצלחנו לטעון את הרשימה.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newWord.trim()) return;

    setAdding(true);
    setAddError("");

    try {
      const response = await fetch("/api/pixa/admin/banned-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord.trim() }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "לא הצלחנו להוסיף את המילה.");

      setNewWord("");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "לא הצלחנו להוסיף את המילה.");
    } finally {
      setAdding(false);
    }
  }

  async function onDelete(word: BannedWord) {
    setBusyId(word.id);
    try {
      const response = await fetch(`/api/pixa/admin/banned-words/${word.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "המחיקה נכשלה.");
      setReloadKey((key) => key + 1);
    } catch {
      // surfaced implicitly by the word remaining in the list
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={onAdd} className="flex flex-wrap gap-3">
        <input
          value={newWord}
          onChange={(event) => setNewWord(event.target.value)}
          placeholder={he.admin.bannedWordPlaceholder}
          className="min-h-11 flex-1 rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
        />
        <button
          type="submit"
          disabled={adding || !newWord.trim()}
          className="min-h-11 rounded-lg bg-pixa-pink px-6 font-extrabold text-white transition hover:bg-[#c9365d] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {adding ? he.common.loading : he.admin.addWordCta}
        </button>
      </form>
      {addError ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{addError}</p> : null}

      {loading ? <p className="text-sm text-white/70">{he.common.loading}</p> : null}
      {loadError ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{loadError}</p> : null}

      {!loading && !loadError ? (
        words.length === 0 ? (
          <p className="text-sm text-white/70">{he.admin.noBannedWords}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {words.map((word) => (
              <li
                key={word.id}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"
              >
                <span>{word.word_text}</span>
                <button
                  type="button"
                  disabled={busyId === word.id}
                  onClick={() => onDelete(word)}
                  aria-label={`הסרת ${word.word_text}`}
                  className="text-white/60 transition hover:text-red-300 disabled:opacity-40"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
