import { fail, generateTeacherImage, ok } from "../../../../../lib/pixa/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    return ok(await generateTeacherImage(request), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
