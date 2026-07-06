"use client";

import { FormEvent, useMemo, useState } from "react";

type JoinState = "idle" | "joining" | "joined" | "error";

function getDevice() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function JoinGameForm({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [state, setState] = useState<JoinState>("idle");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => /^\d{5}$/.test(code) && name.trim().length > 0, [code, name]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setState("joining");
    setMessage("");

    try {
      const response = await fetch("/api/pixa/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          device: getDevice(),
        }),
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "לא הצלחנו להצטרף למשחק.");
      }

      window.localStorage.setItem(
        "pixa-player",
        JSON.stringify({
          gameId: body.data.game.id,
          code: body.data.game.id_number,
          userId: body.data.user.id,
          name: body.data.user.name_text,
        }),
      );

      setState("joined");
      setMessage("התחברת בהצלחה. אפשר להמתין עד שהמורה יתחיל/תתחיל את המשחק.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "לא הצלחנו להצטרף למשחק.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card w-full max-w-md border border-white/20 p-5 text-white sm:p-6">
      <p className="text-sm font-bold text-white/70">PIXA</p>
      <h1 className="mt-2 text-3xl font-extrabold">כניסת תלמידים</h1>

      <label className="mt-6 block text-sm font-bold text-white/82">
        קוד משחק
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="12345"
          className="ltr-field mt-2 min-h-14 w-full rounded-lg border border-white/30 bg-white px-4 text-center text-3xl font-extrabold tracking-[0.2em] text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
        />
      </label>

      <label className="mt-4 block text-sm font-bold text-white/82">
        שם
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          className="mt-2 min-h-12 w-full rounded-lg border border-white/30 bg-white px-4 text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
        />
      </label>

      <button
        type="submit"
        disabled={!canSubmit || state === "joining"}
        className="mt-5 min-h-12 w-full rounded-lg bg-pixa-pink px-5 py-3 text-base font-extrabold text-white transition hover:bg-[#c9365d] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {state === "joining" ? "מצטרפים..." : "להצטרף למשחק"}
      </button>

      {message ? (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm font-bold ${
            state === "joined" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
