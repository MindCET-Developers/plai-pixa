import { fail, ok, submitReview } from "../../../../lib/pixa/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return ok(await submitReview(request), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
