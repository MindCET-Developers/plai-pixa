"use client";

import { useState } from "react";
import { he } from "@/lib/i18n/he";

export function StudentReviewModal({ gameId, userId }: { gameId: string; userId: string }) {
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit() {
    if (stars === 0 || status === "sending") return;
    setStatus("sending");

    try {
      const response = await fetch("/api/pixa/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, userId, stars, message: message.trim() || undefined, reviewer: "student" }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center text-sm font-bold text-white/85">
        תודה על המשוב!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4">
      <p className="text-sm font-extrabold text-white">{he.play.feedbackQuestion}</p>

      <div className="ltr-field mt-3 flex justify-center gap-2" dir="ltr">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStars(value)}
            aria-label={`${value} כוכבים`}
            className={`text-3xl leading-none transition ${value <= stars ? "text-yellow-300" : "text-white/25"}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="עוד משהו לספר לנו? (לא חובה)"
        className="mt-3 w-full rounded-lg border border-white/25 bg-white/95 px-3 py-2 text-sm text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={stars === 0 || status === "sending"}
        className="mt-3 min-h-11 w-full rounded-lg bg-white px-5 py-2 font-extrabold text-pixa-btn-dark transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {status === "sending" ? "שולחים..." : "שליחת משוב"}
      </button>

      {status === "error" ? (
        <p className="mt-2 text-center text-xs font-bold text-red-200">לא הצלחנו לשלוח, נסו שוב.</p>
      ) : null}
    </div>
  );
}
