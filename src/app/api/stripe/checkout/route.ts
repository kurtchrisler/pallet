import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-context";
import { getStripe } from "@/lib/stripe";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/** Creates (or reuses) a Stripe customer for the signed-in user and starts
 * a subscription Checkout session. Hit this with a plain form POST from
 * the billing page — no client JS needed. */
export async function POST() {
  const { supabase, user, subscription } = await getAppContext({ requireActive: false });
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: "STRIPE_PRICE_ID is not configured." }, { status: 500 });
  }

  let customerId = subscription?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    // Seed a row so later webhook events have something to update; the
    // webhook is still the source of truth for status.
    await supabase
      .from("subscriptions")
      .upsert({ user_id: user.id, stripe_customer_id: customerId, status: "none" }, { onConflict: "user_id" });
  }

  const trialDays = Number(process.env.STRIPE_TRIAL_DAYS || 0);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { supabase_user_id: user.id },
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
    },
    success_url: `${siteUrl()}/dashboard?checkout=success`,
    cancel_url: `${siteUrl()}/billing?checkout=cancelled`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
