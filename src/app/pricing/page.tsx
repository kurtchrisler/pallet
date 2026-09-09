import Link from "next/link";

const INCLUDED = [
  "Unlimited pallets, items, sales & expenses",
  "Automatic per-item cost allocation",
  "Aging inventory alerts",
  "Best-source & monthly profit reports",
  "CSV export for tax time",
  "Your data, private to your account",
];

export default function PricingPage() {
  const priceDisplay = process.env.NEXT_PUBLIC_PLAN_PRICE_DISPLAY || "$19/mo";
  const planName = process.env.NEXT_PUBLIC_PLAN_NAME || "Pro";

  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-[1080px] mx-auto px-4 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent text-accent-ink rounded-lg flex items-center justify-center font-display font-bold text-sm">
            FT
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">FlipTrackr</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
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

      <section className="max-w-md mx-auto px-4 pt-10 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-semibold tracking-tight">Simple pricing</h1>
          <p className="text-ink-soft mt-2 text-sm">One plan. Everything included. Cancel anytime.</p>
        </div>

        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-accent">{planName}</div>
          <div className="mono text-4xl font-semibold mt-1 tracking-tight">{priceDisplay}</div>
          <ul className="mt-5 flex flex-col gap-2.5">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="text-good mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-6 block text-center bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2.5 text-sm shadow-sm hover:brightness-[1.08]"
          >
            Subscribe now
          </Link>
        </div>
      </section>
    </div>
  );
}
