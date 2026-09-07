import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-display font-semibold mb-1 tracking-tight">Reset your password</h1>
          <p className="text-sm text-ink-soft mb-5">We&apos;ll email you a link to set a new one.</p>
          <form action={requestPasswordReset} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Email</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <button
              type="submit"
              className="mt-2 bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2.5 text-sm shadow-sm hover:brightness-[1.08]"
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
