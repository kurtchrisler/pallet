import Link from "next/link";
import { signUp } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 bg-accent text-accent-ink rounded flex items-center justify-center font-display font-bold text-sm">
            PL
          </div>
          <span className="font-display font-semibold text-lg">Pallet Ledger</span>
        </Link>
        <div className="bg-surface border border-line rounded-lg p-6">
          <h1 className="text-xl font-display font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-ink-soft mb-5">Start your free trial — no card required to sign up.</p>

          {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded px-3 py-2">{error}</div>}

          <form action={signUp} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-ink-soft">
              <span>Business name</span>
              <input name="businessName" placeholder="e.g. Kurt's Liquidation Finds" />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-ink-soft">
              <span>Email</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-ink-soft">
              <span>Password</span>
              <input type="password" name="password" required minLength={8} autoComplete="new-password" />
              <span className="normal-case text-ink-faint">At least 8 characters.</span>
            </label>
            <button
              type="submit"
              className="mt-2 bg-accent text-accent-ink font-semibold rounded px-4 py-2.5 text-sm hover:brightness-[1.06]"
            >
              Create account
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
