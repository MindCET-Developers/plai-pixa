import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

          {user ? (
            <div className="mt-8 space-y-5">
              <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-white/70">מחובר כעת</p>
                <p className="mt-1 ltr-field text-left text-lg font-semibold">
                  {user.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-full bg-white px-6 py-3 font-bold text-pixa-btn-dark"
                >
                  המשך לבחירת תמונות
                </Link>
                <form action="/auth/sign-out" method="post">
                  <button
                    type="submit"
                    className="rounded-full border border-white/40 px-6 py-3 font-bold text-white"
                  >
                    יציאה
                  </button>
                </form>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </section>
    </main>
  );
}
