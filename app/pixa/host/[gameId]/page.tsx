import Link from "next/link";
import { getGameStateByIdOrCode } from "@/lib/pixa/api";
import type { Tables } from "@/lib/supabase/database.types";

type GameImageWithImage = Tables<"game_images"> & { image: Tables<"images"> | null };

export default async function PixaHostPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const { game, images: rawImages, players } = await getGameStateByIdOrCode({ id: gameId });
  const images = rawImages as unknown as GameImageWithImage[];
  const currentImage = images.find((gameImage) => gameImage.image_id === game.current_image_id);

  return (
    <main className="min-h-screen bg-[url('/backgrounds/bg-dashboard.png')] bg-cover bg-center px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold">
            PIXA
          </Link>
          <span className="ltr-field rounded-lg border border-white/30 px-4 py-2 text-lg font-extrabold">
            {game.id_number}
          </span>
        </header>

        <div className="glass-card border border-white/20 p-6">
          <p className="text-sm font-bold text-white/70">המשחק התחיל</p>
          <h1 className="mt-2 text-2xl font-extrabold">
            {players.length} משתתפים · סיבוב {game.current_round_index + 1} מתוך {images.length}
          </h1>

          {currentImage?.image ? (
            <div className="mt-5 overflow-hidden rounded-xl border border-white/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage.image.url_text}
                alt={currentImage.image.prompt_text}
                className="max-h-96 w-full object-contain bg-black/20"
              />
            </div>
          ) : null}

          <p className="mt-6 rounded-lg border border-white/15 bg-white/10 p-4 text-sm text-white/80">
            לוח המורה המלא — גלריית הגשות, מעבר לתמונה הבאה ולוח מובילים — בבנייה בשלב הבא של הפיתוח.
          </p>
        </div>
      </section>
    </main>
  );
}
