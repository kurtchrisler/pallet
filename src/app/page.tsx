import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  DollarSign,
  TrendingUp,
  Star,
  Package,
  Percent,
  ShoppingCart,
  Receipt,
  Upload,
} from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "Break any lot into real inventory",
    body: "Log what you paid — cost, freight, source — then split it into the individual items inside. Cost allocates automatically by retail value.",
  },
  {
    icon: Upload,
    title: "Import items straight from a spreadsheet",
    body: "Already tracking items in a CSV or Excel file? Drop it in, map the columns once, and skip the manual entry entirely.",
  },
  {
    icon: DollarSign,
    title: "Override cost on any item",
    body: "Got a firmer number for one item? Set it manually and the rest of the lot rebalances around it automatically — the math always still adds up.",
  },
  {
    icon: TrendingUp,
    title: "See real profit, not just revenue",
    body: "Every sale shows profit after allocated cost. The dashboard rolls it up by month so you know what you actually made.",
  },
  {
    icon: Star,
    title: "Rank suppliers by what they actually make you",
    body: "Best lot sources ranks every source by realized profit — not just how good the deal looked at pickup.",
  },
  {
    icon: Package,
    title: "Catch stale inventory before it costs you",
    body: "Anything sitting unsold 30, 60, or 90+ days gets flagged automatically, so nothing quietly eats your storage space.",
  },
  {
    icon: Percent,
    title: "Track sell-through and margin at a glance",
    body: "Six live numbers on your dashboard, with a date range you control — last 7, 30, 60 days, or all time.",
  },
  {
    icon: ShoppingCart,
    title: "Log a sale from your phone",
    body: "Capture buyer, channel, and price in seconds, right when it sells — from your phone or your computer.",
  },
  {
    icon: Receipt,
    title: "Export everything for tax time",
    body: "CSV export for sales and inventory, ready to hand to your bookkeeper or drop into a spreadsheet.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Log the lot",
    body: "Enter what you paid — cost, freight, source — right when you get it. Takes under a minute.",
  },
  {
    n: "02",
    title: "Break it into items",
    body: "Add each item with its retail value. FlipTrackr splits the lot's cost across them automatically, so every item has a true cost basis.",
  },
  {
    n: "03",
    title: "Track it to the sale",
    body: "Mark items sold as they go. Real profit, sell-through, and margin update live — no spreadsheet required.",
  },
];

const INCLUDED = [
  "Unlimited lots, items, sales & expenses",
  "Automatic per-item cost allocation, with manual override",
  "Aging inventory alerts",
  "Best-source & monthly profit reports",
  "CSV export for tax time",
  "Your data, private to your account",
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Manage or cancel your subscription anytime from the Billing page in your account — no lock-in, no phone call required.",
  },
  {
    q: "Is this only for pallet flippers?",
    a: "No. A \"lot\" can be a pallet, a case pack, a storage unit, or any bulk buy where you paid one price for a bunch of items — FlipTrackr splits the cost across whatever's inside.",
  },
  {
    q: "How does cost allocation actually work?",
    a: "By default, a lot's total cost splits across its items in proportion to each item's retail value — a higher-value item carries a bigger share. If you know an item's real cost, you can override it directly and the rest of the lot rebalances around that.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Every account's data is private to that account — nobody else can see your lots, items, or numbers.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. FlipTrackr is built to be used from wherever you are — log a lot at pickup, break it into items that night, mark things sold as they go.",
  },
];

function ScreenshotFrame({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    <div className="bg-surface border border-line rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-line bg-surface-2">
        <span className="w-2.5 h-2.5 rounded-full bg-alert/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-good/50" />
      </div>
      <Image src={src} alt={alt} width={width} height={height} className="w-full h-auto" />
    </div>
  );
}

