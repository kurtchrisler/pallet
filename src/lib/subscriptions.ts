import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { addAWeberSubscriber } from "@/lib/aweber";
import { completeSignup } from "@/lib/signup";
import { ACTIVE_STATUSES } from "@/lib/types";

/** Existing (logged-in) subscribers carry `supabase_user_id` directly.
 * New pay-first signups instead carry `pending_signup_id`, since there's
 * no account yet at the moment checkout starts — this resolves either
 * case to a real user id, creating the account on first call if needed.
 * Safe to call more than once for the same subscription. */
async function resolveUserId(subscription: Stripe.Subscription): Promise<string | null> {
  const direct = subscription.metadata?.supabase_user_id;
  if (direct) return direct;

  const pendingSignupId = subscription.metadata?.pending_signup_id;
  if (!pendingSignupId) return null;

  let fallbackEmail: string | null = null;
  try {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const customer = await getStripe().customers.retrieve(customerId);
    fallbackEmail = !("deleted" in customer && customer.deleted) ? (customer as Stripe.Customer).email : null;
  } catch (err) {
    console.error("resolveUserId: could not look up Stripe customer for fallback email", err);
  }

  const result = await completeSignup({ pendingSignupId, fallbackEmail });
  return result?.userId ?? null;
}

/**
 * Upserts FlipTrackr's local `subscriptions` row from a Stripe subscription
 * object, creating the Supabase account first if this is a pay-first
 * signup that hasn't been turned into a real account yet, and adding the
 * person to the AWeber list the moment they first become active. Returns
 * the resolved Supabase user id.
 *
 * Idempotent and safe to call more than once for the same subscription —
 * both the Stripe webhook and the checkout success-page redirect
 * (/auth/complete-signup) call this, since either one might be the first
 * to see a given payment, and the browser might never come back at all.
 */
export async function syncSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  const userId = await resolveUserId(subscription);
  if (!userId) {
    // Fixed: this used to log and silently return "success" to Stripe,
    // which is exactly the kind of failure that looks fine in the Stripe
    // dashboard while nothing actually happens in the database. Throwing
    // here makes the outer handler return a real error status instead.
    throw new Error(
      `Stripe subscription ${subscription.id} has no supabase_user_id metadata and its pending_signup_id (${subscription.metadata?.pending_signup_id}) could not be resolved to an account`
    );
  }

  const item = subscription.items.data[0];
  const admin = createAdminClient();

  // Read the prior status first so we can tell whether this event is the
  // moment someone *becomes* a paying subscriber (used below to add them
  // to the AWeber list exactly once, not on every renewal webhook).
  const { data: existing } = await admin.from("subscriptions").select("status").eq("user_id", userId).maybeSingle();
  const wasActive = existing ? ACTIVE_STATUSES.has(existing.status) : false;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: item?.price.id ?? null,
      current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    // Fixed: the Supabase client returns errors in the result object rather
    // than throwing — ignoring `error` here was the actual bug. Now it's
    // logged with full detail and surfaced as a real failure.
    console.error("Supabase upsert into subscriptions failed", {
      userId,
      subscriptionId: subscription.id,
      error,
    });
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  const isNowActive = ACTIVE_STATUSES.has(subscription.status);
  if (isNowActive && !wasActive) {
    const { data: userRes, error: userError } = await admin.auth.admin.getUserById(userId);
    if (userError || !userRes?.user?.email) {
      console.error("Could not look up user for AWeber signup", userId, userError);
    } else {
      const businessName = userRes.user.user_metadata?.business_name;
      await addAWeberSubscriber(userRes.user.email, typeof businessName === "string" ? businessName : undefined);
    }
  }

  return userId;
}
