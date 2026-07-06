import { advanceGame, fail, ok } from "../../../../../../lib/pixa/api";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return ok(await advanceGame(id));
  } catch (error) {
    return fail(error);
  }
}
