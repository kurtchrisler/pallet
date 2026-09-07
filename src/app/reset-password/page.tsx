import { updatePassword } from "@/app/auth/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-display font-semibold mb-1 tracking-tight">Set a new password</h1>
          <p className="text-sm text-ink-soft mb-5">You&apos;re signed in via the reset link — choose a new password.</p>
          {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded-lg px-3 py-2">{error}</div>}
          <form action={updatePassword} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>New password</span>
              <input type="password" name="password" required minLength={8} autoComplete="new-password" />
            </label>
            <button
              type="submit"
              className="mt-2 bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2.5 text-sm shadow-sm hover:brightness-[1.08]"
            >
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
