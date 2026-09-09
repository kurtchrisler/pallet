import Link from "next/link";
import Image from "next/image";

const FEATURES = [
  {
    title: "Break lots into real inventory",
    body: "Log what you paid for a lot, then split it into the individual items inside — cost allocates automatically by retail value, so every item has a true cost basis instead of a guess.",
  },
  {
    title: "Know your profit, not just your revenue",
    body: "Every sale shows real profit after allocated cost. The dashboard rolls it up by month and ranks your lot sources so you know which suppliers are actually worth buying from.",
  },
  {
    title: "Catch inventory before it goes stale",
    body: "Anything sitting unsold 30, 60, or 90+ days gets flagged automatically, so nothing quietly eats your storage space.",
  },
  {
    title: "Built for how you actually work",
    body: "Log a lot at pickup, break it into items that night, mark things sold as they go — from your phone or your computer, anywhere you have a signal.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-[1080px] mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="FlipTrackr" width={32} height={32} className="w-8 h-8 rounded-lg" priority />
          <span className="font-display font-semibold text-lg tracking-tight">FlipTrackr</span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/pricing" className="text-ink-soft hover:text-ink">
            Pricing
          </Link>
          <Link href="/login" className="text-ink-soft hover:text-ink">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2 shadow-sm hover:brightness-[1.08]"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 0%, var(--accent-soft), transparent 70%)",
          }}
        />
        <div className="relative max-w-[720px] mx-auto px-4 pt-14 pb-16 text-center">
          <span className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-xs font-medium px-3 py-1 rounded-full mb-5">
            Built for lot &amp; liquidation resellers
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold leading-[1.1] tracking-tight text-balance">
            Inventory and profit tracking, built for lot resellers
          </h1>
          <p className="text-ink-soft mt-5 text-lg text-balance max-w-[560px] mx-auto">
            Track what you pay for lots, what&apos;s inside them, and what you actually make — without spreadsheets
            that fall apart the moment you&apos;re moving fast.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="/signup"
              className="bg-accent text-accent-ink font-semibold rounded-lg px-5 py-3 text-sm shadow-sm hover:brightness-[1.08]"
            >
              Subscribe now
            </Link>
            <Link
              href="/pricing"
              className="bg-surface border border-line-strong rounded-lg px-5 py-3 text-sm shadow-sm hover:border-ink-soft"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-[1080px] mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-line rounded-xl shadow-sm p-5">
              <h3 className="font-display font-semibold text-base mb-1.5 tracking-tight">{f.title}</h3>
              <p className="text-sm text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[720px] mx-auto px-4 pb-20 text-center">
        <div className="bg-surface border border-line rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-display font-semibold mb-2 tracking-tight">Ready to see your real numbers?</h2>
          <p className="text-sm text-ink-soft mb-5">Create your account and subscribe — you&apos;ll be tracking real numbers in minutes.</p>
          <Link
            href="/signup"
            className="bg-accent text-accent-ink font-semibold rounded-lg px-5 py-3 text-sm shadow-sm inline-block hover:brightness-[1.08]"
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="max-w-[1080px] mx-auto px-4 py-8 border-t border-line text-sm text-ink-faint flex flex-wrap gap-4 justify-between">
        <span>© {new Date().getFullYear()} FlipTrackr</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:text-ink-soft">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-ink-soft">
            Log in
          </Link>
        </div>
      </footer>
    </div>
  );
}
