"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { findUserIdByEmail } from "@/lib/signup";
import { getStripe } from "@/lib/stripe";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Starts the pay-first signup flow: validates the form, stores the
 * password encrypted in `pending_signups` (never in Stripe, never in
 * plain text), then sends the person straight to Stripe Checkout. The
 * real Supabase account isn't created until Stripe confirms payment —
 * see the webhook and /auth/complete-signup.
 */
export async function startSignup(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const businessName = String(formData.get("businessName") || "").trim();

  if (!email || !password) {
    redirect("/signup?error=" + encodeURIComponent("Enter an email and password."));
  }
  if (password.length < 8) {
    redirect("/signup?error=" + encodeURIComponent("Password must be at least 8 characters."));
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    redirect("/signup?error=" + encodeURIComponent("Billing isn't configured yet — please try again later."));
  }

  const admin = createAdminClient();

  const existingId = await findUserIdByEmail(admin, email);
  if (existingId) {
    redirect("/login?message=" + encodeURIComponent("You already have an account with that email — log in instead."));
  }

  // Note: no redirect() calls inside this try block — it throws a special
  // "NEXT_REDIRECT" error under the hood, which the catch below would
  // otherwise swallow and report as a failure. Results are captured in
  // plain variables instead, and redirected on once we're back outside.
  let checkoutUrl: string | null = null;
  let failureMessage: string | null = null;

  try {
    const { ciphertext, iv, tag } = encryptSecret(password);

    const { data: pending, error: pendingError } = await admin
      .from("pending_signups")
      .upsert(
        {
          email,
          business_name: businessName || null,
          password_ciphertext: ciphertext,
          password_iv: iv,
          password_tag: tag,
          created_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (pendingError || !pending) {
      console.error("Failed to store pending signup", pendingError);
      failureMessage = "Something went wrong. Please try again.";
    } else {
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email,
        metadata: { pending_signup_id: pending.id },
      });

      // No free trial: checkout always starts an immediately-billed
      // subscription, and the account is created only once it's paid.
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customer.id,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: { pending_signup_id: pending.id },
        },
        success_url: `${siteUrl()}/auth/complete-signup?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/signup?checkout=cancelled`,
        allow_promotion_codes: true,
      });

      if (session.url) {
        checkoutUrl = session.url;
      } else {
        failureMessage = "Could not start checkout. Please try again.";
      }
    }
  } catch (err) {
    console.error("startSignup: failed to start checkout", err);
    failureMessage = "Something went wrong starting checkout. Please try again.";
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }
  redirect("/signup?error=" + encodeURIComponent(failureMessage ?? "Something went wrong. Please try again."));
}