export default function LandingPage() {
  const priceDisplay = process.env.NEXT_PUBLIC_PLAN_PRICE_DISPLAY || "$19/mo";
  const planName = process.env.NEXT_PUBLIC_PLAN_NAME || "Pro";

  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-[1080px] mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="FlipTrackr" width={32} height={32} className="w-8 h-8 rounded-lg" priority />
          <span className="font-display font-semibold text-lg tracking-tight">FlipTrackr</span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/pricing" className="text-ink-soft hover:text-ink hidden sm:inline">
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-[420px]"
          style={{
            background: "radial-gradient(ellipse 60% 100% at 50% 0%, var(--accent-soft), transparent 70%)",
          }}
        />
        <div className="relative max-w-[720px] mx-auto px-4 pt-14 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-xs font-medium px-3 py-1 rounded-full mb-5">
            Built for resellers who buy in bulk
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold leading-[1.1] tracking-tight text-balance">
            Stop guessing what your lots actually cost you
          </h1>
          <p className="text-ink-soft mt-5 text-lg text-balance max-w-[560px] mx-auto">
            FlipTrackr turns every pallet, case pack, or bulk buy into real per-item numbers — so you always know
            your true cost, your real profit, and which suppliers are actually worth buying from again.
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
        <div className="relative max-w-[980px] mx-auto px-4 pb-16">
          <ScreenshotFrame src="/screenshot-dashboard.png" alt="FlipTrackr dashboard showing invested, revenue, net profit and inventory value" width={1440} height={1287} />
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-[1080px] mx-auto px-4 pb-20">
        <div className="text-center max-w-[560px] mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-balance">
            Everything you need to know your numbers
          </h2>
          <p className="text-ink-soft mt-3 text-balance">
            No spreadsheets that fall apart the moment you&apos;re moving fast.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-line rounded-xl shadow-sm p-5">
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-accent-soft text-accent mb-3">
                <f.icon size={18} strokeWidth={2} />
              </span>
              <h3 className="font-display font-semibold text-base mb-1.5 tracking-tight">{f.title}</h3>
              <p className="text-sm text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface border-y border-line">
        <div className="max-w-[1080px] mx-auto px-4 py-16">
          <div className="text-center max-w-[560px] mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-balance">
              From lot to profit in three steps
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="mono text-sm font-semibold text-accent mb-2">{s.n}</div>
                <h3 className="font-display font-semibold text-lg mb-1.5 tracking-tight">{s.title}</h3>
                <p className="text-sm text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep dive 1 — dashboard */}
      <section className="max-w-[1080px] mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-info-soft text-info text-xs font-medium px-3 py-1 rounded-full mb-4">
              Dashboard
            </span>
            <h2 className="text-2xl font-display font-semibold tracking-tight mb-3 text-balance">
              Your business, at a glance
            </h2>
            <p className="text-ink-soft mb-4">
              Total invested, revenue, net profit, inventory on hand, sell-through, and average margin — six numbers
              that actually tell you how the business is doing, updated the moment you log something.
            </p>
            <p className="text-ink-soft">
              Pick a date range — last 7, 15, 30, or 60 days, or all time — and every number scopes to it instantly.
            </p>
          </div>
          <ScreenshotFrame src="/screenshot-dashboard.png" alt="FlipTrackr dashboard KPI tiles and recent items table" width={1440} height={1287} />
        </div>
      </section>

      {/* Deep dive 2 — items / cost allocation */}
      <section className="bg-surface border-y border-line">
        <div className="max-w-[1080px] mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="md:order-2">
              <span className="inline-flex items-center gap-1.5 bg-violet-soft text-violet text-xs font-medium px-3 py-1 rounded-full mb-4">
                Items
              </span>
              <h2 className="text-2xl font-display font-semibold tracking-tight mb-3 text-balance">
                Every item gets a real cost, automatically
              </h2>
              <p className="text-ink-soft mb-4">
                Pay one price for a lot, and FlipTrackr splits it across everything inside by retail value — a
                higher-value item carries a bigger share of the cost, instead of every item pretending to cost the
                same.
              </p>
              <p className="text-ink-soft">
                Know the real number on one item? Override it directly, and the rest of the lot rebalances around
                it automatically — the costs always still add up to what you actually paid.
              </p>
            </div>
            <div className="md:order-1">
              <ScreenshotFrame src="/screenshot-items.png" alt="FlipTrackr items table showing allocated cost per item, including a manually overridden cost" width={1440} height={660} />
            </div>
          </div>
        </div>
      </section>

      {/* Deep dive 3 — sales / profit */}
      <section className="max-w-[1080px] mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-good-soft text-good text-xs font-medium px-3 py-1 rounded-full mb-4">
              Sales
            </span>
            <h2 className="text-2xl font-display font-semibold tracking-tight mb-3 text-balance">
              Know exactly what you made — on every sale
            </h2>
            <p className="text-ink-soft mb-4">
              Log what it sold for, who bought it, and where — FlipTrackr does the math against that item&apos;s
              allocated cost and shows you the real profit, right in the row.
            </p>
            <p className="text-ink-soft">
              No more finding out at tax time that a &quot;good deal&quot; item barely broke even.
            </p>
          </div>
          <ScreenshotFrame src="/screenshot-sales.png" alt="FlipTrackr sale history table showing price and profit per sale" width={1440} height={380} />
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-surface border-y border-line">
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-semibold tracking-tight">Simple pricing</h2>
            <p className="text-ink-soft mt-2 text-sm">One plan. Everything included. Cancel anytime.</p>
          </div>
          <div className="bg-paper border border-line rounded-xl shadow-sm p-6">
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
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[720px] mx-auto px-4 py-16">
        <h2 className="text-2xl font-display font-semibold tracking-tight text-center mb-8">
          Questions people ask
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((f) => (
            <div key={f.q} className="bg-surface border border-line rounded-xl shadow-sm p-5">
              <h3 className="font-display font-semibold text-[0.95rem] mb-1.5 tracking-tight">{f.q}</h3>
              <p className="text-sm text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-[720px] mx-auto px-4 pb-20 text-center">
        <div className="bg-surface border border-line rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-display font-semibold mb-2 tracking-tight">Ready to see your real numbers?</h2>
          <p className="text-sm text-ink-soft mb-5">
            Create your account and subscribe — you&apos;ll be tracking real numbers in minutes.
          </p>
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
