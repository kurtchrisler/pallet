import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 bg-accent text-accent-ink rounded-lg flex items-center justify-center font-display font-bold text-sm">
            PL
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Pallet Ledger</span>
        </Link>
        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-display font-semibold mb-1 tracking-tight">Log in</h1>
          <p className="text-sm text-ink-soft mb-5">Welcome back.</p>

          {message && (
            <div className="mb-4 text-sm bg-good-soft text-good rounded-lg px-3 py-2">{message}</div>
          )}
          {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded-lg px-3 py-2">{error}</div>}

          <form action={signIn} className="flex flex-col gap-3">
            <input type="hidden" name="next" value={next || "/dashboard"} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Email</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Password</span>
              <input type="password" name="password" required autoComplete="current-password" />
            </label>
            <div className="text-right -mt-1">
              <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              className="mt-2 bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2.5 text-sm shadow-sm hover:brightness-[1.08]"
            >
              Log in
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-ink-soft mt-5">
          New here?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
