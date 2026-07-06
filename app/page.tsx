import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const feedbackSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  message: z.string().trim().min(3).max(2000),
});

const howItWorks = [
  {
    title: "בחירת תמונות",
    text: "המורה בוחר.ת עד שתי תמונות ממאגר מוכן או יוצר.ת תמונות חדשות לפי נושא השיעור.",
  },
  {
    title: "כניסה למשחק",
    text: "התלמידים מצטרפים עם קוד משחק, בוחרים שם ואווטאר, וממתינים לפתיחה בכיתה.",
  },
  {
    title: "כתיבת פרומפט",
    text: "כולם מתארים את תמונת היעד כך שמחולל התמונות יצליח ליצור תמונה כמה שיותר דומה.",
  },
  {
    title: "משוב והשוואה",
    text: "PIXA משווה בין התוצאה לתמונה המקורית, נותן ציון, ומציע טיפ לשיפור הפרומפט.",
  },
];

const faqs = [
  {
    question: "האם צריך ידע מוקדם ב-AI?",
    answer: "לא. המשחק בנוי כהתנסות מודרכת שמלמדת את עקרונות כתיבת הפרומפט תוך כדי פעילות.",
  },
  {
    question: "כמה זמן לוקח משחק ממוצע?",
    answer: "בדרך כלל 15-30 דקות, בהתאם לגודל הקבוצה ולקצב הדיון בכיתה.",
  },
  {
    question: "האם צריך להוריד משהו לסמארטפון?",
    answer: "לא. התלמידים מצטרפים דרך הדפדפן בקישור או בקוד שהמורה משתף.ת.",
  },
  {
    question: "האם זה מתאים לכל כיתה?",
    answer: "אפשר לבחור רמות קושי שונות ולחבר את התמונות לתחום הדעת, ולכן הפעילות גמישה מאוד.",
  },
  {
    question: "מה זה מחולל תמונות בעזרת בינה מלאכותית?",
    answer: "זה כלי שיוצר תמונה חדשה מתוך הנחיה כתובה. PIXA מלמדת איך לנסח את ההנחיה הזו בצורה מדויקת.",
  },
  {
    question: "האם המשחק עולה כסף?",
    answer: "לא, המשחק הוא חינמי :)",
  },
];

