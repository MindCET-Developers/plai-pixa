import { getRunwareEnv } from "../supabase/env";
import { runwareImageSchema, type RunwareImage } from "./schemas";

const runwareResponseSchema = runwareImageSchema.array();

export async function generateImage(prompt: string): Promise<RunwareImage> {
  const env = getRunwareEnv();
  const taskUUID = crypto.randomUUID();

  const response = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        taskType: "imageInference",
        taskUUID,
        model: env.model,
        positivePrompt: prompt,
        width: env.width,
        height: env.height,
        steps: env.steps,
        numberResults: 1,
        checkNSFW: true,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(`Runware request failed: ${response.status} ${await response.text()}`);
  }

  const json = await response.json();
  if (json?.error) {
    throw new Error(`Runware error: ${JSON.stringify(json.error)}`);
  }

  const data = runwareResponseSchema.parse(json?.data ?? []);
  const image = data.find((item) => item.taskUUID === taskUUID) ?? data[0];
  if (!image) throw new Error("Runware response did not include an image.");
  return image;
}
