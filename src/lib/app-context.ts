import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES, type Subscription } from "@/lib/types";

/** Loads the signed-in user plus their subscription row. Middleware already
 * keeps signed-out visitors off these routes, but every server component
 * still gets its own user object straight from Supabase — never trust a
 * cached one. Pass `requireActive: true` (the default) to bounce anyone
 * without an active/trialing subscription to /billing; the billing page
 * itself passes `false` so people can always reach the page that lets them
 * pay. */
export async function getAppContext({ requireActive = true }: { requireActive?: boolean } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Subscription>();

  const status = subscription?.status ?? "none";
  const isActive = ACTIVE_STATUSES.has(status);

  if (requireActive && !isActive) {
    redirect("/billing");
  }

  return { supabase, user, subscription, isActive };
}
