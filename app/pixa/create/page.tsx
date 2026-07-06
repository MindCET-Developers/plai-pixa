import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateGameWizard } from "./CreateGameWizard";

export default async function PixaCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;

  if (user) {
    return (
      <main className="min-h-screen bg-[url('/backgrounds/bg-create-game.png')] bg-cover bg-center px-4 py-8 sm:px-6 sm:py-10">
        <section className="mx-auto flex max-w-5xl flex-col items-center gap-6">
          <header className="flex w-full max-w-4xl items-center justify-between text-white">
            <Link href="/" className="text-2xl font-extrabold">
              PIXA
            </Link>
            <div className="flex items-center gap-3">
              <span className="ltr-field hidden text-sm text-white/70 sm:inline">{user.email}</span>
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-white/40 px-4 py-2 text-sm font-bold text-white"
                >
                  יציאה
                </button>
              </form>
            </div>
          </header>

          <CreateGameWizard />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/backgrounds/bg-create-game.png')] bg-cover bg-center px-6 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="glass-card w-full max-w-xl border border-white/20 p-8">
          <p className="text-sm font-semibold text-white/75">PIXA</p>
          <h1 className="mt-3 text-4xl font-bold">ברוכים הבאים ל-PIXA!</h1>
          <p className="mt-4 text-lg text-white/85">
            משחק ליצירת תמונה בפרומפט. כדי ליצור משחק כיתה, התחברו עם חשבון
            Google של המורה.
          </p>

          {params.auth_error ? (
            <p className="mt-5 rounded-lg border border-pixa-pink/50 bg-pixa-pink/20 p-3 text-sm">
              לא הצלחנו להשלים את ההתחברות. בדקו שהגדרות Google OAuth
              מופעלות ב-Supabase ונסו שוב.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth/sign-in?next=/pixa/create"
              className="rounded-full bg-white px-7 py-3 font-bold text-pixa-btn-dark"
            >
              כניסת מורים עם Google
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/40 px-7 py-3 font-bold text-white"
            >
              חזרה
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
