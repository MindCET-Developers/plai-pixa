import Link from "next/link";
import { JoinGameForm } from "./JoinGameForm";

export default async function PixaPlayPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[url('/backgrounds/bg-student-phone.png')] bg-cover bg-center px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between text-white">
          <Link href="/" className="text-2xl font-extrabold">
            PIXA
          </Link>
          <Link href="/" className="rounded-lg border border-white/35 px-4 py-2 text-sm font-bold">
            חזרה
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          <JoinGameForm initialCode={params.ids} />
        </section>
      </div>
    </main>
  );
}
