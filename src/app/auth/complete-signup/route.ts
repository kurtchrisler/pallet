import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSubscription } from "@/lib/subscriptions";

function siteUrl(origin: string) {
  return process.env.NEXT_PUBLIC_SITE_URL || origin;
}

/**
 * Where Stripe Checkout sends someone back after they pay on the new
 * pay-first signup flow. Calls the same syncSubscription() the webhook
 * calls — whichever of the two gets here first creates the account and
 * marks the subscription active; the other is a no-op. Doing that here
 * too (not just in the webhook) avoids a real race: without it, someone
 * could land on /dashboard a beat before the webhook arrives and get
 * bounced to /billing as if they hadn't paid. This route's other job is
 * getting them logged in without asking for the password they just typed
 * on the signup form again.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const base = siteUrl(origin);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(`${base}/signup?error=${encodeURIComponent("Missing checkout session.")}`);
  }

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  } catch (err) {
    console.error("complete-signup: could not retrieve checkout session", sessionId, err);
    return NextResponse.redirect(
      `${base}/signup?error=${encodeURIComponent("We couldn't confirm your payment. Please contact support.")}`
    );
  }

  if (session.payment_status !== "paid") {
    return NextResponse.redirect(`${base}/signup?error=${encodeURIComponent("Payment was not completed.")}`);
  }

  const subscription = typeof session.subscription === "string" ? null : session.subscription;
  const genericSuccessMessage =
    "Payment received! If you don't see your account yet, log in with the email and password you just set, or contact support.";

  if (!subscription) {
    console.error("complete-signup: checkout session has no subscription object", sessionId);
    return NextResponse.redirect(`${base}/login?message=${encodeURIComponent(genericSuccessMessage)}`);
  }

  let userId: string | null = null;
  try {
    userId = await syncSubscription(subscription);
  } catch (err) {
    console.error("complete-signup: failed to sync subscription / create account", sessionId, err);
  }

  if (!userId) {
    return NextResponse.redirect(`${base}/login?message=${encodeURIComponent(genericSuccessMessage)}`);
  }

  const admin = createAdminClient();
  const { data: userRes, error: userError } = await admin.auth.admin.getUserById(userId);
  const email = userRes?.user?.email;
  if (userError || !email) {
    console.error("complete-signup: could not look up email for", userId, userError);
    return NextResponse.redirect(`${base}/login?message=${encodeURIComponent(genericSuccessMessage)}`);
  }

  // Log them straight in via a magic link — they already proved they own
  // this email by paying, and their real password is exactly what they
  // typed on the signup form, so there's no reason to make them re-enter
  // it or click a "confirm your email" step first.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${base}/auth/callback?next=/dashboard` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("complete-signup: could not generate login link", email, linkError);
    return NextResponse.redirect(
      `${base}/login?message=${encodeURIComponent("Payment received! Log in with the email and password you just set.")}`
    );
  }

  return NextResponse.redirect(linkData.properties.action_link);
}
