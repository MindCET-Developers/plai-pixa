import type { Metadata } from "next";
import Link from "next/link";
import { getReportAccess, getUsageReport, REPORT_LAUNCH_DAY, type ReportAccess } from "@/lib/pixa/report";
import { getVercelUsage, type VercelUsage } from "@/lib/pixa/vercelUsage";
import { BarChart, DailyChart, SplitBar } from "./charts";

export const metadata: Metadata = {
  title: "דוח שימוש PIXA",
  robots: { index: false, follow: false },
};

// Submissions were not saved in this window (most likely a Runware outage).
const OUTAGE = { from: "2026-10-13", to: "2026-10-25" };
// Spend from July 2026 until per-call tracking began, read from the providers on 2026-10-29:
// the PIXA key's OpenRouter usage, and Runware credit used per its billing history (until
// 2026-09-10 that also covers the old Bubble app). perAttempt is one student attempt
// (moderation + image + scoring) as measured that day.
const PRE_TRACKING_COSTS = { openrouter: 4.16, runware: 23.5, perAttempt: 0.0046 };

const num = new Intl.NumberFormat("he-IL");
const pct = new Intl.NumberFormat("he-IL", { style: "percent", maximumFractionDigits: 0 });
const usd = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);
const longDate = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", timeZone: "UTC" });
const asDate = (day: string) => new Date(`${day.slice(0, 10)}T00:00:00Z`);
const share = (part: number, whole: number) => (whole > 0 ? pct.format(part / whole) : "—");

const WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const WEEKDAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const LEVELS: Record<string, string> = { beginners: "מתחילים", advanced: "מתקדמים", experts: "מומחים", mine: "של המורה" };

