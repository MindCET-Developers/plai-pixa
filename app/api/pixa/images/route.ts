import { createImage, fail, listImages, ok } from "../../../../lib/pixa/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    return ok(await listImages(request));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createImage(request), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
