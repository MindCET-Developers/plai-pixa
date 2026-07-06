import { adminGenerateImage, fail, ok } from "@/lib/pixa/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return ok(await adminGenerateImage(request), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
