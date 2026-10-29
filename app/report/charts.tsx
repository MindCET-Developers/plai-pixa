// Plain HTML/CSS charts for the server-rendered usage report. Bars carry a
// native tooltip (title); time and category axes read left to right.

const fmt = new Intl.NumberFormat("he-IL");

export type Bar = { label: string; value: number; title: string; muted?: boolean };

export function BarChart({ bars, labelEvery = 1 }: { bars: Bar[]; labelEvery?: number }) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  const showValues = bars.length <= 12;

  return (
    <div dir="ltr" className="mt-2">
      <div className="flex h-40 items-end gap-1 border-b border-pixa-ink/20">
        {bars.map((bar) => (
          <div key={bar.label} title={bar.title} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            {showValues && <span className="mb-1 text-[11px] tabular-nums text-pixa-ink/70">{fmt.format(bar.value)}</span>}
            <div
              className={`w-full max-w-8 rounded-t-[4px] ${bar.muted ? "bg-pixa-ink/20" : "bg-pixa-primary"}`}
              style={{ height: `${(bar.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {bars.map((bar, index) => (
          <span key={bar.label} className="min-w-0 flex-1 truncate text-center text-[11px] text-pixa-ink/60">
            {index % labelEvery === 0 ? bar.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export type Segment = { label: string; value: number; className: string };

export function SplitBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const pct = new Intl.NumberFormat("he-IL", { style: "percent", maximumFractionDigits: 0 });

  return (
    <div className="mt-2 grid gap-2">
      <div dir="ltr" className="flex h-7 gap-px overflow-hidden rounded-md">
        {segments.map((segment) => (
          <div
            key={segment.label}
            title={`${segment.label}: ${fmt.format(segment.value)}`}
            className={segment.className}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-pixa-ink/70">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-sm ${segment.className}`} />
            {segment.label}
            <b className="font-bold tabular-nums text-pixa-ink">{fmt.format(segment.value)}</b>
            <span className="tabular-nums">({pct.format(segment.value / total)})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Day = { day: string; players: number; games: number; submissions: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const parseDay = (day: string) => Date.parse(`${day}T00:00:00Z`);
const shortDate = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("he-IL", { month: "short", timeZone: "UTC" });

// Players per day over the whole period, with the pre-launch pilot and any
// marked ranges (e.g. an outage) shaded behind the bars.
export function DailyChart({
  days,
  launchDay,
  bands,
}: {
  days: Day[];
  launchDay: string;
  bands: { from: string; to: string; label: string }[];
}) {
  if (days.length === 0) return null;
  const byDay = new Map(days.map((day) => [day.day, day]));
  const start = parseDay(days[0].day);
  const end = parseDay(days[days.length - 1].day);
  const count = Math.round((end - start) / DAY_MS) + 1;
  const series = Array.from({ length: count }, (_, i) => {
    const key = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    return byDay.get(key) ?? { day: key, players: 0, games: 0, submissions: 0 };
  });
  const max = Math.max(1, ...series.map((day) => day.players));
  const at = (day: string) => `${(Math.max(0, (parseDay(day) - start) / DAY_MS) / count) * 100}%`;
  const width = (from: string, to: string) => `${(((parseDay(to) - parseDay(from)) / DAY_MS + 1) / count) * 100}%`;
  const months = series.filter((day) => day.day.endsWith("-01"));

  return (
    <div dir="ltr" className="mt-2">
      <div className="relative h-64 border-b border-pixa-ink/20 pt-6">
        <div className="absolute inset-y-0 left-0 bg-pixa-ink/5" style={{ width: at(launchDay) }}>
          <span className="absolute top-0 left-1 text-[11px] text-pixa-ink/60">פיילוט</span>
        </div>
        <div className="absolute inset-y-0 border-l border-dashed border-pixa-ink/40" style={{ left: at(launchDay) }}>
          <span className="absolute top-0 left-1 text-[11px] whitespace-nowrap text-pixa-ink/60">השקה</span>
        </div>
        {bands.map((band) => (
          <div
            key={band.from}
            className="absolute inset-y-0 bg-pixa-pink/10"
            style={{ left: at(band.from), width: width(band.from, band.to) }}
          >
            <span className="absolute top-0 right-1 text-[11px] whitespace-nowrap text-pixa-pink">{band.label}</span>
          </div>
        ))}
        <div className="relative flex h-full items-end gap-px">
          {series.map((day) => (
            <div
              key={day.day}
              title={`${shortDate.format(parseDay(day.day))}: ${fmt.format(day.players)} שחקנים, ${fmt.format(day.games)} משחקים, ${fmt.format(day.submissions)} הגשות`}
              className="flex h-full min-w-0 flex-1 items-end"
            >
              <div
                className={`w-full rounded-t-[2px] ${day.day < launchDay ? "bg-pixa-ink/25" : "bg-pixa-primary"}`}
                style={{ height: `${(day.players / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="relative h-5">
        {months.map((day) => (
          <span key={day.day} className="absolute top-1 text-[11px] text-pixa-ink/60" style={{ left: at(day.day) }}>
            {monthName.format(parseDay(day.day))}
          </span>
        ))}
      </div>
      <p className="text-xs text-pixa-ink/60">שיא יומי: {fmt.format(max)} שחקנים</p>
    </div>
  );
}