export default async function ReportPage() {
  const access = await getReportAccess();
  if (access.status !== "ok") return <ReportGate access={access} />;

  const [report, vercel] = await Promise.all([getUsageReport(), getVercelUsage()]);
  const { summary: s, costs } = report;
  const devicesTotal = Object.values(report.devices).reduce((sum, value) => sum + value, 0);
  const hoursTotal = report.hours.reduce((sum, row) => sum + row.players, 0);
  const schoolHours = report.hours.filter((row) => row.hour >= 8 && row.hour < 15).reduce((sum, row) => sum + row.players, 0);
  const peakWeek = report.weekly.reduce((top, week) => (week.players > (top?.players ?? -1) ? week : top), report.weekly[0]);
  const busiestDay = report.weekdays.reduce((top, day) => (day.players > (top?.players ?? -1) ? day : top), report.weekdays[0]);
  const starsTotal = report.stars.reduce((sum, row) => sum + row.students, 0);
  const starCount = (stars: number) => report.stars.find((row) => row.stars === stars)?.students ?? 0;
  const levelsTotal = Object.values(report.levels).reduce((sum, value) => sum + value, 0);
  const hourBars = Array.from({ length: 24 }, (_, hour) => {
    const players = report.hours.find((row) => row.hour === hour)?.players ?? 0;
    const label = String(hour).padStart(2, "0");
    return { label, value: players, title: `${label}:00 — ${num.format(players)} הצטרפויות`, muted: hour < 8 || hour >= 15 };
  });

  return (
    <main className="min-h-screen bg-pixa-light px-4 py-8 text-pixa-ink sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-10">
        <header className="grid gap-3">
          <Link href="/" className="text-sm font-extrabold text-pixa-primary">
            PIXA · plai.mindcet.io
          </Link>
          <h1 className="text-4xl font-extrabold sm:text-5xl">דוח שימוש PIXA</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-pixa-ink/80">
            מאז ההשקה ב-{longDate.format(asDate(REPORT_LAUNCH_DAY))} הצטרפו <b>{num.format(s.players)}</b> שחקנים ל-
            <b>{num.format(s.started)}</b> משחקים של <b>{num.format(s.teachers)}</b> מורים.
            {peakWeek && (
              <>
                {" "}
                השבוע העמוס ביותר התחיל ב-{shortDate.format(asDate(peakWeek.week_start))}, עם <b>{num.format(peakWeek.players)}</b>{" "}
                שחקנים.
              </>
            )}
          </p>
          <p className="text-sm text-pixa-ink/60">הנתונים מתעדכנים בכל טעינה של הדף. שעות ותאריכים לפי שעון ישראל.</p>
        </header>

        <section aria-label="נתונים מרכזיים" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Tile label="שחקנים שהצטרפו" value={num.format(s.players)} note={`חציון ${num.format(s.median_players ?? 0)} שחקנים למשחק`} />
          <Tile label="משחקים שהתחילו" value={num.format(s.started)} note={`${share(s.started, s.games)} מתוך ${num.format(s.games)} שנוצרו`} />
          <Tile label="מורים" value={num.format(s.teachers)} note={`${num.format(s.teachers_returning)} חזרו ביום נוסף`} />
          <Tile label="הגשות של תלמידים" value={num.format(s.submissions)} note={`${share(s.second_tries, s.submissions)} השתמשו בניסיון השני`} />
          <Tile label="דירוג ממוצע" value={s.avg_stars?.toFixed(2) ?? "—"} note={`לפי ${num.format(s.reviews)} דירוגים`} />
        </section>

        <Section title="שחקנים לפי יום">
          <Card note="כל עמודה היא יום. האזור האפור הוא תקופת הפיילוט שלפני ההשקה, והאזור הוורוד הוא התקופה שבה הגשות לא נשמרו.">
            <DailyChart
              days={report.daily}
              launchDay={REPORT_LAUNCH_DAY}
              bands={[{ ...OUTAGE, label: "הגשות לא נשמרו" }]}
            />
          </Card>
          <div className="rounded-2xl border border-pixa-pink/30 bg-white p-5">
            <h3 className="font-extrabold text-pixa-pink">הגשות שלא נשמרו</h3>
            <p className="mt-1 leading-relaxed text-pixa-ink/80">
              בין {shortDate.format(asDate(OUTAGE.from))} ל-{shortDate.format(asDate(OUTAGE.to))} תלמידים שיחקו, אבל ההגשות שלהם לא נשמרו,
              כנראה בגלל תקלה בשירות יצירת התמונות (Runware). לכן מספרי ההגשות והציונים נמוכים מהשימוש בפועל. מאז, כל הגשה שנכשלת נרשמת
              {report.failures > 0 ? `, ומאז ההשקה נרשמו ${num.format(report.failures)} כאלה.` : "."}
            </p>
          </div>
        </Section>

        <Section title="פירוט שבועי">
          <Card note="שבוע מתחיל ביום ראשון. בשבוע הראשון נספרו רק הימים מיום ההשקה, והשבוע האחרון עוד לא הסתיים.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="text-right text-xs text-pixa-ink/60">
                    {["שבוע", "משחקים שנוצרו", "התחילו", "מורים", "שחקנים", "הגשות"].map((heading) => (
                      <th key={heading} scope="col" className="border-b border-pixa-ink/15 px-3 py-2 font-bold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.weekly.map((week) => (
                    <tr key={week.week_start}>
                      <td className="border-b border-pixa-ink/10 px-3 py-2">{shortDate.format(asDate(week.week_start))}</td>
                      <td className="border-b border-pixa-ink/10 px-3 py-2">{num.format(week.games)}</td>
                      <td className="border-b border-pixa-ink/10 px-3 py-2">{num.format(week.started)}</td>
                      <td className="border-b border-pixa-ink/10 px-3 py-2">{num.format(week.teachers)}</td>
                      <td className="border-b border-pixa-ink/10 px-3 py-2">{num.format(week.players)}</td>
                      <td
                        className={`border-b border-pixa-ink/10 px-3 py-2 ${week.submissions === 0 && week.players > 0 ? "font-bold text-pixa-pink" : ""}`}
                      >
                        {num.format(week.submissions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        <Section title="מתי משחקים">
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="לפי שעה ביום" note={`${share(schoolHours, hoursTotal)} מההצטרפויות היו בשעות הלימודים, בין 8:00 ל-15:00.`}>
              <BarChart bars={hourBars} labelEvery={3} />
            </Card>
            <Card title="לפי יום בשבוע" note={busiestDay ? `היום העמוס ביותר: יום ${WEEKDAY_NAMES[busiestDay.dow]}.` : undefined}>
              <BarChart
                bars={Array.from({ length: 7 }, (_, dow) => {
                  const players = report.weekdays.find((row) => row.dow === dow)?.players ?? 0;
                  return { label: WEEKDAYS[dow], value: players, title: `יום ${WEEKDAY_NAMES[dow]}: ${num.format(players)} הצטרפויות` };
                })}
              />
            </Card>
          </div>
        </Section>

        <Section title="איך משחקים">
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              title="גודל משחק"
              note={`במשחק הגדול ביותר היו ${num.format(s.max_players ?? 0)} שחקנים. משחקים עם שחקן אחד הם כנראה בדיקות של מורים.`}
            >
              <BarChart
                bars={report.game_sizes.map((row) => ({
                  label: row.bucket,
                  value: row.games,
                  title: `${row.bucket} שחקנים: ${num.format(row.games)} משחקים`,
                  muted: row.bucket === "1",
                }))}
              />
            </Card>
            <Card title="ציוני ההגשות" note={`ציון ממוצע ${s.avg_score ?? "—"} מתוך 100.`}>
              <BarChart
                labelEvery={2}
                bars={report.scores.map((row) => ({
                  label: `${row.upper - 10}–${row.upper}`,
                  value: row.submissions,
                  title: `ציון ${row.upper - 10}–${row.upper}: ${num.format(row.submissions)} הגשות`,
                }))}
              />
            </Card>
            <Card title="מכשירים" note={`${share(report.devices.desktop ?? 0, devicesTotal)} מהשחקנים שיחקו ממחשב.`}>
              <SplitBar
                segments={[
                  { label: "מחשב", value: report.devices.desktop ?? 0, className: "bg-pixa-primary" },
                  { label: "טלפון", value: report.devices.mobile ?? 0, className: "bg-pixa-purple" },
                  { label: "טאבלט", value: report.devices.tablet ?? 0, className: "bg-pixa-pink" },
                ]}
              />
            </Card>
            <Card
              title="רמת התמונות במשחקים"
              note={`${share(report.levels.beginners ?? 0, levelsTotal)} מהתמונות שמורים בחרו הן מרמת מתחילים.`}
            >
              <BarChart
                bars={Object.keys(LEVELS).map((level) => ({
                  label: LEVELS[level],
                  value: report.levels[level] ?? 0,
                  title: `${LEVELS[level]}: ${num.format(report.levels[level] ?? 0)} תמונות`,
                }))}
              />
            </Card>
          </div>
        </Section>

        <Section title="מורים ושביעות רצון">
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="כמה משחקים כל מורה יצר" note={`המורה הפעיל ביותר יצר ${num.format(s.top_teacher_games ?? 0)} משחקים.`}>
              <SplitBar
                segments={[
                  { label: "4 ומעלה", value: s.teachers_four_plus, className: "bg-pixa-primary" },
                  { label: "2–3", value: s.teachers_two_three, className: "bg-pixa-purple" },
                  { label: "משחק אחד", value: s.teachers_one_game, className: "bg-pixa-ink/25" },
                ]}
              />
            </Card>
            <Card
              title="דירוגי תלמידים"
              note={`התלמידים מדרגים בקצוות: ${share(starCount(5), starsTotal)} נתנו 5 כוכבים ו-${share(starCount(1), starsTotal)} נתנו כוכב אחד.`}
            >
              <BarChart
                bars={report.stars.map((row) => ({
                  label: `${row.stars}★`,
                  value: row.students,
                  title: `${row.stars} כוכבים: ${num.format(row.students)} תלמידים, ${num.format(row.teachers)} מורים`,
                  muted: row.stars !== 1 && row.stars !== 5,
                }))}
              />
            </Card>
          </div>
        </Section>

        <Section title="עלויות AI">
          <h3 className="text-lg font-extrabold">מיולי ועד תחילת המעקב</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile
              label="סך הכול"
              value={usd(PRE_TRACKING_COSTS.openrouter + PRE_TRACKING_COSTS.runware, 0)}
              note="בערך, לפי החשבונות בשני השירותים"
            />
            <Tile
              label="Runware (תמונות)"
              value={usd(PRE_TRACKING_COSTS.runware, 1)}
              note={`בערך, לפי היסטוריית החיובים. ${share(PRE_TRACKING_COSTS.runware, PRE_TRACKING_COSTS.openrouter + PRE_TRACKING_COSTS.runware)} מהעלות`}
            />
            <Tile
              label="OpenRouter (טקסט וציון)"
              value={usd(PRE_TRACKING_COSTS.openrouter)}
              note="בדיוק, לפי המפתח של PIXA"
            />
            <Tile label="לכל ניסיון של תלמיד" value={usd(PRE_TRACKING_COSTS.perAttempt, 4)} note="תמונה, בדיקת תוכן וציון" />
          </div>
          <p className="text-sm text-pixa-ink/60">
            עד ההשקה ב-{shortDate.format(asDate(REPORT_LAUNCH_DAY))}, הסכום של Runware כולל גם את האפליקציה הקודמת. יצירת התמונה היא 80% מהעלות של
            כל ניסיון.
          </p>

          <h3 className="mt-2 text-lg font-extrabold">מאז תחילת המעקב</h3>
          {costs.tracked_since ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile label="סך הכול" value={usd(costs.total)} note={`מ-${shortDate.format(new Date(costs.tracked_since))}`} />
              <Tile label="Runware (תמונות)" value={usd(costs.runware)} note={`${share(costs.runware, costs.total)} מהעלות`} />
              <Tile label="OpenRouter (טקסט וציון)" value={usd(costs.openrouter)} note={`${share(costs.openrouter, costs.total)} מהעלות`} />
              <Tile
                label="לכל ניסיון של תלמיד"
                value={costs.student_attempts > 0 ? usd(costs.student_cost / costs.student_attempts, 4) : "—"}
                note={`לפי ${num.format(costs.student_attempts)} ניסיונות`}
              />
            </div>
          ) : (
            <Card note="כאן יופיעו העלויות המדויקות של כל קריאה, החל מהפריסה של מעקב העלויות. עד עכשיו לא נרשמו קריאות." />
          )}
        </Section>

        <Section title="שימוש ב-Vercel">
          <VercelSection usage={vercel} />
        </Section>

        <section className="grid gap-2 text-sm text-pixa-ink/70">
          <h2 className="text-lg font-extrabold text-pixa-ink">איך נספרו הנתונים</h2>
          <ul className="grid gap-1">
            <li>
              <b className="text-pixa-ink">שחקן</b> הוא הצטרפות של תלמיד למשחק. תלמיד ששיחק בשני משחקים נספר פעמיים.
            </li>
            <li>
              <b className="text-pixa-ink">הגשה</b> היא ההנחיה האחרונה של תלמיד לכל תמונה. ניסיון שני מחליף את הראשון.
            </li>
            <li>
              <b className="text-pixa-ink">מורים</b> הם מורים שיצרו לפחות משחק אחד. חלק מהמשחקים הם בדיקות של צוות MindCET.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

const gb = (bytes: number) => `${new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(bytes / 1e9)} GB`;

function VercelSection({ usage }: { usage: VercelUsage }) {
  if (usage.status === "not_configured") {
    return (
      <Card note="כדי להציג כאן את השימוש ב-Vercel, צריך להגדיר בפרויקט ב-Vercel את משתנה הסביבה VERCEL_USAGE_TOKEN עם טוקן שיש לו גישת קריאה לצוות." />
    );
  }
  if (usage.status === "error") {
    return <Card note="לא הצלחנו לקבל כרגע את נתוני השימוש מ-Vercel. נסו לרענן בעוד כמה דקות." />;
  }

  const { project, team } = usage;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="בקשות" value={num.format(project.requests)} note={`${share(project.requests, team.requests)} מכל הצוות`} />
        <Tile label="תעבורה יוצאת" value={gb(project.bandwidthBytes)} note={`${share(project.bandwidthBytes, team.bandwidthBytes)} מכל הצוות`} />
        <Tile label="הפעלות של פונקציות" value={num.format(project.invocations)} note={`${share(project.invocations, team.invocations)} מכל הצוות`} />
        <Tile
          label="זמן ריצה של פונקציות"
          value={`${new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(project.gbHours)} GB-h`}
          note={`${share(project.gbHours, team.gbHours)} מכל הצוות`}
        />
      </div>
      <Card title="בקשות לפי יום" note="של PIXA בלבד, ב-30 הימים האחרונים.">
        <BarChart
          labelEvery={5}
          bars={usage.days.map((day) => ({
            label: shortDate.format(asDate(day.day)),
            value: day.requests,
            title: `${shortDate.format(asDate(day.day))}: ${num.format(day.requests)} בקשות, ${gb(day.bandwidthBytes)}, ${num.format(day.invocations)} הפעלות`,
          }))}
        />
      </Card>
      <p className="text-sm text-pixa-ink/60">
        30 הימים האחרונים. הצוות ב-Vercel בתוכנית Hobby החינמית, והמכסות החודשיות שלה משותפות לכל הפרויקטים בצוות. Vercel מדווח לכל יום את
        הסכום של כל הצוות ואת החלק של כל פרויקט באחוזים שלמים, ולכן המספרים של PIXA מקורבים. מתעדכן פעם בשעה.
      </p>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function Card({ title, note, children }: { title?: string; note?: string; children?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-pixa-ink/10 bg-white p-5">
      {title && <h3 className="text-lg font-extrabold">{title}</h3>}
      {note && <p className="mt-1 text-sm text-pixa-ink/70">{note}</p>}
      {children}
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="grid content-start gap-1 rounded-2xl border border-pixa-ink/10 bg-white p-4">
      <span className="text-sm font-bold text-pixa-ink/60">{label}</span>
      <span className="text-3xl font-extrabold tabular-nums">{value}</span>
      <span className="text-xs text-pixa-ink/60">{note}</span>
    </div>
  );
}

function ReportGate({ access }: { access: Exclude<ReportAccess, { status: "ok" }> }) {
  return (
    <main className="flex min-h-screen items-center bg-pixa-light px-4 py-10 text-pixa-ink">
      <div className="mx-auto grid w-full max-w-lg gap-4 rounded-2xl border border-pixa-ink/10 bg-white p-8">
        <p className="text-sm font-extrabold text-pixa-primary">PIXA</p>
        <h1 className="text-3xl font-extrabold">דוח שימוש PIXA</h1>
        {access.status === "forbidden" ? (
          <p className="text-lg text-pixa-ink/80">
            החשבון {access.email} לא יכול לפתוח את הדוח. הדוח פתוח רק למי שמתחבר עם חשבון Google של MindCET.
          </p>
        ) : (
          <p className="text-lg text-pixa-ink/80">כדי לראות את הדוח צריך להתחבר עם חשבון Google של MindCET.</p>
        )}
        <div className="flex flex-wrap gap-3">
          {access.status === "signed_out" ? (
            // A plain link: the sign-in route redirects to Google, which a client-side Link prefetch can't follow.
            <a href="/auth/sign-in?next=/report" className="rounded-full bg-pixa-primary px-6 py-3 font-bold text-white">
              כניסה עם Google
            </a>
          ) : (
            <form action="/auth/sign-out" method="post">
              <button type="submit" className="rounded-full bg-pixa-primary px-6 py-3 font-bold text-white">
                התנתקות והחלפת חשבון
              </button>
            </form>
          )}
          <Link href="/" className="rounded-full border border-pixa-ink/20 px-6 py-3 font-bold">
            חזרה
          </Link>
        </div>
      </div>
    </main>
  );
}
