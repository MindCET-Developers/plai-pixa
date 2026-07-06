import { adminDeleteImage, adminUpdateImage, fail, ok } from "@/lib/pixa/api";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await adminUpdateImage(request, id));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await adminDeleteImage(id));
  } catch (error) {
    return fail(error);
  }
}
