import Link from "next/link";
import { he } from "@/lib/i18n/he";

type Access = { status: "signed_out" } | { status: "forbidden"; email: string };

export function AdminAccessGate({ access }: { access: Access }) {
  return (
    <main className="min-h-screen bg-[url('/backgrounds/bg-admin.png')] bg-cover bg-center px-6 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <div className="glass-card w-full border border-white/20 p-8">
          <p className="text-sm font-semibold text-white/75">PIXA</p>
          <h1 className="mt-3 text-3xl font-bold">{he.admin.title}</h1>

          {access.status === "forbidden" ? (
            <p className="mt-4 text-lg text-white/85">{he.admin.forbidden.replace("{email}", access.email)}</p>
          ) : (
            <p className="mt-4 text-lg text-white/85">{he.admin.signInRequired}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {access.status === "signed_out" ? (
              <Link
                href="/auth/sign-in?next=/admin/images"
                className="rounded-full bg-white px-7 py-3 font-bold text-pixa-btn-dark"
              >
                {he.admin.signInCta}
              </Link>
            ) : null}
            <Link href="/" className="rounded-full border border-white/40 px-7 py-3 font-bold text-white">
              חזרה
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
