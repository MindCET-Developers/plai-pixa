import { createGame, fail, ok } from "../../../../lib/pixa/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return ok(await createGame(request), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
