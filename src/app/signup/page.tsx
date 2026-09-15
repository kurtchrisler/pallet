import Link from "next/link";
import Image from "next/image";
import { startSignup } from "@/app/signup/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkout?: string }>;
}) {
  const { error, checkout } = await searchParams;
  const priceDisplay = process.env.NEXT_PUBLIC_PLAN_PRICE_DISPLAY || "$19/mo";

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/logo.png" alt="FlipTrackr" width={32} height={32} className="w-8 h-8 rounded-lg" priority />
          <span className="font-display font-semibold text-lg tracking-tight">FlipTrackr</span>
        </Link>
        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-display font-semibold mb-1 tracking-tight">Set up your account</h1>
          <p className="text-sm text-ink-soft mb-5">
            Enter your details, then subscribe ({priceDisplay}) on the next step — your account is created the
            moment payment goes through, and you&apos;ll land right in your dashboard.
          </p>

          {checkout === "cancelled" && !error && (
            <div className="mb-4 text-sm bg-surface-2 text-ink-soft rounded-lg px-3 py-2">
              Checkout was cancelled — no charge was made. You can try again below.
            </div>
          )}
          {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded-lg px-3 py-2">{error}</div>}

          <form action={startSignup} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Business name</span>
              <input name="businessName" placeholder="e.g. Kurt's Liquidation Finds" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Email</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Password</span>
              <input type="password" name="password" required minLength={8} autoComplete="new-password" />
              <span className="text-xs font-normal text-ink-faint">At least 8 characters.</span>
            </label>
            <button
              type="submit"
              className="mt-2 bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2.5 text-sm shadow-sm hover:brightness-[1.08]"
            >
              Continue to payment
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-ink-soft mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
