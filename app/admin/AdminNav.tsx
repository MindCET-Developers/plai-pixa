import Link from "next/link";
import { he } from "@/lib/i18n/he";

export function AdminNav({ active }: { active: "images" | "banned-words" | "dashboard" }) {
  const links = [
    { href: "/admin/images", key: "images" as const, label: he.admin.navImages },
    { href: "/admin/banned-words", key: "banned-words" as const, label: he.admin.navBannedWords },
    { href: "/admin/dashboard", key: "dashboard" as const, label: he.admin.navDashboard },
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            active === link.key
              ? "bg-white text-pixa-btn-dark"
              : "border border-white/30 text-white hover:bg-white/10"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
