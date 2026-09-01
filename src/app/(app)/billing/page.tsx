import { getAppContext } from "@/lib/app-context";
import { fmtDate } from "@/lib/calc";
import { ACTIVE_STATUSES } from "@/lib/types";
import { Card } from "@/components/ui";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
  none: "No plan yet",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkout?: string }>;
}) {
  const { subscription } = await getAppContext({ requireActive: false });
  const { error, checkout } = await searchParams;
  const status = subscription?.status ?? "none";
  const isActive = ACTIVE_STATUSES.has(status);

  return (
    <section className="max-w-lg">
      <h2 className="text-[1.05rem] font-display font-semibold">Billing</h2>
      <p className="text-sm text-ink-soft mb-4">Manage your Pallet Ledger subscription.</p>

      {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded px-3 py-2">{error}</div>}
      {checkout === "cancelled" && (
        <div className="mb-4 text-sm bg-surface-2 text-ink-soft rounded px-3 py-2">Checkout was cancelled — no charge was made.</div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs uppercase tracking-wide text-ink-soft">Status</span>
          <span className={`text-sm font-semibold ${isActive ? "text-good" : "text-alert"}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
        {subscription?.current_period_end && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              {status === "trialing" ? "Trial ends" : "Renews"}
            </span>
            <span className="text-sm mono">{fmtDate(subscription.current_period_end.slice(0, 10))}</span>
          </div>
        )}

        {isActive ? (
          <form action="/api/stripe/portal" method="POST">
            <button type="submit" className="w-full bg-accent text-accent-ink font-semibold rounded px-4 py-2.5 text-sm hover:brightness-[1.06]">
              Manage billing
            </button>
          </form>
        ) : (
          <form action="/api/stripe/checkout" method="POST">
            <button type="submit" className="w-full bg-accent text-accent-ink font-semibold rounded px-4 py-2.5 text-sm hover:brightness-[1.06]">
              Subscribe
            </button>
          </form>
        )}
        <p className="text-xs text-ink-faint mt-3">
          {isActive
            ? "Update your card, change plans, or cancel — handled securely by Stripe."
            : "You'll be taken to Stripe's secure checkout to start your subscription."}
        </p>
      </Card>
    </section>
  );
}
