import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { ACTIVE_STATUSES, type Subscription } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Subscription>();

  const status = subscription?.status ?? "none";
  const isActive = ACTIVE_STATUSES.has(status);

  const badge = isActive ? null : (
    <span className="text-xs bg-alert-soft text-alert rounded-full px-2.5 py-1">
      {status === "none" ? "No plan" : status === "past_due" ? "Payment past due" : "Inactive"}
    </span>
  );

  return (
    <AppShell email={user.email ?? ""} subscriptionBadge={badge}>
      {children}
    </AppShell>
  );
}
