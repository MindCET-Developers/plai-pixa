import { z } from "zod";

export class AIJsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIJsonParseError";
  }
}

export function parseJsonFromModel<T>(text: string, schema: z.ZodSchema<T>): T {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  const candidate =
    start === -1 || end === -1 ? withoutFence : withoutFence.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    throw new AIJsonParseError(`AI response was not valid JSON: ${(error as Error).message}`);
  }

  return schema.parse(parsed);
}

export function clampScore(value: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}
