import { deleteBannedWord, fail, ok } from "@/lib/pixa/api";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await deleteBannedWord(id));
  } catch (error) {
    return fail(error);
  }
}
