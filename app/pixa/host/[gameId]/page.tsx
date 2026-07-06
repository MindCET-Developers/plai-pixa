import Link from "next/link";
import { getGameStateByIdOrCode } from "@/lib/pixa/api";
import { TeacherHostBoard } from "./TeacherHostBoard";
import type { GameState } from "./types";

export default async function PixaHostPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const state = await getGameStateByIdOrCode({ id: gameId });

  return (
    <main className="min-h-screen bg-[url('/backgrounds/bg-dashboard.png')] bg-cover bg-center px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold">
            PIXA
          </Link>
          <span className="ltr-field rounded-lg border border-white/30 px-4 py-2 text-lg font-extrabold">
            {state.game.id_number}
          </span>
        </header>

        <TeacherHostBoard
          gameId={state.game.id}
          teacherUserId={state.game.creator_user_id}
          initialState={state as unknown as GameState}
        />
      </section>
    </main>
  );
}
