import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function upsertFromSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    // Fixed: this used to log and silently return "success" to Stripe,
    // which is exactly the kind of failure that looks fine in the Stripe
    // dashboard while nothing actually happens in the database. Throwing
    // here makes the outer handler return a real error status instead.
    throw new Error(`Stripe subscription ${subscription.id} has no supabase_user_id metadata`);
  }

  const item = subscription.items.data[0];
  const admin = createAdminClient();

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
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          await upsertFromSubscription(subscription);
        }
        break;
      }
      default:
        break; // Ignore everything else — only subscription lifecycle matters here.
    }
  } catch (err) {
    console.error("Error handling Stripe webhook event", event.type, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
