import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-context";
import { getStripe } from "@/lib/stripe";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/** Sends an already-subscribed user to Stripe's hosted billing portal, so
 * they can update payment methods, swap plans, or cancel without any of
 * that logic living in this app. */
export async function POST() {
  const { subscription } = await getAppContext({ requireActive: false });

  if (!subscription?.stripe_customer_id) {
    return NextResponse.redirect(`${siteUrl()}/billing?error=${encodeURIComponent("No billing account yet — subscribe first.")}`, {
      status: 303,
    });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${siteUrl()}/billing`,
  });

  return NextResponse.redirect(session.url, { status: 303 });
}
