"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/tracker", label: "Tracker" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex rounded-lg border border-black/10 bg-white p-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-brand text-black"
                : "text-black/60 hover:text-black",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
