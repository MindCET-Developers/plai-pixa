/**
 * Imports Arabic translations from the original Bubble app's CSV into lib/i18n/ar.json.
 *
 * Usage:  npx tsx scripts/import-translations.ts [path/to/translations.csv]
 * Default CSV path: ../data/translations.csv (the shared data folder next to pixa-app).
 *
 * Supported CSV shapes (headers detected automatically):
 *   1. key,he,ar            — key is a dot path like "play.myScore"
 *   2. he,ar (or עברית/ערבית/العربية headers, any order) — rows are matched to
 *      dictionary keys by comparing the Hebrew text against he.ts leaf values.
 */
import fs from "node:fs";
import path from "node:path";
import { he } from "../lib/i18n/he";

const csvPath = path.resolve(
  process.argv[2] ?? path.join(__dirname, "..", "..", "data", "translations.csv")
);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** Flattens he dict into { "play.myScore": "הציון שלי..." } */
function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[p] = v;
    else if (v && typeof v === "object")
      Object.assign(out, flatten(v as Record<string, unknown>, p));
  }
  return out;
}

function setDeep(obj: Record<string, unknown>, dotPath: string, value: string) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] ?? {};
    cur = cur[parts[i]] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function main() {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    console.error("Place translations.csv in the data/ folder or pass a path.");
    process.exit(1);
  }
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  if (rows.length < 2) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }

  const header = rows[0].map((h) => norm(h).toLowerCase());
  const findCol = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h.includes(n)));

  const keyCol = findCol("key", "מפתח");
  const heCol = findCol("he", "עברית", "hebrew");
  const arCol = findCol("ar", "ערבית", "العربية", "arabic");
  if (arCol === -1) {
    console.error(`Could not detect the Arabic column. Headers: ${header.join(", ")}`);
    process.exit(1);
  }

  const flatHe = flatten(he as unknown as Record<string, unknown>);
  const heTextToKey = new Map<string, string>();
  for (const [k, v] of Object.entries(flatHe)) heTextToKey.set(norm(v), k);

  const ar: Record<string, unknown> = {};
  let matched = 0;
  const unmatched: string[] = [];

  for (const row of rows.slice(1)) {
    const arText = norm(row[arCol] ?? "");
    if (!arText) continue;

    let key = keyCol !== -1 ? norm(row[keyCol] ?? "") : "";
    if (!key && heCol !== -1) key = heTextToKey.get(norm(row[heCol] ?? "")) ?? "";
    if (!key || !(key in flatHe)) {
      unmatched.push(heCol !== -1 ? row[heCol] : row.join(","));
      continue;
    }
    setDeep(ar, key, arText);
    matched++;
  }

  const outPath = path.join(__dirname, "..", "lib", "i18n", "ar.json");
  fs.writeFileSync(outPath, JSON.stringify(ar, null, 2) + "\n", "utf8");
  console.log(`✔ Wrote ${matched} Arabic translations to lib/i18n/ar.json`);
  if (unmatched.length) {
    console.warn(`⚠ ${unmatched.length} rows did not match any dictionary key:`);
    unmatched.slice(0, 15).forEach((u) => console.warn(`  - ${u}`));
    if (unmatched.length > 15) console.warn(`  ... and ${unmatched.length - 15} more`);
  }
}

main();
