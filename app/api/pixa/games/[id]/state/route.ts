import { fail, getGameStateByIdOrCode, ok } from "../../../../../../lib/pixa/api";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return ok(await getGameStateByIdOrCode({ id }));
  } catch (error) {
    return fail(error);
  }
}
