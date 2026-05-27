"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/tracker", label: "Tracker" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-3">
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

      <div className="flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-black/70 transition-colors hover:text-black">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-brand-dark">
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-1 ring-black/10",
              },
            }}
          />
        </Show>
      </div>
    </div>
  );
}
