import { getOpenRouterEnv } from "../supabase/env";
import { AIJsonParseError, parseJsonFromModel } from "./json";
import {
  moderationResultSchema,
  scoreResultSchema,
  teacherImagePromptSchema,
  translationSchema,
  type ModerationResult,
  type ScoreResult,
} from "./schemas";

type TextContent = { type: "text"; text: string };
type ImageContent = { type: "image_url"; image_url: { url: string } };
type MessageContent = string | Array<TextContent | ImageContent>;

type ChatMessage = {
  role: "system" | "user";
  content: MessageContent;
};

type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

async function chatCompletion({
  messages,
  model,
  jsonSchema,
  maxTokens = 500,
}: {
  messages: ChatMessage[];
  model: string;
  jsonSchema?: JsonSchema;
  maxTokens?: number;
}) {
  const env = getOpenRouterEnv();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.siteUrl,
      "X-OpenRouter-Title": env.appTitle,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
      ...(jsonSchema
        ? {
            response_format: {
              type: "json_schema",
              json_schema: {
                name: jsonSchema.name,
                strict: true,
                schema: jsonSchema.schema,
              },
            },
          }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${await response.text()}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter response did not include text content.");
  }
  return content;
}

const moderationJsonSchema = {
  name: "pixa_prompt_moderation",
  schema: {
    type: "object",
    properties: {
      flag: { type: "string", enum: ["yes", "no"] },
      translated_prompt: { type: "string" },
    },
    required: ["flag", "translated_prompt"],
    additionalProperties: false,
  },
};

const scoreJsonSchema = {
  name: "pixa_score",
  schema: {
    type: "object",
    properties: {
      feedback: { type: "string" },
      image_comparison_score: { type: "number" },
      prompt_comparison_score: { type: "number" },
      score_breakdown: { type: "string" },
      score: { type: "string" },
    },
    required: [
      "feedback",
      "image_comparison_score",
      "prompt_comparison_score",
      "score_breakdown",
      "score",
    ],
    additionalProperties: false,
  },
};

const singlePromptJsonSchema = {
  name: "pixa_teacher_image_prompt",
  schema: {
    type: "object",
    properties: {
      prompt: { type: "string" },
    },
    required: ["prompt"],
    additionalProperties: false,
  },
};

const translationJsonSchema = {
  name: "pixa_prompt_translation",
  schema: {
    type: "object",
    properties: {
      translated_prompt: { type: "string" },
    },
    required: ["translated_prompt"],
    additionalProperties: false,
  },
};

export async function moderateAndTranslatePrompt({
  prompt,
  bannedWords,
}: {
  prompt: string;
  bannedWords: string[];
}): Promise<ModerationResult> {
  const env = getOpenRouterEnv();
  const content = `This is a prompt to generate a picture. If the prompt contains content related to (${bannedWords.join(", ")}) then return a JSON object with:

"flag": "no" if the content is not appropriate to show

"flag": "yes" if the content is appropriate

"translated_prompt": Fix the sentence structure and spelling if needed. If the input is not in English, translate it.

Be lenient; do not reject everything - only flag content that includes sexual themes, gore, blood, or underwear.

Example input:
"${prompt}"

Expected JSON output only - no extra text.`;

  const response = await chatCompletion({
    model: env.textModel,
    jsonSchema: moderationJsonSchema,
    messages: [{ role: "user", content }],
  });

  return parseJsonFromModel(response, moderationResultSchema);
}

export async function scoreStudentImage({
  targetImageUrl,
  studentImageUrl,
  originalPrompt,
  studentPrompt,
}: {
  targetImageUrl: string;
  studentImageUrl: string;
  originalPrompt: string;
  studentPrompt: string;
}): Promise<ScoreResult> {
  const env = getOpenRouterEnv();
  const buildContent = (compact: boolean): Array<TextContent | ImageContent> => [
    {
      type: "text",
      text: `You are an AI model tasked with evaluating the similarity between a student's image and an existing image, as well as comparing the student's prompt to the prompt used to create the existing image.

Provide JSON only with:
- feedback: brief constructive Hebrew feedback, maximum 25 words.
- image_comparison_score: number out of 70.
- prompt_comparison_score: number out of 30.
- score_breakdown: ${
        compact
          ? "one concise Hebrew sentence, maximum 40 words, mentioning the main visual match and one improvement."
          : "concise paragraph, maximum 80 words, covering Subject Matter (42), Color Palette (7), Composition (7), Emotion and Mood (7), Artistic Style (7), and prompt relevance (30)."
      }
- score: final total score as a string.

The final score must equal image_comparison_score + prompt_comparison_score.
The feedback should be in Hebrew and constructive. Include compliments if the total score is above 50.

Existing image prompt: "${originalPrompt}"
Student prompt: "${studentPrompt}"`,
    },
    { type: "text", text: "Existing image:" },
    { type: "image_url", image_url: { url: targetImageUrl } },
    { type: "text", text: "Student image:" },
    { type: "image_url", image_url: { url: studentImageUrl } },
  ];

  for (const attempt of [0, 1]) {
    const response = await chatCompletion({
      model: env.visionModel,
      jsonSchema: scoreJsonSchema,
      messages: [{ role: "user", content: buildContent(attempt === 1) }],
      maxTokens: attempt === 0 ? 1800 : 2200,
    });

    try {
      return parseJsonFromModel(response, scoreResultSchema);
    } catch (error) {
      if (attempt === 0 && error instanceof AIJsonParseError) continue;
      throw error;
    }
  }

  throw new AIJsonParseError("AI response was not valid JSON after retry.");
}

export async function createTeacherImagePrompt({
  topic,
  grade,
  description,
}: {
  topic: string;
  grade: string;
  description: string;
}) {
  const env = getOpenRouterEnv();
  const response = await chatCompletion({
    model: env.textModel,
    jsonSchema: singlePromptJsonSchema,
    messages: [
      {
        role: "user",
        content: `Write a prompt to create an image that fits this topic: ${topic} and this class: ${grade}.
Here is a description for the picture: ${description}
The prompt must be in English. Return JSON only.`,
      },
    ],
  });

  return parseJsonFromModel(response, teacherImagePromptSchema).prompt;
}

export async function translateOrFixPrompt(prompt: string) {
  const env = getOpenRouterEnv();
  const response = await chatCompletion({
    model: env.textModel,
    jsonSchema: translationJsonSchema,
    messages: [
      {
        role: "user",
        content: `Translate this "${prompt}".
Your response must be only the translation. If it is already English, fix spelling and sentence structure instead. Return JSON only.`,
      },
    ],
  });

  return parseJsonFromModel(response, translationSchema).translated_prompt;
}
