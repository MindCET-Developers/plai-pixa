/**
 * Imports the closed PIXA image bank exported from Bubble into Supabase.
 *
 * Usage:
 *   npm run import:images
 *   npm run import:images -- --dry-run
 *   npm run import:images -- ../data/image-bank.csv
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { createAdminClient } from "../lib/supabase/admin";
import type { Database } from "../lib/supabase/database.types";

loadEnvConfig(path.join(__dirname, ".."));

type ImageLevel = Database["public"]["Enums"]["images_level"];
type ImageInsert = Database["public"]["Tables"]["images"]["Insert"];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const csvArg = args.find((arg) => !arg.startsWith("--"));
const csvPath = path.resolve(
  csvArg ?? path.join(__dirname, "..", "..", "data", "image-bank.csv")
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
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const keyNorm = (s: string) => norm(s).toLowerCase().replace(/[_ -]/g, "");

function headerIndex(headers: string[], ...names: string[]) {
  const wanted = names.map(keyNorm);
  return headers.findIndex((h) => wanted.some((name) => keyNorm(h).includes(name)));
}

function normalizeBubbleUrl(value: string) {
  const url = norm(value);
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return `https://${url.slice("http://".length)}`;
  return url;
}

function parseLevel(value: string): ImageLevel {
  const v = norm(value).toLowerCase();
  if (v.includes("advanced") || v.includes("מתקדמים")) return "advanced";
  if (v.includes("expert") || v.includes("מומחים")) return "experts";
  if (v.includes("mine") || v.includes("שלי")) return "mine";
  return "beginners";
}

function parseBoolean(value: string, fallback: boolean) {
  const v = norm(value).toLowerCase();
  if (!v) return fallback;
  return ["true", "yes", "1", "כן", "y"].includes(v);
}

function toImages(rows: string[][]): ImageInsert[] {
  if (rows.length < 2) return [];

  const headers = rows[0];
  const promptCol = headerIndex(headers, "prompt");
  const urlCol = headerIndex(headers, "url", "image_url");
  const picCol = headerIndex(headers, "pic", "image", "image_url");
  const levelCol = headerIndex(headers, "level");
  const sourceCol = headerIndex(headers, "source");
  const backCol = headerIndex(headers, "back");

  if (promptCol === -1) throw new Error(`Could not find prompt column in: ${headers.join(", ")}`);
  if (urlCol === -1 && picCol === -1) {
    throw new Error(`Could not find url/pic column in: ${headers.join(", ")}`);
  }

  return rows.slice(1).flatMap((row) => {
    const url = normalizeBubbleUrl(row[urlCol] ?? row[picCol] ?? "");
    const pic = normalizeBubbleUrl(row[picCol] ?? url);
    const prompt = norm(row[promptCol] ?? "");
    if (!url || !prompt) return [];

    return {
      url_text: url,
      pic_image: pic || url,
      prompt_text: prompt,
      level_option_images_level: levelCol === -1 ? "beginners" : parseLevel(row[levelCol] ?? ""),
      source_boolean: sourceCol === -1 ? true : parseBoolean(row[sourceCol] ?? "", true),
      back_boolean: backCol === -1 ? false : parseBoolean(row[backCol] ?? "", false),
    };
  });
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const images = toImages(parseCsv(fs.readFileSync(csvPath, "utf8")));
  const counts = images.reduce<Record<ImageLevel, number>>(
    (acc, image) => {
      acc[image.level_option_images_level ?? "beginners"]++;
      return acc;
    },
    { beginners: 0, advanced: 0, experts: 0, mine: 0 }
  );

  console.log(`Parsed ${images.length} PIXA images from ${csvPath}`);
  console.log(`Levels: ${JSON.stringify(counts)}`);

  if (dryRun) return;
  if (!images.length) throw new Error("No valid image rows found.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("images")
    .upsert(images, { onConflict: "url_text" });

  if (error) throw error;
  console.log(`Imported ${images.length} images into Supabase.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
