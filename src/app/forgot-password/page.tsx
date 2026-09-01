import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-line rounded-lg p-6">
          <h1 className="text-xl font-display font-semibold mb-1">Reset your password</h1>
          <p className="text-sm text-ink-soft mb-5">We&apos;ll email you a link to set a new one.</p>
          <form action={requestPasswordReset} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-ink-soft">
              <span>Email</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <button
              type="submit"
              className="mt-2 bg-accent text-accent-ink font-semibold rounded px-4 py-2.5 text-sm hover:brightness-[1.06]"
            >
              Send reset link
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-ink-soft mt-5">
          <Link href="/login" className="text-accent hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
