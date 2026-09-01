"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pallets", label: "Pallets" },
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
      <div className="flex items-center justify-between gap-3 max-w-[1080px] mx-auto px-4 pt-4 pb-2.5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 flex-none bg-accent text-accent-ink rounded flex items-center justify-center font-display font-bold text-sm">
            PL
          </div>
          <div>
            <h1 className="text-lg font-display font-semibold leading-tight">Pallet Ledger</h1>
            <p className="text-[0.7rem] uppercase tracking-wider text-ink-soft leading-tight">{email}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {subscriptionBadge}
          <Link href="/billing" className="text-xs text-ink-soft hover:text-ink hidden sm:inline">
            Billing
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-xs text-ink-soft hover:text-ink border border-line-strong rounded px-2.5 py-1.5">
              Log out
            </button>
          </form>
        </div>
      </div>
      <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto px-4 py-2 bg-paper border-b border-line max-w-[1080px] mx-auto">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-none font-display text-[0.82rem] uppercase tracking-wide px-3.5 py-2 rounded border ${
                active ? "bg-surface border-line-strong text-accent" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <main className="max-w-[1080px] mx-auto px-4 pb-16 pt-5">{children}</main>
    </div>
  );
}
