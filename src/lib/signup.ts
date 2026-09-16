import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Pages through every Supabase auth user looking for a case-insensitive
 * email match. The admin SDK has no server-side "find by email" filter, so
 * this is the only reliable option — fine at FlipTrackr's current scale,
 * and only ever called on the signup/checkout path, not on hot paths.
 */
export async function findUserIdByEmail(admin: AdminClient, email: string): Promise<string | null> {
  const target = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < perPage) return null; // reached the last page
  }
  return null;
}

/**
 * Turns a pending signup (collected before payment) into a real Supabase
 * account. Safe to call more than once for the same pending signup — the
 * Stripe webhook and the browser's return to the checkout success URL can
 * both race to call this after a payment, and only the first one actually
 * creates anything. Later callers fall back to looking the account up by
 * email once the pending row is gone.
 */
export async function completeSignup({
  pendingSignupId,
  fallbackEmail,
}: {
  pendingSignupId?: string | null;
  fallbackEmail?: string | null;
}): Promise<{ userId: string; email: string } | null> {
  const admin = createAdminClient();

  if (pendingSignupId) {
    const { data: row } = await admin
      .from("pending_signups")
      .select("*")
      .eq("id", pendingSignupId)
      .maybeSingle();

    if (row) {
      const password = decryptSecret({
        ciphertext: row.password_ciphertext,
        iv: row.password_iv,
        tag: row.password_tag,
      });

      const userMetadata: Record<string, string> = {};
      if (row.business_name) userMetadata.business_name = row.business_name;
      if (row.utm_source) userMetadata.utm_source = row.utm_source;
      if (row.utm_medium) userMetadata.utm_medium = row.utm_medium;
      if (row.utm_campaign) userMetadata.utm_campaign = row.utm_campaign;
      if (row.referrer_host) userMetadata.referrer_host = row.referrer_host;

      const { data: created, error } = await admin.auth.admin.createUser({
        email: row.email,
        password,
        email_confirm: true,
        // The handle_new_user() DB trigger copies utm_source/medium/
        // campaign/referrer_host out of this metadata into a new row's
        // profiles columns — see migration 0007 — so this is the only
        // place attribution ever needs to be set.
        user_metadata: Object.keys(userMetadata).length > 0 ? userMetadata : undefined,
      });

      // Clear the pending row now regardless of outcome — either we just
      // used it, or we're about to fall back to an account that already
      // exists with the same email, and there's no reason to keep it.
      await admin.from("pending_signups").delete().eq("id", pendingSignupId);

      if (!error && created?.user) {
        return { userId: created.user.id, email: row.email };
      }

      // Most likely cause: the webhook and the checkout success-page
      // redirect both fired for this payment, and the other one already
      // created the account a moment ago. Fall back to finding it instead
      // of failing the whole request.
      const existingId = await findUserIdByEmail(admin, row.email);
      if (existingId) return { userId: existingId, email: row.email };

      console.error("completeSignup: createUser failed and no existing account found for", row.email, error);
      return null;
    }
  }

  // The pending row was already consumed by whichever of the webhook /
  // success-page paths got here first — find the account that resulted.
  if (fallbackEmail) {
    const existingId = await findUserIdByEmail(admin, fallbackEmail);
    if (existingId) return { userId: existingId, email: fallbackEmail };
  }

  return null;
}
