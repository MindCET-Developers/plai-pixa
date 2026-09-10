import Link from "next/link";

export const LAST_UPDATED = "10 בספטמבר 2026";

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-pixa-light text-pixa-ink">
      <header className="bg-pixa-ink px-5 py-8 text-white sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-extrabold tracking-normal">
            PIXA
          </Link>
          <nav className="flex items-center gap-6 text-sm font-bold text-white/80">
            <Link href="/privacy">מדיניות פרטיות</Link>
            <Link href="/terms">תנאי שימוש</Link>
          </nav>
        </div>
      </header>

      <div className="px-5 py-14 sm:px-8">
        <article className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-pixa-ink/72">{intro}</p>
          <p className="mt-3 text-sm font-bold text-pixa-ink/60">
            עדכון אחרון: {LAST_UPDATED}
          </p>

          <div className="mt-10 space-y-4">{children}</div>

          <p className="mt-12 text-base leading-7 text-pixa-ink/72">
            לשאלות בנושא זה אפשר לפנות אלינו דרך{" "}
            <Link href="/#feedback" className="font-extrabold text-pixa-primary underline">
              טופס יצירת הקשר
            </Link>{" "}
            או במייל{" "}
            <a href="mailto:info@mindcet.io" className="ltr-field font-extrabold text-pixa-primary underline">
              info@mindcet.io
            </a>
            .
          </p>
        </article>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-pixa-ink/10 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <div className="mt-4 space-y-3 text-base leading-7 text-pixa-ink/72 [&_li]:leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pr-6">
        {children}
      </div>
    </section>
  );
}
