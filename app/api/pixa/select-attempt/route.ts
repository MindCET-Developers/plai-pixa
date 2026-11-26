import { fail, ok, selectAttempt } from "../../../../lib/pixa/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return ok(await selectAttempt(request));
  } catch (error) {
    return fail(error);
  }
}
