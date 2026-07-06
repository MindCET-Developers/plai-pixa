/**
 * Runs a minimal live AI-provider smoke test for PIXA.
 *
 * Usage:
 *   npm run smoke:ai
 */
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import {
  createTeacherImagePrompt,
  moderateAndTranslatePrompt,
  scoreStudentImage,
  translateOrFixPrompt,
} from "../lib/ai/openrouter";
import { generateImage } from "../lib/ai/runware";

loadEnvConfig(path.join(__dirname, ".."));

process.env.RUNWARE_IMAGE_WIDTH ||= "512";
process.env.RUNWARE_IMAGE_HEIGHT ||= "512";
process.env.RUNWARE_IMAGE_STEPS ||= "20";

function preview(text: string, maxLength = 140) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

async function main() {
  console.log("AI smoke test: starting OpenRouter + Runware checks");

  const moderation = await moderateAndTranslatePrompt({
    prompt: "ילד מחזיק עפיפון צבעוני בשדה ירוק ביום שמש",
    bannedWords: ["blood", "gore", "underwear", "sexual"],
  });
  console.log("OpenRouter moderation:", moderation.flag, preview(moderation.translated_prompt));

  const teacherPrompt = await createTeacherImagePrompt({
    topic: "Science",
    grade: "4th grade",
    description: "a friendly classroom poster about the water cycle",
  });
  console.log("OpenRouter teacher prompt:", preview(teacherPrompt));

  const fixedPrompt = await translateOrFixPrompt("a cute robot teach childrens about clouds");
  console.log("OpenRouter translation/fix:", preview(fixedPrompt));

  const image = await generateImage(
    "A colorful educational poster for children showing the water cycle, friendly style, clear labels, no text"
  );
  console.log("Runware image generated:", image.imageURL);
  console.log("Runware NSFW:", image.NSFWContent ?? false);

  const score = await scoreStudentImage({
    targetImageUrl: image.imageURL,
    studentImageUrl: image.imageURL,
    originalPrompt: teacherPrompt,
    studentPrompt: fixedPrompt,
  });
  console.log("OpenRouter vision score:", score.score);
  console.log("OpenRouter vision feedback:", preview(score.feedback));

  console.log("AI smoke test: completed successfully");
}

main().catch((error) => {
  console.error("AI smoke test failed:");
  console.error(error);
  process.exitCode = 1;
});
