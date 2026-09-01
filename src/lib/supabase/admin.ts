import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses row-level security entirely —
 * use ONLY on the server, and only where that's the point (the Stripe
 * webhook writing subscription status for a user who isn't the one making
 * the request). Never import this into a client component, and never send
 * its key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
