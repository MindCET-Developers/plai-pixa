import { z } from "zod";
import { clampScore } from "./json";

export const moderationResultSchema = z.object({
  flag: z.enum(["yes", "no"]),
  translated_prompt: z.string().min(1),
});

export type ModerationResult = z.infer<typeof moderationResultSchema>;

export const scoreResultSchema = z
  .object({
    feedback: z.string().min(1),
    image_comparison_score: z.coerce.number(),
    prompt_comparison_score: z.coerce.number(),
    score_breakdown: z.string().min(1),
    score: z.coerce.string(),
  })
  .transform((result) => {
    const imageScore = clampScore(result.image_comparison_score, 70);
    const promptScore = clampScore(result.prompt_comparison_score, 30);
    const total = imageScore + promptScore;

    return {
      ...result,
      image_comparison_score: imageScore,
      prompt_comparison_score: promptScore,
      score: String(total),
    };
  });

export type ScoreResult = z.infer<typeof scoreResultSchema>;

export const teacherImagePromptSchema = z.object({
  prompt: z.string().min(1),
});

export const translationSchema = z.object({
  translated_prompt: z.string().min(1),
});

export const runwareImageSchema = z.object({
  taskType: z.string(),
  taskUUID: z.string(),
  imageUUID: z.string().optional(),
  imageURL: z.string().url(),
  NSFWContent: z.boolean().optional(),
});

export type RunwareImage = z.infer<typeof runwareImageSchema>;
