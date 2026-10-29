export type AiProvider = "openrouter" | "runware";
export type AiOperation = "moderation" | "scoring" | "student_image" | "teacher_prompt" | "teacher_image";

// One paid provider call. costUsd is what the provider reported, or null if it reported none.
export type AiUsageEntry = {
  provider: AiProvider;
  operation: AiOperation;
  model: string;
  costUsd: number | null;
};

export type AiUsageSink = (entry: AiUsageEntry) => void;

export function readCost(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