async function sendFeedback(formData: FormData) {
  "use server";

  const parsed = feedbackSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    redirect("/?feedback=error#feedback");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("feedback").insert({
    name_text: parsed.data.name || null,
    email_text: parsed.data.email || null,
    message_text: parsed.data.message,
  });

  if (error) {
    redirect("/?feedback=error#feedback");
  }

  redirect("/?feedback=sent#feedback");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ feedback?: string }>;
}) {
  const params = await searchParams;
  const feedbackStatus = params.feedback;

  return (
    <main className="min-h-screen bg-pixa-light text-pixa-ink">
      <section className="relative isolate min-h-[92vh] overflow-hidden bg-pixa-ink text-white">
        <Image
          src="/backgrounds/bg-create-game.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,23,71,0.94),rgba(9,23,71,0.68),rgba(9,23,71,0.18))]" />

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-6xl flex-col px-5 py-6 sm:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-extrabold tracking-normal">
              PIXA
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-bold text-white/80 md:flex">
              <a href="#how">איך זה עובד</a>
              <a href="#faq">שאלות נפוצות</a>
              <a href="#feedback">יצירת קשר</a>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.8fr]">
            <div className="max-w-3xl">
              <p className="text-base font-bold text-white/78">
                המשחק שבו דמיון, יצירתיות ובינה מלאכותית נפגשים
              </p>
              <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[1.08] text-white sm:text-6xl lg:text-7xl">
                PIXA
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-9 text-white/88">
                הפכו את השיעורים לחוויה לימודית עם בינה מלאכותית. PIXA נועד
                ללמד תלמידים כיצד לנסח הנחיות מדויקות וברורות לבינה מלאכותית,
                דרך משחק כיתתי קצר, חי ותחרותי.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/sign-in?next=/pixa/create"
                  className="hidden min-h-12 items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-extrabold text-pixa-btn-dark shadow-lg shadow-black/15 transition hover:bg-white/90 md:inline-flex"
                >
                  כניסת מורים
                </Link>
                <a
                  href="#join"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/50 px-6 py-3 text-base font-extrabold text-white transition hover:bg-white/10"
                >
                  כניסת תלמידים
                </a>
              </div>
              <p className="mt-4 text-sm font-semibold text-white/75 md:hidden">
                יצירת משחק זמינה כרגע במחשב בלבד. תלמידים יכולים להצטרף מהנייד.
              </p>
            </div>

            <div id="join" className="glass-card border border-white/20 bg-white/10 p-5 sm:p-6">
              <p className="text-sm font-bold text-white/70">כניסת תלמידים</p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">יש לך קוד משחק?</h2>
              <form action="/pixa/play" className="mt-5 space-y-3">
                <label className="block text-sm font-bold text-white/80" htmlFor="ids">
                  קוד בן 5 ספרות
                </label>
                <input
                  id="ids"
                  name="ids"
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  placeholder="12345"
                  className="ltr-field min-h-14 w-full rounded-lg border border-white/30 bg-white px-4 text-center text-3xl font-extrabold tracking-[0.2em] text-pixa-ink outline-none ring-pixa-pink transition focus:ring-4"
                />
                <button
                  type="submit"
                  className="min-h-12 w-full rounded-lg bg-pixa-pink px-5 py-3 text-base font-extrabold text-white transition hover:bg-[#c9365d]"
                >
                  להצטרף למשחק
                </button>
              </form>
              <p className="mt-4 text-sm leading-6 text-white/74">
                המורה משתף.ת את הקוד או הקישור בתחילת הפעילות.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold text-pixa-pink">איך המשחק עובד?</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">ארבעה צעדים לכיתה שמדברת פרומפטים</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {howItWorks.map((step, index) => (
              <article key={step.title} className="rounded-lg border border-pixa-ink/10 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pixa-primary text-lg font-extrabold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-xl font-extrabold">{step.title}</h3>
                <p className="mt-3 text-base leading-7 text-pixa-ink/72">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1fr]">
          <div>
            <p className="text-sm font-extrabold text-pixa-purple">למה זה עובד בכיתה?</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              התלמידים רואים מיד איך ניסוח משנה תוצאה
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-pixa-light p-5">
              <p className="text-3xl font-extrabold text-pixa-primary">70%</p>
              <p className="mt-2 font-bold">התאמה ויזואלית לתמונה המקורית</p>
            </div>
            <div className="rounded-lg bg-pixa-light p-5">
              <p className="text-3xl font-extrabold text-pixa-purple">30%</p>
              <p className="mt-2 font-bold">התאמה בין הפרומפטים</p>
            </div>
            <div className="rounded-lg bg-pixa-light p-5">
              <p className="text-3xl font-extrabold text-pixa-pink">2</p>
              <p className="mt-2 font-bold">ניסיונות לשיפור ולמידה</p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">שאלות נפוצות</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-lg border border-pixa-ink/10 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-lg font-extrabold">{faq.question}</summary>
                <p className="mt-3 text-base leading-7 text-pixa-ink/72">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="feedback" className="bg-pixa-ink px-5 py-16 text-white sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="text-sm font-extrabold text-white/65">יצירת קשר ומשוב</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">רוצים להתנסות או לספר לנו משהו?</h2>
            <p className="mt-4 text-lg leading-8 text-white/76">
              ההודעה נשמרת במערכת ונוכל להשתמש בה כדי לשפר את PIXA לקראת הפעילות הבאה.
            </p>
          </div>

          <form action={sendFeedback} className="rounded-lg border border-white/15 bg-white p-5 text-pixa-ink shadow-xl">
            {feedbackStatus === "sent" ? (
              <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                תודה, ההודעה נשמרה בהצלחה.
              </p>
            ) : null}
            {feedbackStatus === "error" ? (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
                לא הצלחנו לשמור את ההודעה. בדקו שמילאתם הודעה ונסו שוב.
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                שם
                <input
                  name="name"
                  className="mt-2 min-h-11 w-full rounded-lg border border-pixa-ink/15 px-3 outline-none ring-pixa-primary/25 transition focus:ring-4"
                />
              </label>
              <label className="block text-sm font-bold">
                אימייל
                <input
                  name="email"
                  type="email"
                  className="ltr-field mt-2 min-h-11 w-full rounded-lg border border-pixa-ink/15 px-3 text-left outline-none ring-pixa-primary/25 transition focus:ring-4"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm font-bold">
              הודעה
              <textarea
                name="message"
                required
                rows={5}
                className="mt-2 w-full rounded-lg border border-pixa-ink/15 px-3 py-3 outline-none ring-pixa-primary/25 transition focus:ring-4"
              />
            </label>
            <button
              type="submit"
              className="mt-4 min-h-12 rounded-lg bg-pixa-primary px-7 py-3 font-extrabold text-white transition hover:bg-[#0103ad]"
            >
              שליחת משוב
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
