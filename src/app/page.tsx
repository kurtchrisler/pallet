import Link from "next/link";

const FEATURES = [
  {
    title: "Break pallets into real inventory",
    body: "Log what you paid for a pallet, then split it into the individual items inside — cost allocates automatically by estimated value, so every item has a true cost basis instead of a guess.",
  },
  {
    title: "Know your profit, not just your revenue",
    body: "Every sale shows real profit after allocated cost. The dashboard rolls it up by month and ranks your pallet sources so you know which suppliers are actually worth buying from.",
  },
  {
    title: "Catch inventory before it goes stale",
    body: "Anything sitting unsold 30, 60, or 90+ days gets flagged automatically, so nothing quietly eats your storage space.",
  },
  {
    title: "Built for how you actually work",
    body: "Log a pallet at pickup, break it into items that night, mark things sold as they go — from your phone or your computer, anywhere you have a signal.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-[1080px] mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent text-accent-ink rounded flex items-center justify-center font-display font-bold text-sm">
            PL
          </div>
          <span className="font-display font-semibold text-lg">Pallet Ledger</span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/pricing" className="text-ink-soft hover:text-ink">
            Pricing
          </Link>
          <Link href="/login" className="text-ink-soft hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className="bg-accent text-accent-ink font-semibold rounded px-4 py-2 hover:brightness-[1.06]">
            Start free trial
          </Link>
        </nav>
      </header>

      <section className="max-w-[720px] mx-auto px-4 pt-10 pb-14 text-center">
        <h1 className="text-3xl sm:text-4xl font-display font-semibold leading-tight text-balance">
          Inventory and profit tracking, built for pallet resellers
        </h1>
        <p className="text-ink-soft mt-4 text-lg text-balance">
          Track what you pay for pallets, what&apos;s inside them, and what you actually make — without spreadsheets
          that fall apart the moment you&apos;re moving fast.
        </p>
        <div className="flex items-center justify-center gap-3 mt-7">
          <Link href="/signup" className="bg-accent text-accent-ink font-semibold rounded px-5 py-3 text-sm hover:brightness-[1.06]">
            Start free trial
          </Link>
          <Link href="/pricing" className="border border-line-strong rounded px-5 py-3 text-sm">
            See pricing
          </Link>
        </div>
      </section>

      <section className="max-w-[1080px] mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-line rounded-lg p-5">
              <h3 className="font-display font-semibold text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[720px] mx-auto px-4 pb-20 text-center">
        <div className="bg-surface border border-line rounded-lg p-8">
          <h2 className="text-xl font-display font-semibold mb-2">Ready to see your real numbers?</h2>
          <p className="text-sm text-ink-soft mb-5">Start your free trial — no credit card required to sign up.</p>
          <Link href="/signup" className="bg-accent text-accent-ink font-semibold rounded px-5 py-3 text-sm inline-block hover:brightness-[1.06]">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="max-w-[1080px] mx-auto px-4 py-8 border-t border-line text-sm text-ink-faint flex flex-wrap gap-4 justify-between">
        <span>© {new Date().getFullYear()} Pallet Ledger</span>
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
