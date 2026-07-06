import { adminCreateImage, adminListImages, fail, ok } from "@/lib/pixa/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    return ok(await adminListImages(request));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await adminCreateImage(request));
  } catch (error) {
    return fail(error);
  }
}
