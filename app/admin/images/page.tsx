import Link from "next/link";
import { getAdminPageAccess } from "@/lib/pixa/api";
import { he } from "@/lib/i18n/he";
import { AdminAccessGate } from "../AdminAccessGate";
import { AdminNav } from "../AdminNav";
import { AdminImageBankPage } from "./AdminImageBankPage";

export default async function AdminImagesPage() {
  const access = await getAdminPageAccess();
  if (access.status !== "ok") return <AdminAccessGate access={access} />;

  return (
    <main className="min-h-screen bg-[url('/backgrounds/bg-admin.png')] bg-cover bg-center px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 text-white">
          <Link href="/" className="text-2xl font-extrabold">
            PIXA
          </Link>
          <AdminNav active="images" />
        </header>

        <div className="glass-card border border-white/20 p-6 text-white sm:p-8">
          <h1 className="text-2xl font-extrabold">{he.admin.imagesTitle}</h1>
          <AdminImageBankPage />
        </div>
      </section>
    </main>
  );
}
