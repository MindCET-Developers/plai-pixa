import { fail, getAdminDashboard, ok } from "@/lib/pixa/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok(await getAdminDashboard());
  } catch (error) {
    return fail(error);
  }
}
