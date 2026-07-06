import { createBannedWord, fail, listBannedWords, ok } from "@/lib/pixa/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok(await listBannedWords());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createBannedWord(request), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
