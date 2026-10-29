import Link from "next/link";
import { getReportAccess } from "@/lib/pixa/report";

// Header link to the usage report, rendered only for signed-in MindCET Google accounts.
export async function ReportLink() {
  const access = await getReportAccess();
  if (access.status !== "ok") return null;

  return (
    <Link
      href="/report"
      className="rounded-full border border-white/40 px-4 py-2 text-sm font-bold whitespace-nowrap text-white hover:bg-white/10"
    >
      דשבורד שימוש
    </Link>
  );
}
