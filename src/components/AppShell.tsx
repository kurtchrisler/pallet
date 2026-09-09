"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { LayoutGrid, Layers, Box, ShoppingCart, Receipt, CreditCard, Menu, X, LogOut } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/pallets", label: "Lots", icon: Layers },
  { href: "/items", label: "Items", icon: Box },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/expenses", label: "Expenses", icon: Receipt },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <nav className="flex-1 px-3 flex flex-col gap-0.5">
      {TABS.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-accent text-accent-ink" : "text-sidebar-ink-soft hover:bg-white/5 hover:text-sidebar-ink"
            }`}
          >
            <Icon size={17} strokeWidth={2} className="flex-none" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  email,
  subscriptionBadge,
  onNavigate,
}: {
  email: string;
  subscriptionBadge?: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <div className="px-3 pb-4 pt-3 border-t border-white/10 mt-2 flex flex-col gap-0.5">
      {subscriptionBadge && <div className="px-3 pb-2">{subscriptionBadge}</div>}
      <Link
        href="/billing"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-ink-soft hover:bg-white/5 hover:text-sidebar-ink transition-colors"
      >
        <CreditCard size={17} strokeWidth={2} className="flex-none" />
        Billing
      </Link>
      <div className="px-3 pt-1.5 pb-1 text-xs text-sidebar-ink-soft truncate">{email}</div>
      <form action={signOut}>
        <button
          type="submit"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-ink-soft hover:bg-white/5 hover:text-sidebar-ink transition-colors"
        >
          <LogOut size={17} strokeWidth={2} className="flex-none" />
          Log out
        </button>
      </form>
    </div>
  );
}

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
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="min-h-screen md:flex bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-none md:flex-col bg-sidebar sticky top-0 h-screen">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
          <Image src="/logo.png" alt="FlipTrackr" width={32} height={32} className="w-8 h-8 rounded-lg flex-none" priority />
          <span className="font-display font-semibold text-[1.05rem] tracking-tight text-sidebar-ink">FlipTrackr</span>
        </Link>
        <NavLinks pathname={pathname} onNavigate={close} />
        <SidebarFooter email={email} subscriptionBadge={subscriptionBadge} onNavigate={close} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-sidebar">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="FlipTrackr" width={28} height={28} className="w-7 h-7 rounded-lg flex-none" />
          <span className="font-display font-semibold text-sidebar-ink">FlipTrackr</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sidebar-ink p-1.5 -mr-1.5"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 max-w-[80vw] bg-sidebar flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-display font-semibold text-sidebar-ink">FlipTrackr</span>
              <button type="button" onClick={close} className="text-sidebar-ink p-1" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={close} />
            <SidebarFooter email={email} subscriptionBadge={subscriptionBadge} onNavigate={close} />
          </div>
          <button
            type="button"
            aria-label="Close menu"
            className="flex-1 bg-black/40"
            onClick={close}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <main className="max-w-[1080px] mx-auto px-4 pb-16 pt-6">{children}</main>
      </div>
    </div>
  );
}
