import { fail, ok, submitPrompt } from "../../../../lib/pixa/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    return ok(await submitPrompt(request), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
