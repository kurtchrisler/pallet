"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pallets", label: "Lots" },
  { href: "/items", label: "Items" },
  { href: "/sales", label: "Sales" },
  { href: "/expenses", label: "Expenses" },
];

export function AppShell({
  email,
  subscriptionBadge,
  children,
}: {
  email: string;
  subscriptionBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-line bg-surface">
        <div className="flex items-center justify-between gap-3 max-w-[1080px] mx-auto px-4 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/logo.png" alt="FlipTrackr" width={32} height={32} className="w-8 h-8 flex-none rounded-lg" priority />
            <div>
              <h1 className="text-[0.95rem] font-display font-semibold leading-tight tracking-tight">FlipTrackr</h1>
              <p className="text-[0.72rem] text-ink-faint leading-tight">{email}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {subscriptionBadge}
            <Link href="/billing" className="text-sm text-ink-soft hover:text-ink hidden sm:inline">
              Billing
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-ink-soft hover:text-ink hover:bg-surface-2 rounded-lg px-3 py-1.5 transition-colors"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
      <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto px-4 py-2.5 bg-paper/85 backdrop-blur-sm border-b border-line max-w-[1080px] mx-auto">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-none font-medium text-sm px-3.5 py-1.5 rounded-full transition-colors ${
                active ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink hover:bg-surface-2"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <main className="max-w-[1080px] mx-auto px-4 pb-16 pt-6">{children}</main>
    </div>
  );
}
