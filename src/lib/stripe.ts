import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily constructed so the app can build/boot without a Stripe key set
 * (billing routes will fail clearly at request time instead). */
export function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  return _stripe;
}
