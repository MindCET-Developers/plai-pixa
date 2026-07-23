import { z } from "zod";

export class AIJsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIJsonParseError";
  }
}

const CONTROL_CHAR_ESCAPES: Record<string, string> = {
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
};

function escapeRawControlCharsInStrings(candidate: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const char of candidate) {
    if (inString && !escaped && CONTROL_CHAR_ESCAPES[char]) {
      result += CONTROL_CHAR_ESCAPES[char];
      continue;
    }

    result += char;

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
    }
  }

  return result;
}

function repairTruncatedJson(candidate: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (const char of candidate) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      stack.push(char === "{" ? "}" : "]");
    } else if (char === "}" || char === "]") {
      stack.pop();
    }
  }

  let repaired = candidate;
  if (inString) repaired += '"';
  while (stack.length > 0) {
    repaired += stack.pop();
  }
  return repaired;
}

export function parseJsonFromModel<T>(text: string, schema: z.ZodSchema<T>): T {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  const rawCandidate =
    start === -1 || end === -1 ? withoutFence : withoutFence.slice(start, end + 1);
  const candidate = escapeRawControlCharsInStrings(rawCandidate);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (firstError) {
    try {
      parsed = JSON.parse(repairTruncatedJson(candidate));
    } catch {
      throw new AIJsonParseError(
        `AI response was not valid JSON: ${(firstError as Error).message}`,
      );
    }
  }

  return schema.parse(parsed);
}

export function clampScore(value: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}
