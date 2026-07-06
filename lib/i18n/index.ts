import { he, type HeDict } from "./he";
import arOverrides from "./ar.json";

export type Lang = "he" | "ar";

/** Deep value type: every leaf becomes string (Arabic may override any Hebrew leaf). */
type DeepPartialStrings<T> = {
  [K in keyof T]?: T[K] extends string ? string : DeepPartialStrings<T[K]>;
};

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  overrides: DeepPartialStrings<T>
): T {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const o = overrides[key];
    if (o === undefined || o === "") continue;
    const b = base[key];
    out[key as string] =
      typeof b === "object" && b !== null
        ? deepMerge(
            b as Record<string, unknown>,
            o as DeepPartialStrings<Record<string, unknown>>
          )
        : o;
  }
  return out as T;
}

/**
 * Returns the dictionary for a language.
 * Arabic falls back to Hebrew for any phrase missing from ar.json
 * (ar.json is generated from the original app's CSV by scripts/import-translations.ts).
 */
export function getDict(lang: Lang): HeDict {
  if (lang === "ar") {
    return deepMerge(he as unknown as Record<string, unknown>, arOverrides) as HeDict;
  }
  return he;
}

export function dirFor(lang: Lang): "rtl" {
  // Both Hebrew and Arabic are RTL.
  return "rtl";
}

/** Interpolates {placeholders}, e.g. t(dict.play.myScore, { score: 91 }) */
export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}
